from dotenv import load_dotenv
import os
import discord
from faster_whisper import WhisperModel
from discord.ext import commands, voice_recv
import wave
from ollama import AsyncClient
import asyncio
from pythainlp.util import normalize
import shutil
import aiohttp
import json


# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
MODEL_SIZE = os.getenv("MODEL_SIZE", "large")
DEVICE = os.getenv("DEVICE", "cpu")
LANGUAGE = os.getenv("LANGUAGE", "th")
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "super-secret-bot-key")
NESTJS_BASE_URL = os.getenv("NESTJS_BASE_URL", "http://localhost:4000")

BASE_RECORD_DIR = "recordings"
os.makedirs(BASE_RECORD_DIR, exist_ok=True)


# Opus
if not discord.opus.is_loaded():
    opus_paths = [
        "/opt/homebrew/lib/libopus.dylib",
        "/usr/local/lib/libopus.dylib",
        "libopus.dylib",
    ]
    for path in opus_paths:
        try:
            discord.opus.load_opus(path)
            break
        except Exception:
            continue

# Load Model
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type="int8")
print("Whisper พร้อมใช้งาน")

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
intents.guilds = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)
active_sessions = {}
registered_names = {}

# Sink Voice Client


class MultiUserSink(voice_recv.AudioSink):
    def __init__(self, output_dir):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.files = {}

    def wants_opus(self):
        return False

    def write(self, user, data):
        if not user:
            return
        uid = user.id
        if uid not in self.files:
            path = os.path.join(self.output_dir, f"{uid}.wav")
            wf = wave.open(path, "wb")
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(48000)
            self.files[uid] = wf
        self.files[uid].writeframes(data.pcm)

    def cleanup(self):
        for wf in list(self.files.values()):
            wf.close()
        self.files.clear()


# AI and Data Processing

def format_time(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m:02d}:{s:02d}"


def transcribe_with_whisper(path: str):
    segments, _ = model.transcribe(
        path,
        language=LANGUAGE,
        vad_filter=True,
        beam_size=5,
    )
    return [{
        "start": seg.start,
        "end": seg.end,
        "text": seg.text.strip()
    } for seg in segments]


async def refine_thai(text: str) -> str:
    if not text.strip():
        return ""

    prompt = f"""
        คุณคือผู้ช่วยปรับข้อความภาษาไทยจากการถอดเสียงพูด

        กฎ:
        - ลบคำฟุ่มเฟือย
        - แก้คำสะกดผิดทั่วไป
        - ห้ามเพิ่มข้อมูล
        - ห้ามเดาชื่อเฉพาะ
        - ใช้ภาษาไทยเท่านั้น

        ข้อความ:
        \"\"\"
        {text}
        \"\"\"
    """
    try:
        client = AsyncClient()
        res = await client.chat(
            model="scb10x/typhoon-translate1.5-4b",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2}
        )
        return res["message"]["content"].strip()
    except:
        return text


async def analyze_session(blocks, all_participants):
    convo = "\n".join(
        [f"[{format_time(b['start'])}] {b['speaker']}: {b['text']}" for b in blocks])
    participants_str = ", ".join(all_participants)
    prompt = f"""
        คุณคือ AI ผู้ช่วยสรุปการสอน ผู้เข้าร่วม: {participants_str} บทสนทนา:\n{convo}
        ตอบเป็น JSON: {{
            "session_type": "Tutoring/General", 
            "topic": "หัวข้อที่สอน", 
            "summary": "สรุปเนื้อหา", 
            "roles": {{
                "main_speaker": "ผู้สอน", 
                "active_participants": ["ชื่อคนที่ร่วมพูดคุย"],
                "silent_participants": ["ชื่อคนที่อยู่ในห้องแต่ไม่พูด (ไม่รวมผู้พูดหลัก)"]
            }}
        }}
    """
    try:
        client = AsyncClient()
        res = await client.chat(
            model="scb10x/typhoon-translate1.5-4b",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3, "format": "json"}
        )
        return res["message"]["content"]
    except Exception as e:
        return "{}"


async def process_session_data(channel_id: str, text_channel: discord.TextChannel, session_data: dict, voice_name: str):
    await text_channel.send(f"บันทึกเสียงเสร็จสิ้น กำลังให้ AI ประมวลผลและสรุปบทเรียน (อาจใช้เวลาสักครู่)...")

    record_dir = session_data["record_dir"]
    members_map = session_data["members_map"]
    tutor_id = session_data["tutor_id"]
    command_runner_id = session_data["command_runner_id"]

    speaker_blocks = []
    if os.path.exists(record_dir):
        for file in os.listdir(record_dir):
            if not file.endswith(".wav"):
                continue
            user_id_str = file.replace(".wav", "")
            speaker_name = members_map.get(
                int(user_id_str), f"Unknown-{user_id_str}"
            )

            full_path = os.path.join(record_dir, file)
            loop = asyncio.get_event_loop()
            segments = await loop.run_in_executor(None, transcribe_with_whisper, full_path)

            for seg in segments:
                clean = normalize(seg["text"])
                refiled = await refine_thai(clean)
                if refiled:
                    speaker_blocks.append({
                        "speaker": speaker_name,
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": refiled
                    })
    shutil.rmtree(record_dir, ignore_errors=True)

    if not speaker_blocks:
        await text_channel.send(f"❌ ไม่มีเสียงพูดในคลาสเรียนนี้ครับ")
        return

    speaker_blocks.sort(key=lambda x: x["start"])
    all_names = list(members_map.values())

    analysis_json_str = await analyze_session(speaker_blocks, all_names)

    try:
        analysis_data = json.loads(analysis_json_str)
        payload = {
            "voiceChannelName": voice_name,
            "topic": analysis_data.get('topic', 'ไม่ระบุหัวข้อ'),
            "summary": analysis_data.get('summary', '-'),
            "sessionType": analysis_data.get('session_type', 'ทั่วไป'),
            "discordChannelId": str(channel_id),
            "commandRunnerDiscordId": str(command_runner_id),
            "dataContent": {
                "roles": analysis_data.get('roles', {}),
                "participants": all_names,
                "transcript": speaker_blocks
            }
        }

        post_url = f"{NESTJS_BASE_URL}/tutor/public/{tutor_id}/bot/logs"
        headers = {"x-bot-secret": BOT_API_SECRET,
                   "Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(post_url, json=payload, headers=headers) as response:
                print(f"API Response: {response.status}")

        embed = discord.Embed(
            title=f"สรุปผลการเรียน: {analysis_data.get('topic', 'ไม่ระบุ')}", color=discord.Color.green())
        embed.add_field(name="สรุปเนื้อหา", value=analysis_data.get(
            'summary', '-'), inline=False)
        roles = analysis_data.get('roles', {})
        if roles.get('main_speaker'):
            embed.add_field(
                name="ผู้สอน", value=roles['main_speaker'], inline=True)

        await text_channel.send(embed=embed)

    except Exception as e:
        await text_channel.send(f"⚠️ เกิดข้อผิดพลาดในการสรุปผล: {e}")


# UI Discord Events

class RegistrationModal(discord.ui.Modal, title='ผูกบัญชีผู้เรียน'):
    discord_id_input = discord.ui.TextInput(
        label='Discord ID (ระบบดึงให้อัตโนมัติ)',
        style=discord.TextStyle.short,
        required=True,
    )
    real_name_input = discord.ui.TextInput(
        label='ชื่อ-นามสกุล (ที่ใช้ในระบบเว็บไซต์)',
        placeholder='เช่น สมชาย เรียนดี',
        style=discord.TextStyle.short,
        required=True,
        max_length=100
    )

    def __init__(self, user_id: int):
        super().__init__()
        self.discord_id_input.default = str(user_id)

    async def on_submit(self, interaction: discord.Interaction):
        user_id = interaction.user.id
        real_name = self.real_name_input.value

        await interaction.response.defer(ephemeral=True)

        try:
            payload = {
                "discordId": str(user_id),
                "realName": real_name
            }
            post_url = f"{NESTJS_BASE_URL}/user/public/users/register-discord"
            headers = {"x-bot-secret": BOT_API_SECRET,
                       "Content-Type": "application/json"}

            async with aiohttp.ClientSession() as session:
                async with session.post(post_url, json=payload, headers=headers) as response:
                    if response.status in (200, 201):
                        registered_names[user_id] = real_name
                        print(
                            f"ลงทะเบียน Discord ID {user_id} กับชื่อ {real_name} สำเร็จ")
                        await interaction.followup.send(
                            f"ลงทะเบียนชื่อ **{real_name}** สำเร็จ!\n*(ระบบจำบัญชีของคุณแล้ว ไม่ต้องกดซ้ำในคาบเรียนต่อๆ ไป)*",
                            ephemeral=True
                        )
                    else:
                        error_data = await response.json()
                        error_msg = error_data.get(
                            "message", "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล")
                        await interaction.followup.send(f"**ลงทะเบียนไม่สำเร็จ**\n{error_msg}", ephemeral=True)
        except Exception as e:
            await interaction.followup.send("ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลเว็บไซต์ได้", ephemeral=True)


class ClassroomControlView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="📝 ลงทะเบียนชื่อ", style=discord.ButtonStyle.primary, custom_id="btn_register")
    async def register_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id in registered_names:
            await interaction.response.send_message("✅ คุณได้ทำการลงทะเบียนและผูกบัญชีเรียบร้อยแล้ว ไม่ต้องทำซ้ำครับ!", ephemeral=True)
            return
        await interaction.response.send_modal(RegistrationModal(user_id=interaction.user.id))

    @discord.ui.button(label="▶️ เริ่มอัดเสียง", style=discord.ButtonStyle.green, custom_id="btn_start_record")
    async def start_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.voice:
            await interaction.response.send_message("❌ คุณต้องอยู่ในห้องเสียงก่อนครับ", ephemeral=True)
            return

        voice_channel = interaction.user.voice.channel
        channel_id_str = str(voice_channel.id)

        if channel_id_str in active_sessions:
            await interaction.response.send_message("⚠️ ห้องนี้กำลังดำเนินการอยู่ครับ โปรดรอสักครู่", ephemeral=True)
            return

        active_sessions[channel_id_str] = {"status": "starting"}
        await interaction.response.defer(ephemeral=True)

        tutor_id = None
        members_map = {}
        api_users = {}

        try:
            get_url = f"{NESTJS_BASE_URL}/tutor/public/channel/{channel_id_str}/active"
            async with aiohttp.ClientSession() as session:
                async with session.get(get_url) as response:
                    if response.status == 200:
                        res_json = await response.json()
                        data = res_json.get("data", {})
                        tutor_id = data.get("tutorId")
                        api_users = data.get("mapped_users", {})
                    else:
                        active_sessions.pop(channel_id_str, None)
                        await interaction.followup.send("ไม่พบ Session สำหรับห้องนี้ กรุณาสร้างบนเว็บก่อนครับ")
                        return
        except Exception:
            active_sessions.pop(channel_id_str, None)
            await interaction.followup.send("การเชื่อมต่อกับฐานข้อมูลล้มเหลว")
            return

        api_users.update({str(k): v for k, v in registered_names.items()})

        members_in_vc = [m for m in voice_channel.members if not m.bot]
        unregistered = []
        for member in members_in_vc:
            if str(member.id) in api_users:
                members_map[member.id] = api_users[str(member.id)]
            else:
                members_map[member.id] = member.display_name
                unregistered.append(member.mention)

        if unregistered:
            warning_msg = f"⚠️ ระบบตรวจพบผู้เรียนที่ยังไม่ลงทะเบียน: {', '.join(unregistered)}\n*(บอทจะใช้ชื่อ Discord ของผู้ใช้แทนชั่วคราว)*"
            await interaction.channel.send(warning_msg)

        try:
            vc = voice_channel.guild.voice_client
            if vc is None:
                vc = await voice_channel.connect(cls=voice_recv.VoiceRecvClient, timeout=20.0)
            elif vc.channel != voice_channel:
                await vc.move_to(voice_channel)
            elif not vc.is_connected():
                await vc.disconnect(force=True)
                vc = await voice_channel.connect(cls=voice_recv.VoiceRecvClient, timeout=20.0)

            record_dir = os.path.join(BASE_RECORD_DIR, channel_id_str)
            os.makedirs(record_dir, exist_ok=True)

            sink = MultiUserSink(output_dir=record_dir)

            session_data = {
                "vc": vc,
                "sink": sink,
                "tutor_id": tutor_id,
                "record_dir": record_dir,
                "members_map": members_map,
                "command_runner_id": interaction.user.id,
                "status": "recording"
            }

            active_sessions[channel_id_str] = session_data

            vc.listen(sink)
            await interaction.followup.send(f"เริ่มบันทึกการเรียนการสอนห้อง **{voice_channel.name}** แล้วครับ!")

        except Exception as e:
            active_sessions.pop(channel_id_str, None)
            if voice_channel.guild.voice_client:
                await voice_channel.guild.voice_client.disconnect(force=True)
            await interaction.followup.send(f"ระบบเสียงขัดข้อง: บอทไม่สามารถเข้าห้องเสียงได้ ({e})")
            # traceback.print_exc()

    @discord.ui.button(label="⏹️ หยุดและสรุปผล", style=discord.ButtonStyle.red, custom_id="btn_stop_record")
    async def stop_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.voice:
            await interaction.response.send_message("คุณต้องอยู่ในห้องเสียงเพื่อสั่งหยุดครับ", ephemeral=True)
            return

        channel_id_str = str(interaction.user.voice.channel.id)
        session_data = active_sessions.get(channel_id_str)
        voice_channel = interaction.user.voice.channel
        voice_name = voice_channel.name

        if not session_data or session_data.get("status") == "starting":
            await interaction.response.send_message("ห้องนี้ไม่ได้กำลังบันทึกเสียงอยู่ครับ", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True)
        active_sessions.pop(channel_id_str, None)

        vc = session_data["vc"]
        sink = session_data["sink"]

        try:
            vc.stop_listening()
            sink.cleanup()
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"เกิดข้อผิดพลาดตอนหยุดอัด: {e}")

        await vc.disconnect(force=True)

        asyncio.create_task(process_session_data(
            channel_id_str, interaction.channel, session_data, voice_name))
        await interaction.followup.send("⏹️ หยุดบันทึกแล้ว ระบบกำลังนำไปประมวลผลสรุปเนื้อหาคลาสเรียนครับ...")


@bot.event
async def on_voice_state_update(member, before, after):
    if member.bot:
        return

    if after.channel is not None and before.channel != after.channel:
        voice_channel = after.channel
        guild = voice_channel.guild

        text_channel_name = f"คลาสเรียน-{voice_channel.name}".lower().replace(
            " ", "-")
        existing_text_channel = discord.utils.get(
            guild.text_channels, name=text_channel_name)

        if not existing_text_channel:
            overwrites = {
                guild.default_role: discord.PermissionOverwrite(read_messages=False),
                guild.me: discord.PermissionOverwrite(read_messages=True),
                member: discord.PermissionOverwrite(read_messages=True)
            }
            new_channel = await guild.create_text_channel(
                name=text_channel_name,
                category=voice_channel.category,
                overwrites=overwrites
            )

            embed = discord.Embed(
                title="🎓 ยินดีต้อนรับเข้าสู่ชั้นเรียนอัจฉริยะ",
                description=(
                    "**สำหรับผู้เรียน:** กรุณากดปุ่ม `ลงทะเบียนชื่อ` (ทำครั้งเดียว)\n"
                    "**สำหรับผู้สอน:** กดปุ่ม `เริ่มอัดเสียง` เมื่อพร้อมสอน"
                ),
                color=discord.Color.blue()
            )

            view = ClassroomControlView()
            await new_channel.send(content=f"🔔 สวัสดีครับ {member.mention}", embed=embed, view=view)
        else:
            await existing_text_channel.set_permissions(member, read_messages=True)
            if member.id not in registered_names:
                await existing_text_channel.send(f"👋 {member.mention} เข้าร่วมห้องเรียน อย่าลืมกดปุ่มลงทะเบียนด้านบนนะครับ!", delete_after=30)

    if before.channel is not None and before.channel != after.channel:
        voice_channel = before.channel
        guild = voice_channel.guild
        text_channel_name = f"คลาสเรียน-{voice_channel.name}".lower().replace(
            " ", "-")

        existing_text_channel = discord.utils.get(
            guild.text_channels, name=text_channel_name)

        if existing_text_channel:
            await existing_text_channel.set_permissions(member, overwrite=None)
            members_in_vc = [m for m in voice_channel.members if not m.bot]

            if len(members_in_vc) == 0:
                await existing_text_channel.delete()
                vc = guild.voice_client
                if vc and vc.channel == voice_channel:
                    channel_id_str = str(voice_channel.id)
                    if channel_id_str in active_sessions:
                        session_data = active_sessions.pop(channel_id_str)
                        try:
                            vc.stop_listening()
                            session_data["sink"].cleanup()
                        except Exception:
                            pass
                        if session_data.get("status") == "recording":
                            asyncio.create_task(process_session_data(
                                channel_id_str, existing_text_channel, session_data))

                    await vc.disconnect(force=True)


@bot.event
async def on_ready():
    print(f"ระบบ discord.py เชื่อมต่อสำเร็จ: {bot.user}")
    bot.add_view(ClassroomControlView())

bot.run(TOKEN)
