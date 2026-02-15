from dotenv import load_dotenv
import os
import discord
from discord.ext import commands, voice_recv
from faster_whisper import WhisperModel
import wave
import asyncio
from ollama import AsyncClient
import datetime
import json
from pythainlp.util import normalize as normalize
import aiohttp

# Setup environment variables and constants
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
MODEL_SIZE = os.getenv("MODEL_SIZE")
DEVICE = os.getenv("DEVICE")
LANGUAGE = os.getenv("LANGUAGE")
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "super-secret-bot-key")
NESTJS_BASE_URL = os.getenv(
    "NESTJS_BASE_URL", "http://localhost:4000/tutor/public")

MAX_RECORD_SECONDS = 3600  # max recording 1 hour
SAMPLE_RATE = 48000
SAMPLE_WIDTH = 2
CHANNELS = 2

RECORD_DIR = "recordings"
os.makedirs(RECORD_DIR, exist_ok=True)

LOGFILE_DIR = "session_logs"
os.makedirs(LOGFILE_DIR, exist_ok=True)


# Load library and model
if not discord.opus.is_loaded():
    for path in [
        "libopus.dylib",
        "/opt/homebrew/lib/libopus.dylib",
        "/usr/local/lib/libopus.dylib",
        "libopus.so",
    ]:
        try:
            discord.opus.load_opus(path)
            break
        except OSError:
            pass

print(f"กำลังโหลด Whisper)")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type="int8")
print("Whisper พร้อมใช้งาน")

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
bot = commands.Bot(command_prefix="!", intents=intents)


# function to format time in MM:SS
def format_time(seconds: float) -> str:
    """แปลงวินาทีเป็นรูปแบบ นาที:วินาที (MM:SS)"""
    m, s = divmod(int(seconds), 60)
    return f"{m:02d}:{s:02d}"


class MultiUserSink(voice_recv.AudioSink):
    def __init__(self):
        self.files = {}

    def wants_opus(self):
        return False

    def write(self, user, data):
        if not user:
            return

        uid = user.id
        if uid not in self.files:
            path = os.path.join(RECORD_DIR, f"{uid}.wav")
            wf = wave.open(path, "wb")
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH)
            wf.setframerate(SAMPLE_RATE)
            self.files[uid] = wf

        self.files[uid].writeframes(data.pcm)

    def cleanup(self):
        for wf in self.files.values():
            wf.close()


def transcribe_with_timestamp(path: str):
    segments, _ = model.transcribe(
        path,
        language=LANGUAGE,
        vad_filter=True,
        beam_size=5
    )

    results = []
    for seg in segments:
        results.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        })
    return results


# Registered names mapping: user_id -> real_name
registered_names = {}


class NameRegistrationModal(discord.ui.Modal, title='ลงทะเบียนชื่อจริง'):
    name_input = discord.ui.TextInput(
        label='ชื่อ-นามสกุล',
        placeholder='พิมพ์ชื่อของคุณที่นี่',
        required=True,
        max_length=50
    )

    async def on_submit(self, interaction: discord.Interaction):
        user_id = interaction.user.id
        real_name = self.name_input.value
        registered_names[user_id] = real_name

        await interaction.response.send_message(
            f"บันทึกชื่อ **{real_name}** ให้กับ {interaction.user.mention} เรียบร้อยแล้ว!",
            ephemeral=True
        )


class RegistrationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="ลงทะเบียนชื่อจริง", style=discord.ButtonStyle.primary, custom_id="register_real_name_btn")
    async def register_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(NameRegistrationModal())


# LLM 1 Refine Thai text
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

    client = AsyncClient()
    res = await client.chat(
        model="scb10x/typhoon-translate1.5-4b",
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0.2}
    )

    return res["message"]["content"].strip()


# LLM 2 Analyze and summarize session
async def analyze_session(blocks, all_participants):
    convo = ""
    for b in blocks:
        convo += f"[{format_time(b['start'])}] {b['speaker']}: {b['text']}\n"

    participants_str = ", ".join(all_participants)

    prompt = f"""
        คุณคือ AI ผู้ช่วยสรุปการประชุมและบทสนทนา
        
        ข้อมูลบริบท:
        - ผู้เข้าร่วมทั้งหมดในห้อง: {participants_str}
        
        บทสนทนา:
        \"\"\"
        {convo}
        \"\"\"

        คำสั่ง:
        1. วิเคราะห์ว่าบทสนทนานี้เป็นประเภทใด: "Tutoring" (การเรียน/สอน) หรือ "General" (คุยเล่น/ทั่วไป)
        2. สรุปเนื้อหาใจความสำคัญ
        3. ถ้าเป็น Tutoring ให้ระบุผู้สอน(Instructor) และผู้เรียน(Students)
        4. ตอบกลับเป็น JSON Format เท่านั้น ตามโครงสร้างนี้:
        
        {{
            "session_type": "Tutoring หรือ General",
            "topic": "หัวข้อหลัก",
            "summary": "สรุปเนื้อหา...",
            "roles": {{
                "main_speaker": "ชื่อผู้พูดหลัก/ผู้สอน (ถ้ามี)",
                "active_participants": ["ชื่อคนที่ร่วมพูดคุย"],
                "silent_participants": ["ชื่อคนที่อยู่ในห้องแต่ไม่พูด (ไม่รวมผู้พูดหลัก)"]
            }}
        }}
    """

    client = AsyncClient()
    res = await client.chat(
        model="scb10x/typhoon-translate1.5-4b",
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0.3, "format": "json"}
    )

    return res["message"]["content"]


# Setup Discord bot commands
@bot.command()
async def join(ctx):
    if not ctx.author.voice:
        await ctx.send("ต้องอยู่ในห้องเสียงก่อนนะถึงจะเรียกบอทได้")
        return

    channel = ctx.author.voice.channel

    if not ctx.voice_client:
        await channel.connect(cls=voice_recv.VoiceRecvClient)

    members_in_vc = [m for m in channel.members if not m.bot]

    unregistered_members = [
        m for m in members_in_vc if m.id not in registered_names]

    if unregistered_members:
        mentions = " ".join([m.mention for m in unregistered_members])
        view = RegistrationView()
        await ctx.send(
            f"บอทเข้าห้องแล้ว!\n"
            f"**ผู้เข้าร่วมต่อไปนี้ กรุณากดปุ่มลงทะเบียนชื่อจริงก่อนเริ่มอัดเสียง:**\n{mentions}",
            view=view
        )
    else:
        await ctx.send("เข้าห้องเรียบร้อย! ทุกคนลงทะเบียนชื่อจริงครบแล้ว พิมพ์ `!start` เพื่อเริ่มได้เลย")


@bot.command()
async def start(ctx, seconds: int, tutor_id: str):
    if seconds > MAX_RECORD_SECONDS:
        await ctx.send("อัดเสียงได้สูงสุด 1 ชั่วโมงนะครับ")
        return

    if not ctx.author.voice:
        await ctx.send("ต้องอยู่ในห้องเสียงก่อนนะครับ")
        return

    channel = ctx.author.voice.channel
    members_in_vc = [m for m in channel.members if not m.bot]
    unregistered = [m for m in members_in_vc if m.id not in registered_names]

    if unregistered:
        mentions = " ".join([m.mention for m in unregistered])
        await ctx.send(f"**ไม่สามารถเริ่มอัดได้!**\nผู้ใช้ต่อไปนี้ยังไม่ได้ลงทะเบียนชื่อจริง: {mentions}\n*(ให้พิมพ์ `!join` อีกครั้งเพื่อเรียกปุ่มลงทะเบียน)*")
        return

    try:
        vc = ctx.voice_client or await ctx.author.voice.channel.connect(
            cls=voice_recv.VoiceRecvClient
        )

        sink = MultiUserSink()
        vc.listen(sink)

        await ctx.send(f"เริ่มอัดเสียงเป็นเวลา {seconds} วินาที...")
        await asyncio.sleep(seconds)

        await ctx.send("หมดเวลาอัดเสียง! กำลังถอดเสียงและประมวลผล (อาจใช้เวลาสักครู่)...")

        members_map = {
            member.id: registered_names.get(member.id, member.display_name)
            for member in members_in_vc
        }
        members_in_channel_names = list(members_map.values())

        vc.stop_listening()
        sink.cleanup()

        try:
            await asyncio.wait_for(vc.disconnect(), timeout=3.0)
        except asyncio.TimeoutError:
            print("แจ้งเตือน: ปิดการเชื่อมต่อช้ากว่าปกติ ข้ามไปขั้นตอนถัดไป")

        has_files = any(f.endswith(".wav") for f in os.listdir(RECORD_DIR))
        if not has_files:
            await ctx.send("ไม่มีใครพูดเลยในระหว่างอัดเสียง จึงไม่มีผลสรุปครับ")
            return

        speaker_blocks = []
        recorded_speakers = set()

        for file in os.listdir(RECORD_DIR):
            if not file.endswith(".wav"):
                continue

            user_id_str = file.replace(".wav", "")
            try:
                user_id = int(user_id_str)
                speaker_name = members_map.get(user_id, f"Unknown-{user_id}")
            except ValueError:
                speaker_name = user_id_str

            recorded_speakers.add(speaker_name)
            full_path = os.path.join(RECORD_DIR, file)

            loop = asyncio.get_running_loop()
            segments = await loop.run_in_executor(None, transcribe_with_timestamp, full_path)

            for seg in segments:
                clean = normalize(seg["text"])
                refined = await refine_thai(clean)

                if refined:
                    speaker_blocks.append({
                        "speaker": speaker_name,
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": refined
                    })

            os.remove(full_path)

        speaker_blocks.sort(key=lambda x: x["start"])

        # unique timestamp for filenames
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        txt_filename = os.path.join(LOGFILE_DIR, f"{timestamp}_transcript.txt")
        json_filename = os.path.join(LOGFILE_DIR, f"{timestamp}_summary.json")

        with open(txt_filename, "w", encoding="utf-8") as f:
            f.write(
                f"ผู้เข้าร่วมทั้งหมด: {', '.join(members_in_channel_names)}\n")
            f.write("="*50 + "\n\n")
            for b in speaker_blocks:
                f.write(
                    f"[{format_time(b['start'])}] {b['speaker']}: {b['text']}\n")

        analysis_json_str = await analyze_session(speaker_blocks, members_in_channel_names)

        try:
            analysis_data = json.loads(analysis_json_str)

            with open(json_filename, "w", encoding="utf-8") as f:
                json.dump(analysis_data, f, ensure_ascii=False, indent=4)

            payload = {
                "topic": analysis_data.get('topic', 'ไม่ระบุหัวข้อ'),
                "summary": analysis_data.get('summary', '-'),
                "sessionType": analysis_data.get('session_type', 'ทั่วไป'),
                "discordChannelId": str(ctx.channel.id),
                "commandRunnerDiscordId": str(ctx.author.id),
                "dataContent": {
                    "roles": analysis_data.get('roles', {}),
                    "participants": members_in_channel_names,
                    "transcript": speaker_blocks
                }
            }

            patch_url = f"{NESTJS_BASE_URL}/{tutor_id}/bot"
            headers = {
                "x-bot-secret": BOT_API_SECRET,
                "Content-Type": "application/json"
            }

            try:
                async with aiohttp.ClientSession() as session:
                    async with session.patch(patch_url, json=payload, headers=headers) as response:
                        if response.status in (200, 201):
                            await ctx.send("ส่งข้อมูลบันทึกเข้าสู่ระบบฐานข้อมูล (NestJS) สำเร็จ!")
                        else:
                            error_text = await response.text()
                            await ctx.send(f"ไม่สามารถบันทึกลง Database ได้ (Status: {response.status})\n```{error_text}```")
            except Exception as api_err:
                print(f"API Error: {api_err}")
                await ctx.send("การเชื่อมต่อกับ Backend ล้มเหลว (ตรวจสอบว่า NestJS รันอยู่หรือไม่)")

            embed = discord.Embed(
                title=f"สรุปผล: {analysis_data.get('topic', 'ไม่ระบุ')}",
                color=discord.Color.green() if analysis_data.get(
                    'session_type') == 'Tutoring' else discord.Color.blue()
            )
            embed.add_field(name="ประเภท", value=analysis_data.get(
                'session_type', 'ทั่วไป'), inline=True)
            embed.add_field(name="สรุปเนื้อหา", value=analysis_data.get(
                'summary', '-'), inline=False)

            roles = analysis_data.get('roles', {})
            if roles.get('main_speaker'):
                embed.add_field(name="ผู้พูดหลัก/ผู้สอน",
                                value=roles['main_speaker'], inline=True)

            silent = [
                m for m in members_in_channel_names if m not in recorded_speakers]
            if silent:
                embed.add_field(name="ผู้ฟัง (ไม่ได้เปิดไมค์)",
                                value=", ".join(silent), inline=False)

            await ctx.send(embed=embed)

        except json.JSONDecodeError:
            error_filename = os.path.join(
                LOGFILE_DIR, f"{timestamp}_summary_error.txt")
            with open(error_filename, "w", encoding="utf-8") as f:
                f.write(analysis_json_str)
            await ctx.send(f"**สรุปจาก AI (รูปแบบข้อความดิบ):**\n```json\n{analysis_json_str}\n```")

    except Exception as e:
        print(f"พบข้อผิดพลาดร้ายแรง: {e}")
        await ctx.send(f"ระบบเกิดข้อผิดพลาด:\n```\n{e}\n```")


@bot.event
async def on_ready():
    print(f"บอท {bot.user} พร้อมใช้งานและเชื่อมต่อแล้ว!")

bot.run(TOKEN)
