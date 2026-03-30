import os
import sys
import pygame
import asyncio
import json
import random
import re
import torch
import numpy as np
import whisper
import edge_tts
import httpx
import sounddevice as sd
from scipy.io.wavfile import write
from sqlalchemy import text
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

from database import get_db

load_dotenv()

# --- 1. ระบบจัดการ Driver เสียงอัตโนมัติ (OS-Specific Fallback) ---


def init_pygame_audio():
    try:
        # พยายามเปิดระบบเสียงตามปกติก่อน
        pygame.mixer.init()
        print("✅ Audio initialized successfully via auto-detect.")
    except (pygame.error, Exception) as e:
        print(
            f"⚠️ Default audio init failed: {e}. Attempting OS-specific fallback...")

        if sys.platform == 'darwin':    # macOS
            os.environ['SDL_AUDIODRIVER'] = 'coreaudio'
        elif sys.platform == 'win32':   # Windows
            os.environ['SDL_AUDIODRIVER'] = 'directsound'
        elif sys.platform.startswith('linux'):  # Linux / WSL
            # พยายามใช้ pulseaudio
            os.environ['SDL_AUDIODRIVER'] = 'pulseaudio'

        try:
            pygame.mixer.init()
            print(
                f"✅ Audio initialized via {os.environ.get('SDL_AUDIODRIVER')} fallback.")
        except pygame.error as fallback_e:
            print(
                f"❌ Fallback failed: {fallback_e}. Running with 'dummy' driver (No Sound).")
            # ถ้าไม่มี Driver จริงๆ ให้ใช้ dummy เพื่อไม่ให้โค้ดพัง
            os.environ['SDL_AUDIODRIVER'] = 'dummy'
            pygame.mixer.init()


# เรียกใช้งานทันทีเมื่อเริ่มรัน Script
init_pygame_audio()

# --- 2. ตั้งค่าตัวแปรระบบ ---
NESTJS_URL = os.getenv("NESTJS_URL", "http://localhost:4000")
os.environ["SDL_VIDEODRIVER"] = "dummy"
TYPHOON_API_KEY = os.getenv("TYPHOON_API_KEY")

VOICE = "th-TH-NiwatNeural"
SAMPLE_RATE = 44100
PASS_THRESHOLD = 4
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
TXT_DIR = os.path.join(BASE_DIR, "data", "extractpdf-txt")

TEMP_DIR = os.path.join(BASE_DIR, "data", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# --- 3. โหลด AI Models ---
device = "mps" if torch.backends.mps.is_available() else "cpu"
whisper_model = whisper.load_model("medium", device=device)

llm = ChatOpenAI(
    base_url="https://api.opentyphoon.ai/v1",
    api_key=TYPHOON_API_KEY,
    model='typhoon-v2.5-30b-a3b-instruct',
    temperature=0.1,
    max_tokens=8192,
)

# --- 4. DB Loaders ---


def load_questions_from_db(assignment_id: str) -> list[str]:
    db: Session = next(get_db())
    try:
        result = db.execute(
            text("SELECT chat_history FROM assignments WHERE id = :id"),
            {"id": assignment_id}
        ).fetchone()

        if not result:
            return []

        chat_history = result.chat_history
        if isinstance(chat_history, str):
            chat_history = json.loads(chat_history)

        return [
            msg["content"]
            for msg in chat_history
            if msg.get("role") == "assistant"
        ]
    except Exception as e:
        print(f"โหลดคำถามไม่สำเร็จ: {e}")
        return []
    finally:
        db.close()


def load_answer_file_from_db(assignment_id: str) -> list[dict]:
    """โหลด answer_file (list of {question, answer}) จาก DB"""
    db: Session = next(get_db())
    try:
        result = db.execute(
            text("SELECT answer_file FROM assignments WHERE id = :id"),
            {"id": assignment_id}
        ).fetchone()

        if not result or not result.answer_file:
            return []

        data = result.answer_file
        if isinstance(data, str):
            data = json.loads(data)

        return data
    except Exception as e:
        print(f"โหลด answer_file ไม่สำเร็จ: {e}")
        return []
    finally:
        db.close()


def load_assignment_context(assignment_id: str) -> str:
    db: Session = next(get_db())
    try:
        result = db.execute(
            text("SELECT filePdf FROM assignments WHERE id = :id"),
            {"id": assignment_id}
        ).fetchone()

        if not result:
            return ""

        pdf_name = result.filePdf
        txt_name = os.path.splitext(pdf_name)[0] + ".txt"
        txt_path = os.path.join(TXT_DIR, txt_name)

        if not os.path.exists(txt_path):
            print(f"ไม่พบไฟล์ txt: {txt_path}")
            return ""

        with open(txt_path, "r", encoding="utf-8") as f:
            return f.read()

    except Exception as e:
        print(f"โหลด context ไม่สำเร็จ: {e}")
        return ""
    finally:
        db.close()


# --- 5. Answer File Helpers ---
def find_expected_answer(question: str, answer_file: list[dict]) -> str:
    """จับคู่คำถามกับ expected answer จาก answer_file"""
    # ตรงเป๊ะก่อน
    for item in answer_file:
        if item.get("question", "").strip() == question.strip():
            return item.get("answer", "")
    # fallback: substring match
    for item in answer_file:
        q = item.get("question", "")
        if question.strip() in q or q in question.strip():
            return item.get("answer", "")
    return ""


# --- 6. Helper Functions ---
def th_num(num_str):
    thai_numbers = {
        '0': 'ศูนย์', '1': 'หนึ่ง', '2': 'สอง', '3': 'สาม',
        '4': 'สี่', '5': 'ห้า', '6': 'หก', '7': 'เจ็ด',
        '8': 'แปด', '9': 'เก้า'
    }
    return "".join([thai_numbers.get(d, d) for d in num_str])


def normalize_thai_math(text):
    uni_pows = {'²': 'สอง', '³': 'สาม'}
    for char, word in uni_pows.items():
        text = text.replace(char, f" ยกกำลัง {word} ")
    text = re.sub(
        r"O\(([a-zA-Z]+)(?:\^(\d+))?\)",
        lambda m: f" บิ๊กโอ {m.group(1)} " + (
            f"ยกกำลัง {th_num(m.group(2))}" if m.group(2) else ""
        ),
        text
    )

    def generic_power(match):
        return f" {match.group(1)} ยกกำลัง {th_num(match.group(2))} "

    text = re.sub(r"([a-zA-Z0-9]+)\^(\d+)", generic_power, text)
    text = text.replace("log n", " ล็อก เอ็น ").replace(
        "binarySearch", " ไบ-นา-รี่-เซิร์ช "
    )
    text = re.sub(r"ข้อ (\d+)", r"ข้อที่ \1", text)
    return text


async def speak(text: str, session_id: str):
    processed_text = normalize_thai_math(text)
    temp_mp3 = os.path.join(TEMP_DIR, f"temp_voice_{session_id}.mp3")
    print(f"🔊 AI: {processed_text}")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            communicate = edge_tts.Communicate(
                processed_text, VOICE, rate="-10%", pitch="+15Hz"
            )
            await communicate.save(temp_mp3)
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"ลองใหม่ครั้งที่ {attempt + 1}...")
                await asyncio.sleep(2)
            else:
                print(f"เชื่อมต่อระบบเสียงไม่ได้: {e}")
                return

    # ถ้าเป็น Dummy ไม่ต้องพยายามเล่นเสียงเพื่อหลีกเลี่ยงบั๊กหรือความล่าช้า
    if os.environ.get("SDL_AUDIODRIVER") == "dummy":
        print("🔇 (Mode: Dummy) ระบบทำงานต่อโดยไม่มีเสียงออกลำโพงเซิร์ฟเวอร์")
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)
        return

    try:
        # เช็คให้ชัวร์ว่า Pygame ยังทำงานอยู่
        if not pygame.mixer.get_init():
            pygame.mixer.init()

        pygame.mixer.music.load(temp_mp3)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"เกิดข้อผิดพลาดขณะเล่นเสียง: {e}")
    finally:
        # unload ไฟล์เพื่อให้ระบบ OS ยอมให้ลบไฟล์ได้
        try:
            pygame.mixer.music.unload()
        except AttributeError:
            # สำรองไว้กรณีใช้ pygame เวอร์ชันเก่าที่ไม่มี unload()
            pygame.mixer.music.stop()

        if os.path.exists(temp_mp3):
            try:
                os.remove(temp_mp3)
            except Exception as e:
                print(f"ไม่สามารถลบไฟล์เสียงชั่วคราวได้: {e}")


def record_answer(session_id: str, duration: int):
    temp_wav = os.path.join(TEMP_DIR, f"input_student_{session_id}.wav")
    print(f"🎙️ ระบบกำลังพยายามอัดเสียง ({duration} วินาที)...")

    try:
        recording = sd.rec(
            int(duration * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=1
        )
        sd.wait()
        write(temp_wav, SAMPLE_RATE, recording)
        return temp_wav

    except Exception as e:
        print(f"❌ ไม่พบไมโครโฟนบน Server (Error: {e})")
        print("⚠️ จำลองการอัดเสียง: สร้างไฟล์เสียงเปล่าๆ เพื่อให้ระบบทำงานต่อได้...")

        # ถ่วงเวลาให้เหมือนมีการอัดเสียงจริงๆ
        import time
        time.sleep(duration)

        # สร้างไฟล์เสียงที่มีแต่ความเงียบ (Silence) แทน
        silence_audio = np.zeros(int(duration * SAMPLE_RATE), dtype=np.float32)
        write(temp_wav, SAMPLE_RATE, silence_audio)

        return temp_wav


def transcribe_answer(wav_path: str) -> str:
    result = whisper_model.transcribe(wav_path, language='th', fp16=False)
    return result["text"]


def normalize_answer(text: str) -> str:
    prompt = f"""
    ถอดความคำตอบนักเรียนให้เป็นระเบียบ โดยห้ามเปลี่ยนใจความสำคัญ
    แก้ไขเฉพาะคำสะกดผิด หรือคำที่ฟังดูเพี้ยนจากการ Transcribe
    *ห้ามเติมเนื้อหาเข้ามาเองเด็ดขาด*
    คำตอบ: {text}
    """
    chain = llm | StrOutputParser()
    return chain.invoke(prompt).strip()


def is_correct_with_answer_file(
    question: str,
    student_answer: str,
    expected_answer: str
) -> tuple[bool, str]:
    prompt = f"""
คุณเป็นอาจารย์ตรวจการบ้านที่ยุติธรรมและมีประสบการณ์

ขั้นตอนการตรวจ:
1. วิเคราะห์คำถามก่อนว่าเป็นแบบไหน:
   - "factual"    = ถามตัวเลข, ชื่อ, จำนวน, สูตรเฉพาะ เช่น "มีกี่ข้อ" "ฟังก์ชันชื่ออะไร"
   - "conceptual" = ถามหลักการ, วิธีคิด, เหตุผล เช่น "อธิบาย", "ทำไม", "อย่างไร"

2. เกณฑ์ตาม type:
   - factual    → นักเรียนต้องตอบถูกทุกจุดสำคัญ ผิดแม้แต่ตัวเลขเดียว → false
   - conceptual → ใจความหลักต้องตรงกับเฉลย ไม่ต้องครบทุกคำ ถ้าเข้าใจแนวคิดถูก → true

3. กฎเหล็กทุก type:
   - ไม่ตอบ / ตอบนอกเรื่องสิ้นเชิง → false
   - ห้ามสันนิษฐานแทนนักเรียน ถ้าไม่ได้พูดถึงชัดเจน → false
   - คำตอบสั้นกว่าเฉลยได้ ถ้าครอบคลุมประเด็นหลัก

คำถาม: {question}
เฉลย: {expected_answer}
คำตอบนักเรียน: {student_answer}

ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น:
{{
  "question_type": "factual" หรือ "conceptual",
  "is_correct": true หรือ false,
  "reason": "เหตุผลสั้นๆ ว่าถูกหรือผิดตรงไหน"
}}
"""
    try:
        res = llm.invoke(prompt)
        start, end = res.content.find('{'), res.content.rfind('}') + 1
        data = json.loads(res.content[start:end])
        q_type = data.get("question_type", "?")
        reason = data.get("reason", "")
        is_ok = data.get("is_correct", False)
        print(f"[{q_type}] AI: {reason}")
        return is_ok, reason
    except Exception as e:
        print(f"ระบบตรวจคะแนนขัดข้อง: {e}")
        return False, "ระบบตรวจไม่ได้"


async def run_check_session(
    session_id: str,
    assignment_id: str,
    active_sessions: dict,
    duration: int = 10
):
    questions = load_questions_from_db(assignment_id)
    answer_file = load_answer_file_from_db(assignment_id)
    session = active_sessions[session_id]
    user_id = session.get("user_id")
    classroom_assignment_id = session.get("classroom_assignment_id")

    async def send(text: str, msg_type: str = "ai_text"):
        ws = session.get("ws")
        if ws:
            try:
                await ws.send_json({"type": msg_type, "text": text})
            except Exception as e:
                print(f"⚠️ WebSocket ส่งไม่ได้: {e}")

    def is_stopped():
        return session.get("status") == "stopped"

    async def wait_if_paused():
        if session.get("paused"):
            await send("⏸ กรุณาหันหน้าเข้ากล้อง", "warning")
            while session.get("paused"):
                if is_stopped():
                    return
                await asyncio.sleep(0.5)
            await send("▶️ กลับมาแล้ว เริ่มต่อเลยครับ", "info")

    if not questions:
        await send("ไม่พบคำถามสำหรับการบ้านนี้", "error")
        return

    if not answer_file:
        await send("ไม่พบเฉลยสำหรับการบ้านนี้", "error")
        return

    # สุ่มหลัง check
    QUESTION_COUNT = 5
    questions = random.sample(questions, min(QUESTION_COUNT, len(questions)))

    correct_count = 0
    total = len(questions)
    answer_history = []

    await send(f"สวัสดีครับ! มีคำถามทั้งหมด {total} ข้อ พร้อมเริ่มได้เลยครับ")
    await speak(f"สวัสดีครับ มีคำถามทั้งหมด {total} ข้อ", session_id)

    for i, q_text in enumerate(questions, 1):
        if is_stopped():
            return

        await wait_if_paused()
        if is_stopped():
            return

        print(f"\n--- [ข้อที่ {i}/{total}] ---")
        await send(f"ข้อที่ {i}: {q_text}", "ai_text")
        await speak(f"ข้อที่ {i} . {q_text}", session_id)
        answer_history.append({"role": "bot", "content": q_text})

        if is_stopped():
            return

        await send("", "start_recording")
        wav_path = await asyncio.get_event_loop().run_in_executor(
            None, record_answer, session_id, duration
        )

        if is_stopped():
            if os.path.exists(wav_path):
                os.remove(wav_path)
            return

        await wait_if_paused()
        await send("", "transcript")

        raw_ans = transcribe_answer(wav_path)
        clean_ans = normalize_answer(raw_ans)
        print(f"คำตอบที่ตรวจพบ: {clean_ans}")

        if is_stopped():
            if os.path.exists(wav_path):
                os.remove(wav_path)
            return

        expected = find_expected_answer(q_text, answer_file)
        result, reason = is_correct_with_answer_file(
            q_text, clean_ans, expected)

        if result:
            correct_count += 1
            msg = "คำตอบถูกต้องครับ ✓"
        else:
            msg = "คำตอบยังไม่ถูกต้องครับ ✗"

        answer_history.append({
            "role": "student",
            "content": clean_ans,
            "expected": expected,
            "is_correct": result,
            "reason": reason,
        })

        await send(
            json.dumps({
                "studentAnswer": clean_ans,
                "expectedAnswer": expected,
                "isCorrect": result,
                "reason": reason,
            }),
            "answer_result"
        )

        await send(msg, "ai_text")
        await speak(msg, session_id)

        if os.path.exists(wav_path):
            os.remove(wav_path)

    passed = correct_count >= PASS_THRESHOLD
    final_msg = (
        f"ยินดีด้วยครับ! ตอบถูก {correct_count} จาก {total} ข้อ โปรดกดปุ่มสิ้นสุดเพื่อกลับไปที่หน้า Assignment"
        if passed else
        f"ตอบถูก {correct_count} จาก {total} ข้อ โปรดกดปุ่มสิ้นสุดเพื่อกลับไปที่หน้า Assignment"
    )

    print(f"\n📊 {final_msg}")
    await send(final_msg)
    await speak(final_msg, session_id)

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{NESTJS_URL}/assignment/internal/submit",
                json={
                    "userId": user_id,
                    "classroomAssignmentId": classroom_assignment_id,
                    "score": correct_count,
                    "answerHistory": answer_history,
                },
                timeout=10.0,
            )
            res.raise_for_status()
            print("✅ บันทึกผลสำเร็จ")
    except Exception as e:
        print(f"❌ บันทึกผลไม่สำเร็จ: {e}")

    await send("", "session_end")
    ws = session.get("ws")
    if ws:
        await ws.send_json({
            "type": "session_result",
            "correct": correct_count,
            "total": total,
            "passed": passed
        })

    active_sessions[session_id]["status"] = "done"
    active_sessions[session_id]["result"] = {
        "correct": correct_count,
        "total": total,
        "passed": passed
    }
