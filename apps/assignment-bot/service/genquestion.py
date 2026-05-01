from langchain_openai import ChatOpenAI
import os
import json
import sys
from dotenv import load_dotenv

load_dotenv()

TYPHOON_API_KEY = os.getenv("TYPHOON_API_KEY")

llm = ChatOpenAI(
    base_url="https://api.opentyphoon.ai/v1",
    api_key=TYPHOON_API_KEY,
    model='typhoon-v2.5-30b-a3b-instruct',
    temperature=0.3,
    max_tokens=8192,
)


def load_text_file(file_path):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def generate_questions(pdf_content):

    prompt = f"""
    f"คุณคืออาจารย์ผู้ตรวจทานการบ้านไม่ใช่คนออกข้อสอบ หน้าที่คือสร้างคำถามมาเพียง 10 ข้อเท่านั้นในการดูความเข้าใจ"
    - ถามสั้นๆ ไม่เกิน 1 บรรทัดต่อข้อ
    - ถามโครงสร้างงานเช่น: 'การบ้านชุดนี้มีทั้งหมดกี่ข้อ?'
    - ถามเช็คความเข้าใจเช่น: 'อธิบายหลักการทำงานของฟังก์ชัน'
    - ข้อไหนที่มีโจทย์หรือ code ต้องนำ code นั้นๆมาใส่ด้วยตลอด เพื่อให้เด็กได้อธิบายโค้ดนั้นๆ
    - ไม่จำเป็นต้องมีเลขข้อ
    - ไม่เอาตอบใช่หรือไม่
    ตอบเป็นคำถาม 10 ข้อเท่านั้น
    
    ข้อมูลการบ้าน: {pdf_content}
    """
    result = llm.invoke(prompt)
    return [line.strip() for line in result.content.split("\n") if line.strip()]


def save_questions_log(selected_questions):
    log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
    filename = os.path.join(log_dir, "generated_questions.json")

    data_to_save = {
        "total_questions": len(selected_questions),
        "questions": selected_questions
    }
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data_to_save, f, ensure_ascii=False, indent=4)


def generate_questions_from_content(pdf_content):
    if not pdf_content:
        return []
    questions = generate_questions(pdf_content)
    if questions:
        save_questions_log(questions)
    return questions


def generate_questions_from_file(txt_path: str):

    pdf_text = load_text_file(txt_path)

    if not pdf_text:
        return []

    return generate_questions_from_content(pdf_text)


def main():
    log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
    test_path = os.path.join(log_dir, "extractpdf.txt")

    pdf_text = load_text_file(test_path)
    if pdf_text:
        questions = generate_questions_from_content(pdf_text)
        for q in questions:
            print(f"Generated: {q}")
    else:
        print("ไม่พบไฟล์สำหรับทดสอบใน log")


if __name__ == "__main__":
    main()
