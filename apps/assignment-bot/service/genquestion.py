from langchain_ollama import OllamaLLM
import os
import json
import sys

llm = OllamaLLM(
    model="scb10x/typhoon-translate1.5-4b",
    temperature=0.3,
    num_ctx=8192
)


def load_extractedpdf(file_path):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def generate_questions(pdf_content):

    prompt = f"""
    f"คุณคืออาจารย์ผู้ตรวจทานการบ้านไม่ใช่คนออกข้อสอบ หน้าที่คือสร้างคำถามมาเพียง 5 ข้อเท่านั้นในการดูความเข้าใจ"
    - ถามสั้นๆ ไม่เกิน 1 บรรทัดต่อข้อ
    - ถามโครงสร้างงานเช่น: 'การบ้านชุดนี้มีทั้งหมดกี่ข้อ?'
    - ถามเช็คความเข้าใจเช่น: 'อธิบายหลักการทำงานของฟังก์ชัน'
    - ข้อไหนที่มีโจทย์หรือ code ต้องนำ code นั้นๆมาใส่ด้วยตลอด เพื่อให้เด็กได้อธิบายโค้ดนั้นๆ
    - ไม่จำเป็นต้องมีเลขข้อ
    - ไม่เอาตอบใช่หรือไม่
    
    ข้อมูลการบ้าน: {pdf_content}
    """
    result = llm.invoke(prompt)
    return [line.strip() for line in result.split("\n") if line.strip()]


def save_file(selected_questions):
    log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
    filename = os.path.join(log_dir, "generated_questions.json")

    data_to_save = {
        "total_questions": len(selected_questions),
        "questions": selected_questions
    }
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data_to_save, f, ensure_ascii=False, indent=4)


def run_gen_question(pdf_content):
    if not pdf_content:
        return []
    questions = generate_questions(pdf_content)
    if questions:
        save_file(questions)
    return questions


def run_genquestiontext(txt_path: str):

    pdf_text = load_extractedpdf(txt_path)

    if not pdf_text:
        return []

    return run_gen_question(pdf_text)


def main():
    log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
    test_path = os.path.join(log_dir, "extractpdf.txt")

    pdf_text = load_extractedpdf(test_path)
    if pdf_text:
        questions = run_gen_question(pdf_text)
        for q in questions:
            print(f"Generated: {q}")
    else:
        print("ไม่พบไฟล์สำหรับทดสอบใน log")


if __name__ == "__main__":
    main()
