from discord.opus import Decoder as _OpusDecoder
from discord.ext.voice_recv import rtp as _rtp
from discord.ext.voice_recv.reader import AudioReader as _AudioReader
from discord.ext.voice_recv.opus import PacketDecoder as _PacketDecoder
from dotenv import load_dotenv
import os
import threading
import discord
from faster_whisper import WhisperModel
from discord.ext import commands, voice_recv
import wave
import asyncio
from pythainlp.util import normalize
import shutil
import aiohttp
import json
import re
import struct
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
MODEL_SIZE = os.getenv("MODEL_SIZE", "large")
DEVICE = os.getenv("DEVICE", "cpu")
LANGUAGE = os.getenv("LANGUAGE", "th")
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "super-secret-bot-key")
NESTJS_BASE_URL = os.getenv("NESTJS_BASE_URL", "http://localhost:4000")
TYPHOON_KEY = os.getenv("TYPHOON_KEY")

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

# Patch _decode_packet to catch occasional Opus errors (safety net)
_original_decode_packet = _PacketDecoder._decode_packet
_SILENCE_FRAME = b'\x00' * \
    (_OpusDecoder.SAMPLES_PER_FRAME * _OpusDecoder.CHANNELS * 2)


def _safe_decode_packet(self, packet):
    try:
        return _original_decode_packet(self, packet)
    except Exception:
        return packet, _SILENCE_FRAME


_PacketDecoder._decode_packet = _safe_decode_packet

# Patch AudioReader.callback to add DAVE decryption after transport decryption
_original_callback = _AudioReader.callback
_dave_log = logging.getLogger('dave_patch')


def _patched_callback(self, packet_data: bytes) -> None:
    """Wraps original callback to inject DAVE decryption on RTP packets."""
    packet = rtp_packet = rtcp_packet = None
    try:
        from nacl.exceptions import CryptoError

        if not _rtp.is_rtcp(packet_data):
            packet = rtp_packet = _rtp.decode_rtp(packet_data)
            packet.decrypted_data = self.decryptor.decrypt_rtp(packet)

            # --- DAVE decryption ---
            vc = self.voice_client
            conn = vc._connection
            dave = getattr(conn, 'dave_session', None)
            if dave:
                ssrc = rtp_packet.ssrc
                user_id = vc._ssrc_to_id.get(ssrc)
                if user_id is not None and packet.decrypted_data:
                    try:
                        import davey
                        decrypted = dave.decrypt(
                            user_id,
                            davey.MediaType.audio,
                            packet.decrypted_data,
                        )
                        if decrypted:
                            packet.decrypted_data = decrypted
                    except Exception:
                        pass
            # --- end DAVE ---

        else:
            packet = rtcp_packet = _rtp.decode_rtcp(
                self.decryptor.decrypt_rtcp(packet_data)
            )
            from discord.ext.voice_recv.rtp import ReceiverReportPacket
            if not isinstance(packet, ReceiverReportPacket):
                pass
    except CryptoError:
        return
    except Exception:
        if self._is_ip_discovery_packet(packet_data):
            return
        _dave_log.debug("Error unpacking packet")
    finally:
        if self.error:
            self.stop()
            return
        if not packet:
            return

    if rtcp_packet:
        self.packet_router.feed_rtcp(rtcp_packet)
    elif rtp_packet:
        ssrc = rtp_packet.ssrc
        if ssrc not in self.voice_client._ssrc_to_id:
            if rtp_packet.is_silence():
                return
        self.speaking_timer.notify(ssrc)
        try:
            self.packet_router.feed_rtp(rtp_packet)
        except Exception as e:
            _dave_log.exception('Error processing rtp packet')
            self.error = e
            self.stop()


_AudioReader.callback = _patched_callback


def enable_dave_passthrough(vc):
    """Enable permanent DAVE passthrough mode for receiving audio.

    With passthrough enabled:
    - DAVE-encrypted data → decrypt() works normally
    - Unencrypted data (during transitions) → passes through without error
    This eliminates the 'UnencryptedWhenPassthroughDisabled' errors.
    """
    try:
        conn = vc._connection
        dave = getattr(conn, 'dave_session', None)
        if dave:
            dave.set_passthrough_mode(True)
            print("[DAVE] Passthrough mode enabled for voice receiving")
    except Exception as e:
        print(f"[DAVE] Warning: could not enable passthrough: {e}")


# Load LLM
llm = ChatOpenAI(
    base_url="https://api.opentyphoon.ai/v1",
    api_key=TYPHOON_KEY,
    model='typhoon-v2.5-30b-a3b-instruct',
    temperature=0.3,
    max_tokens=4000,
)
print("กำลัง downloadโมเดล Whisper (ครั้งแรกอาจใช้เวลานานหน่อยนะครับ)...")

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

ai_processing_queue = asyncio.Queue()

# Sink Voice Client


class MultiUserSink(voice_recv.AudioSink):
    # Minimum RMS energy threshold to filter silence/noise frames
    SILENCE_THRESHOLD = 30

    def __init__(self, output_dir):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.files = {}
        self._lock = threading.Lock()
        self._closed = False

    def wants_opus(self):
        return False

    @staticmethod
    def _is_silence(pcm_data: bytes) -> bool:
        """Check if a PCM frame is silence using RMS energy."""
        if len(pcm_data) < 2:
            return True
        try:
            samples = struct.unpack(f'<{len(pcm_data) // 2}h', pcm_data)
            rms = (sum(s * s for s in samples) / len(samples)) ** 0.5
            return rms < MultiUserSink.SILENCE_THRESHOLD
        except Exception:
            return False

    @staticmethod
    def _stereo_to_mono(pcm_data: bytes) -> bytes:
        """Convert stereo PCM16 to mono by averaging L/R channels."""
        try:
            samples = struct.unpack(f'<{len(pcm_data) // 2}h', pcm_data)
            mono = []
            for i in range(0, len(samples), 2):
                avg = (samples[i] + samples[i + 1]) // 2
                mono.append(avg)
            return struct.pack(f'<{len(mono)}h', *mono)
        except Exception:
            return pcm_data

    def write(self, user, data):
        if not user:
            return
        with self._lock:
            if self._closed:
                return
            try:
                pcm = data.pcm
                # Skip silence frames to reduce file size and improve STT
                if self._is_silence(pcm):
                    return
                # Convert to mono for better STT accuracy
                mono_pcm = self._stereo_to_mono(pcm)
                uid = user.id
                if uid not in self.files:
                    path = os.path.join(self.output_dir, f"{uid}.wav")
                    wf = wave.open(path, "wb")
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(48000)
                    self.files[uid] = wf
                self.files[uid].writeframes(mono_pcm)
            except Exception as e:
                print(f"Sink write error (ignored): {e}")

    def cleanup(self):
        with self._lock:
            self._closed = True
            for wf in list(self.files.values()):
                try:
                    wf.close()
                except Exception:
                    pass
            self.files.clear()


# AI and Data Processing

def format_time(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m:02d}:{s:02d}"


def extract_json_from_text(text: str) -> str:
    text = text.strip()
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        return match.group(1)
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        return match.group(1)
    return text


def transcribe_with_whisper(path: str):
    if os.path.getsize(path) < 100000:
        return []

    segments, _ = model.transcribe(
        path,
        language=LANGUAGE,
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=300,
            speech_pad_ms=200,
            threshold=0.4,
        ),
        beam_size=3,
        condition_on_previous_text=False,
        no_speech_threshold=0.5,
    )
    return [{
        "start": seg.start,
        "end": seg.end,
        "text": seg.text.strip()
    } for seg in segments if seg.text.strip()]


async def analyze_session(blocks, all_participants):
    convo = "\n".join(
        [f"[{format_time(b['start'])}] {b['speaker']}: {b['text']}" for b in blocks])
    participants_str = ", ".join(all_participants)
    prompt = f"ผู้เข้าร่วม: {participants_str}\nหมายเหตุ: ถอดเสียงอัตโนมัติ ให้ประมวลผลข้ามคำผิดและสรุปใจความสำคัญ\n\nบทสนทนา:\n{convo}"

    messages = [
        SystemMessage(content="""คุณคือ AI ผู้ช่วยสรุปการสอน 
        ตอบกลับเป็น JSON format เท่านั้น ห้ามมีข้อความอื่น โครงสร้าง:
        {
            "session_type": "Tutoring/General", 
            "topic": "หัวข้อที่สอน", 
            "summary": "สรุปเนื้อหา", 
            "roles": {
                "main_speaker": "ผู้สอน", 
                "active_participants": ["ชื่อคนที่พูด"],
                "silent_participants": ["ชื่อคนที่ไม่พูด"]
            }
        }"""),
        HumanMessage(content=prompt)
    ]

    try:
        response = await llm.ainvoke(messages)
        return extract_json_from_text(response.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return None


# Background Task to Process Session Data

async def ai_worker():
    await bot.wait_until_ready()
    print("Background AI Worker สแตนด์บายพร้อมรับงาน!")
    while not bot.is_closed():
        task = await ai_processing_queue.get()
        try:
            await process_session_data(task["channel_id"], task["text_channel"], task["session_data"], task["voice_name"])
        except Exception as e:
            print(f"Worker Error: {e}")
        finally:
            ai_processing_queue.task_done()


async def process_session_data(channel_id: str, text_channel: discord.TextChannel, session_data: dict, voice_name: str):
    status_msg = await text_channel.send(f"** บันทึกเสียงเสร็จสิ้น กำลังถอดรหัสเสียง** (ขั้นตอน 1/2)...")

    record_dir = session_data["record_dir"]
    members_map = session_data["members_map"]
    tutor_id = session_data["tutor_id"]
    command_runner_id = session_data["command_runner_id"]

    speaker_blocks = []
    loop = asyncio.get_running_loop()

    if os.path.exists(record_dir):
        files = [f for f in os.listdir(record_dir) if f.endswith(".wav")]
        for idx, file in enumerate(files, 1):
            user_id_str = file.replace(".wav", "")
            speaker_name = members_map.get(int(user_id_str), registered_names.get(
                int(user_id_str), f"Unknown-{user_id_str}"))
            full_path = os.path.join(record_dir, file)

            print(f"[{voice_name}] ถอดเสียง {speaker_name} ({idx}/{len(files)})...")
            try:
                segments = await loop.run_in_executor(None, transcribe_with_whisper, full_path)
                for seg in segments:
                    clean = normalize(seg["text"])
                    if len(clean) > 2:
                        speaker_blocks.append({
                            "speaker": speaker_name, "start": seg["start"],
                            "end": seg["end"], "text": clean
                        })
            except Exception as e:
                print(f"Error STT: {e}")

    shutil.rmtree(record_dir, ignore_errors=True)

    if not speaker_blocks:
        await status_msg.edit(content=f"❌ ไม่มีเสียงพูดในคลาสเรียนนี้ครับ")
        return

    speaker_blocks.sort(key=lambda x: x["start"])
    all_names = list(members_map.values())
    await status_msg.edit(content=f"**ถอดเสียงเสร็จสิ้น!**\nกำลังให้ AI สรุปเนื้อหาและส่งเข้าฐานข้อมูล (ขั้นตอน 2/2)...")

    analysis_json_str = await analyze_session(speaker_blocks, all_names)

    if not analysis_json_str:
        await status_msg.edit(content=f"**ขัดข้อง:** เชื่อมต่อกับ AI ไม่สำเร็จ")
        return

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

        async with aiohttp.ClientSession() as http_session:
            async with http_session.post(post_url, json=payload, headers=headers) as response:
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

class RegistrationModal(discord.ui.Modal, title='ยืนยันการเข้าร่วมการติว'):
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

            async with aiohttp.ClientSession() as http_session:
                async with http_session.post(post_url, json=payload, headers=headers) as response:
                    if response.status in (200, 201):
                        registered_names[user_id] = real_name
                        print(
                            f"ยืนยัน Discord ID {user_id} กับชื่อ {real_name} สำเร็จ")
                        await interaction.followup.send(
                            f"ยืนยันการเข้าร่วม **{real_name}** สำเร็จ!\n*(ระบบจำบัญชีของคุณแล้ว ไม่ต้องกดซ้ำในคาบเรียนต่อๆ ไป)*",
                            ephemeral=True
                        )
                    else:
                        error_data = await response.json()
                        error_msg = error_data.get(
                            "message", "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล")
                        await interaction.followup.send(f"**ยืนยันไม่สำเร็จ**\n{error_msg}", ephemeral=True)
        except Exception as e:
            await interaction.followup.send("ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลเว็บไซต์ได้", ephemeral=True)


class HostView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

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

        await interaction.response.defer(ephemeral=True)

        tutor_id = None
        discord_id = None
        hostName = None
        members_map = {}
        api_users = {}

        try:
            get_url = f"{NESTJS_BASE_URL}/tutor/public/channel/{channel_id_str}/active"
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(get_url) as response:
                    if response.status == 200:
                        res_json = await response.json()
                        data = res_json.get("data", {})
                        tutor_id = data.get("tutorId")
                        discord_id = data.get("discordId")
                        hostName = data.get("hostName")
                        api_users = data.get("mapped_users", {})
                    else:
                        await interaction.followup.send("❌ ไม่พบ Session สำหรับห้องนี้ กรุณาสร้างบนเว็บก่อนครับ")
                        return
        except Exception:
            await interaction.followup.send("⚠️ การเชื่อมต่อกับฐานข้อมูลล้มเหลว")
            return

        if str(interaction.user.id) != str(discord_id):
            await interaction.followup.send("❌ เฉพาะ **ผู้สอน (เจ้าของ Session)** เท่านั้นที่สามารถเริ่มอัดเสียงได้ครับ")
            return

        active_sessions[channel_id_str] = {"status": "starting"}

        if hostName:
            api_users[str(interaction.user.id)] = hostName
            registered_names[interaction.user.id] = hostName

        api_users.update({str(k): v for k, v in registered_names.items()})

        members_in_vc = [m for m in voice_channel.members if not m.bot]
        unregistered = []
        for member in members_in_vc:
            if str(member.id) in api_users:
                members_map[member.id] = api_users[str(member.id)]
            else:
                members_map[member.id] = member.display_name
                unregistered.append(member.mention)

        # Check if there are any registered users in the channel
        registered_in_vc = [
            uid for uid in members_map if str(uid) in api_users]
        if not registered_in_vc:
            active_sessions.pop(channel_id_str, None)
            await interaction.followup.send(
                "❌ ไม่มีผู้เรียนที่ลงทะเบียนอยู่ในห้องเสียง\n"
                "กรุณาให้ผู้เรียนกดปุ่ม **เข้าร่วม** ก่อนเริ่มอัดเสียงครับ"
            )
            return

        if unregistered:
            warning_msg = f"⚠️ ระบบตรวจพบผู้เรียนที่ยังไม่ลงทะเบียน: {', '.join(unregistered)}\n*(บอทจะใช้ชื่อ Discord ของผู้ใช้แทนชั่วคราว)*"
            await interaction.channel.send(warning_msg)

        try:
            vc = voice_channel.guild.voice_client
            if vc is not None:
                try:
                    if not vc.is_connected() or vc.channel != voice_channel:
                        await vc.disconnect(force=True)
                        await asyncio.sleep(0.5)
                        vc = None
                except Exception:
                    vc = None

            if vc is None:
                vc = await voice_channel.connect(cls=voice_recv.VoiceRecvClient, timeout=20.0)

            # Enable DAVE passthrough so received audio isn't rejected
            enable_dave_passthrough(vc)

            record_dir = os.path.join(BASE_RECORD_DIR, channel_id_str)
            os.makedirs(record_dir, exist_ok=True)

            sink = MultiUserSink(output_dir=record_dir)

            session_data = {
                "vc": vc,
                "sink": sink,
                "tutor_id": tutor_id,
                "discord_id": discord_id,
                "hostName": hostName,
                "record_dir": record_dir,
                "members_map": members_map,
                "command_runner_id": interaction.user.id,
                "status": "recording"
            }

            active_sessions[channel_id_str] = session_data

            vc.listen(sink)
            await interaction.followup.send(f"✅ เริ่มบันทึกการเรียนการสอนห้อง **{voice_channel.name}** แล้วครับ!")

        except Exception as e:
            active_sessions.pop(channel_id_str, None)
            if voice_channel.guild.voice_client:
                await voice_channel.guild.voice_client.disconnect(force=True)
            await interaction.followup.send(f"❌ ระบบเสียงขัดข้อง: บอทไม่สามารถเข้าห้องเสียงได้ ({e})")

    @discord.ui.button(label="⏹️ หยุดและสรุปผล", style=discord.ButtonStyle.red, custom_id="btn_stop_record")
    async def stop_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.voice:
            await interaction.response.send_message("❌ คุณต้องอยู่ในห้องเสียงเพื่อสั่งหยุดครับ", ephemeral=True)
            return

        channel_id_str = str(interaction.user.voice.channel.id)
        session_data = active_sessions.get(channel_id_str)

        if not session_data or session_data.get("status") == "starting":
            await interaction.response.send_message("⚠️ ห้องนี้ไม่ได้กำลังบันทึกเสียงอยู่ครับ", ephemeral=True)
            return

        if interaction.user.id != session_data.get("command_runner_id"):
            await interaction.response.send_message("❌ เฉพาะผู้สอนที่เริ่มอัดเสียงเท่านั้นที่สามารถกดหยุดได้ครับ", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True)
        active_sessions.pop(channel_id_str, None)

        vc = session_data["vc"]
        sink = session_data["sink"]
        voice_channel = interaction.user.voice.channel
        voice_name = voice_channel.name

        try:
            sink.cleanup()  # Set closed flag first to stop accepting data
            vc.stop_listening()
            await asyncio.sleep(1.0)  # Let in-flight packets drain
        except Exception as e:
            print(f"เกิดข้อผิดพลาดตอนหยุดอัด: {e}")

        try:
            if vc.is_connected():
                await vc.disconnect(force=True)
        except Exception:
            pass

        asyncio.create_task(process_session_data(
            channel_id_str, interaction.channel, session_data, voice_name))
        await interaction.followup.send("⏹️ หยุดบันทึกแล้ว ระบบกำลังนำไปประมวลผลสรุปเนื้อหาคลาสเรียนครับ...")


class MainEntryPointView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🧑🏻‍🏫 เตรียมความพร้อม/ยืนยันการเข้าร่วม", style=discord.ButtonStyle.green, custom_id="btn_main_entry")
    async def open_panel_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.voice:
            await interaction.response.send_message("❌ คุณต้องอยู่ในห้องเสียงก่อนครับ", ephemeral=True)
            return

        voice_channel = interaction.user.voice.channel
        channel_id_str = str(voice_channel.id)

        is_host = False
        host_name = None
        tutor_id = None
        discord_id = None

        try:
            get_url = f"{NESTJS_BASE_URL}/tutor/public/channel/{channel_id_str}/active"
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(get_url) as response:
                    if response.status == 200:
                        res_json = await response.json()
                        data = res_json.get("data", {})

                        discord_id = data.get("discordId")
                        host_name = data.get("hostName")
                        tutor_id = data.get("tutorId")

                        if str(interaction.user.id) == str(discord_id):
                            is_host = True
        except Exception as e:
            print(f"API Error: {e}")

        if is_host:
            embed = discord.Embed(
                title="👨‍🏫 สำหรับผู้สอน",
                description=f"ยินดีต้อนรับคุณ {host_name}",
                color=discord.Color.green()
            )
            await interaction.response.send_message(embed=embed, view=HostView(), ephemeral=True)
        else:
            if interaction.user.id in registered_names:
                await interaction.response.send_message("✅ คุณได้ลงทะเบียนเรียบร้อยแล้ว ไม่ต้องทำซ้ำครับ!", ephemeral=True)
            else:
                await interaction.response.send_modal(RegistrationModal(user_id=interaction.user.id))


@bot.event
async def on_voice_state_update(member, before, after):
    if member.bot:
        return

    if after.channel and before.channel != after.channel:
        voice_channel = after.channel
        channel_id_str = str(voice_channel.id)

        is_active_session = False
        try:
            get_url = f"{NESTJS_BASE_URL}/tutor/public/channel/{channel_id_str}/active"
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(get_url) as response:
                    if response.status == 200:
                        is_active_session = True
        except Exception as e:
            print(f"API Error in on_voice_state_update: {e}")

        if is_active_session:
            if len([m for m in voice_channel.members if not m.bot]) == 1:
                embed = discord.Embed(
                    title="🎓 ยินดีต้อนรับเข้าสู่ชั้นเรียนอัจฉริยะ",
                    description="**กรุณากดปุ่ม `เข้าร่วม`** (ด้านล่าง)",
                    color=discord.Color.blue()
                )
                await voice_channel.send(content="👋 ยินดีต้อนรับเข้าสู่ห้องแห่งการติว", embed=embed, view=MainEntryPointView())

            if member.id not in registered_names:
                await voice_channel.send(f"📝 {member.mention} อย่าลืมกดปุ่ม **เข้าร่วม**", delete_after=30)

    if before.channel and before.channel != after.channel:
        voice_channel = before.channel
        channel_id_str = str(voice_channel.id)

        if len([m for m in voice_channel.members if not m.bot]) == 0:
            is_active_session_before = False
            try:
                get_url = f"{NESTJS_BASE_URL}/tutor/public/channel/{channel_id_str}/active"
                async with aiohttp.ClientSession() as http_session:
                    async with http_session.get(get_url) as response:
                        if response.status == 200:
                            is_active_session_before = True
            except Exception:
                pass

            if is_active_session_before:
                try:
                    await voice_channel.purge(limit=None, bulk=False)
                except Exception:
                    pass

            vc = voice_channel.guild.voice_client
            if vc and vc.channel == voice_channel:
                session_data = active_sessions.pop(channel_id_str, None)
                if session_data:
                    try:
                        session_data["sink"].cleanup()
                        vc.stop_listening()
                        await asyncio.sleep(0.5)
                    except Exception:
                        pass

                    if session_data.get("status") == "recording":
                        await ai_processing_queue.put({
                            "channel_id": channel_id_str,
                            "text_channel": voice_channel,
                            "session_data": session_data,
                            "voice_name": voice_channel.name
                        })
                try:
                    if vc.is_connected():
                        await vc.disconnect(force=True)
                except Exception:
                    pass


@bot.event
async def on_ready():
    print(f"ระบบ discord.py เชื่อมต่อสำเร็จ: {bot.user}")
    bot.add_view(MainEntryPointView())
    bot.loop.create_task(ai_worker())


if __name__ == "__main__":
    bot.run(TOKEN)
