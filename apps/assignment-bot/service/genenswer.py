import os
import json
import logging
from concurrent.futures import ThreadPoolExecutor

from langchain_core.output_parsers import StrOutputParser

from service.genquestion import MAX_CONTENT_CHARS
from service.llm import get_llm

logger = logging.getLogger(__name__)

# Answers are independent, so generate a few concurrently instead of one by one.
ANSWER_CONCURRENCY = int(os.getenv("ANSWER_CONCURRENCY", "4"))

ANSWER_DIR = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), "..", "data", "answers")
os.makedirs(ANSWER_DIR, exist_ok=True)


# เปลี่ยน type hint ตรงนี้
def run_genanswer(assignment_id: str, txt_path: str, questions: list[str]) -> list[dict]:
    logger.info(
        f"[genanswer] Start generating answers for {assignment_id}, {len(questions)} questions")

    if not os.path.exists(txt_path):
        logger.error(f"[genanswer] File not found: {txt_path}")
        return []

    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()[:MAX_CONTENT_CHARS]

    chain = get_llm(0.1) | StrOutputParser()

    def answer(indexed):
        i, question = indexed
        logger.info(f"[genanswer] Answering question {i}/{len(questions)}...")

        prompt = f"""
        คุณคือผู้ช่วยสอน (Teaching Assistant) หน้าที่ของคุณคือสร้าง "เฉลยมาตรฐานไม่ยาวมาก" สำหรับคำถามสัมภาษณ์ที่กำหนด
        
        [ข้อกำหนดสำคัญ]
        1. ให้ตอบเฉพาะ "คำถามที่ระบุ" ด้านล่างนี้เท่านั้น
        2. ห้าม! ไปไล่ตอบคำถามหรือทำโจทย์อื่นๆ ที่ปรากฏอยู่ใน "เนื้อหาบทเรียน"
        3. ใช้เนื้อหาบทเรียนเป็น "แหล่งอ้างอิง" เพื่อหาคำตอบมาตอบคำถามที่กำหนดเท่านั้น
        4. ตอบให้กระชับ ตรงประเด็น และเป็นภาษาเดียวกับคำถามไม่ต้องละเอียดมาก

        เนื้อหาบทเรียน (ใช้สำหรับอ้างอิงเท่านั้น):
        ---
        {content}
        ---

        คำถามที่ต้องตอบ: {question}
        
        คำตอบของคุณ:
        """

        try:
            answer_text = chain.invoke(prompt).strip()
        except Exception as e:
            logger.error(f"[genanswer] Error answering question {i}: {e}")
            answer_text = f"(เกิดข้อผิดพลาดในการสร้างคำตอบ: {e})"

        return {"question": question, "answer": answer_text}

    # map() preserves question order.
    with ThreadPoolExecutor(max_workers=ANSWER_CONCURRENCY) as pool:
        answers_data = list(pool.map(answer, enumerate(questions, start=1)))

    # (ตัวเลือกเสริม) เซฟเป็นไฟล์ .json เก็บไว้ในเครื่องด้วย
    answer_file_path = os.path.join(ANSWER_DIR, f"{assignment_id}.json")
    with open(answer_file_path, "w", encoding="utf-8") as f:
        json.dump(answers_data, f, ensure_ascii=False, indent=4)

    logger.info(f"[genanswer] Saved answers JSON to {answer_file_path}")

    # ส่งคืนเป็น List of Dict กลับไปให้ main.py นำไปใช้ต่อ
    return answers_data
