from database import get_db
from sqlalchemy.orm import Session
from langchain_ollama import OllamaLLM
from scipy.io.wavfile import write
import sounddevice as sd
import whisper
import torch
import re
import edge_tts
import asyncio
import json
from sqlalchemy import text
import pygame
import os
import httpx

NESTJS_URL = os.getenv("NESTJS_URL", "http://localhost:4000")
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "coreaudio"


VOICE = "th-TH-NiwatNeural"
# RECORD_DURATION = 10
SAMPLE_RATE = 44100
PASS_THRESHOLD = 4
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
TXT_DIR = os.path.join(BASE_DIR, "data", "extractpdf-txt")

device = "mps" if torch.backends.mps.is_available() else "cpu"
whisper_model = whisper.load_model("medium", device=device)

llm = OllamaLLM(
    model="scb10x/typhoon-translate1.5-4b:latest",
    temperature=0.1,
)


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


# --- Helper Functions ---
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
    temp_mp3 = f"temp_voice_{session_id}.mp3"
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

    pygame.mixer.init()
    try:
        pygame.mixer.music.load(temp_mp3)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            await asyncio.sleep(0.1)
    finally:
        pygame.mixer.quit()
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)


def record_answer(session_id: str, duration: int):
    temp_wav = f"input_student_{session_id}.wav"
    print("🎙️ บันทึกคำตอบ...")
    recording = sd.rec(
        int(duration * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1
    )
    sd.wait()
    write(temp_wav, SAMPLE_RATE, recording)
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
    return llm.invoke(prompt).strip()


def is_correct(question: str, student_answer: str, context: str) -> bool:
    """ตัดสินความถูกต้องโดยเน้นที่ 'ความเข้าใจในแนวคิด' เป็นหลัก"""

    # prompt = f"""
    # คุณเป็นอาจารย์ผู้เชี่ยวชาญที่เน้นการสอนให้เด็กเข้าใจ (Conceptual Learning)
    # หน้าที่ของคุณคือตรวจคำตอบปากเปล่าของนักเรียนในวิชาคอมพิวเตอร์

    # เกณฑ์การตัดสิน:
    # 1. เน้น "ใจความสำคัญ": แม้นักเรียนจะใช้คำพูดไม่เป็นทางการ หรืออธิบายติดขัด แต่ถ้า "หลักการ" ถูกต้อง ให้ถือว่า 'true'
    # 2. ยอมรับ "ความแตกต่าง": สำหรับคำถามที่ไม่มีคำตอบตายตัว หรือคำถามที่ถามความคิดเห็น ให้ดูเหตุผลสนับสนุนที่เกี่ยวข้องต้องเกี่ยวกับการบ้านมากพอ
    # 3. ไม่จับผิด "คำพูด": อย่าให้ 'false' เพียงเพราะนักเรียนพูดผิดเล็กน้อย
    # 4. เข้าใจ "บริบท": ถ้านักเรียนตอบได้ใกล้เคียง หรือแสดงให้เห็นว่าเข้าใจกระบวนการทำงานของอัลกอริทึม ให้ถือว่าผ่าน

    # คำถาม: {question}
    # เนื้อหาการบ้าน:{context}
    # คำตอบนักเรียน: {student_answer}

    # จงตอบเป็น JSON เท่านั้น:
    # {{
    #   "is_correct": true/false,
    #   "reason": "อธิบายสั้นๆ ว่าทำไมถึงให้ผ่านหรือไม่ผ่าน โดยเน้นชมส่วนที่นักเรียนเข้าใจ"
    # }}
    # """

    prompt = f"""
คุณเป็นอาจารย์ตรวจการบ้านที่ยุติธรรม

เกณฑ์การตัดสิน:
1. ข้อเท็จจริงต้องถูก: ตัวเลข ชื่อ หรือข้อมูลเฉพาะเจาะจงต้องถูกต้อง ผิดแม้แต่อันเดียว → false
2. หลักการต้องถูก: ถ้าอธิบายกระบวนการหรือแนวคิด ใจความสำคัญต้องตรง ไม่ต้องครบทุกคำ
3. ไม่ตอบ หรือตอบนอกเรื่อง → false
4. ห้ามสันนิษฐานแทนนักเรียน ถ้าไม่ได้พูดถึงชัดเจน → false

คำถาม: {question}
เนื้อหาการบ้าน: {context}
คำตอบนักเรียน: {student_answer}

ตอบเป็น JSON เท่านั้น:
{{
  "is_correct": true/false,
  "reason": "เหตุผลสั้นๆ"
}}
"""
    try:
        res = llm.invoke(prompt)
        start, end = res.find('{'), res.rfind('}') + 1
        data = json.loads(res[start:end])
        print(f"มุมมอง AI: {data.get('reason', '')}")
        return data.get("is_correct", False)
    except Exception as e:
        print(f"ระบบตรวจคะแนนขัดข้อง: {e}")
        return False


async def run_check_session(
    session_id: str,
    assignment_id: str,
    active_sessions: dict,
    duration: int = 10
):
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

    questions = load_questions_from_db(assignment_id)
    context_text = load_assignment_context(assignment_id)
    if not questions:
        await send("ไม่พบคำถามสำหรับการบ้านนี้", "error")
        return

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
        answer_history.append(
            {"role": "bot", "content": q_text})  # ← เก็บคำถาม

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

        result = is_correct(q_text, clean_ans, context_text)
        if result:
            correct_count += 1
            msg = "คำตอบถูกต้องครับ ✓"
        else:
            msg = "คำตอบยังไม่ถูกต้องครับ ✗"

        answer_history.append({                          # ← เก็บคำตอบ
            "role": "student",
            "content": clean_ans,
            "is_correct": result,
        })

        await send(msg, "ai_text")
        await speak(msg, session_id)

        if os.path.exists(wav_path):
            os.remove(wav_path)

    # สรุปผล
    passed = correct_count >= PASS_THRESHOLD
    final_msg = (
        f"ยินดีด้วยครับ! ตอบถูก {correct_count} จาก {total} ข้อ ผ่านการทดสอบครับ"
        if passed else
        f"ตอบถูก {correct_count} จาก {total} ข้อ ยังไม่ผ่านนะครับ ลองใหม่ได้เลยครับ"
    )

    print(f"\n📊 {final_msg}")
    await send(final_msg)
    await speak(final_msg, session_id)

    # บันทึกลง DB ผ่าน NestJS  ← เพิ่ม
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
