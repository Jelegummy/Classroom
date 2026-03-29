import sys
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# ดึง API Key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ ไม่พบ GEMINI_API_KEY กรุณาตรวจสอบไฟล์ .env")

MODEL_NAME = "gemini-2.5-flash"

# Prompt สั้นๆ และครอบคลุมเงื่อนไขการจัดรูปแบบของคุณ
PROMPT = """
OCR this pdf file to txt file. 
Make subquestions like 1.1, 1.2, 1.3 if it has e.g., question 1 and in the table or text there are 1 2 3 4 5, make it to sub questions.
Please return plain text only, no markdown.
"""


def extract_pdf(pdf_path: str) -> str:
    """
    ฟังก์ชันหลักสำหรับส่ง PDF ให้ Gemini จัดการ OCR และ Formatting
    """
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return ""

    print(f"📄 กำลังอัปโหลดและประมวลผลไฟล์: {pdf_path} ... (อาจใช้เวลาสักครู่)")

    # 1. สร้าง Client
    client = genai.Client(api_key=GEMINI_API_KEY)

    # 2. อัปโหลด PDF ขึ้นไปให้ Gemini
    pdf_file = client.files.upload(file=pdf_path)

    # 3. สั่งให้ Gemini ประมวลผลด้วย Prompt
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[pdf_file, PROMPT]
        )
        text_result = response.text.strip()
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดระหว่างเรียก API: {e}")
        text_result = ""
    finally:
        client.files.delete(name=pdf_file.name)

    if not text_result:
        return ""

    extract_dir = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "..", "data", "extractpdf-txt")
    os.makedirs(extract_dir, exist_ok=True)

    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    out_path = os.path.join(extract_dir, f"{pdf_name}.txt")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text_result)

    print(f"✅ เสร็จเรียบร้อย! บันทึกไฟล์ไว้ที่: {out_path}")
    return out_path


def main():
    target_pdf = sys.argv[1] if len(
        sys.argv) > 1 else "./data/contents/timecomplexity.pdf"
    if os.path.exists(target_pdf):
        extract_pdf(target_pdf)
    else:
        print(f"❌ Error: File not found {target_pdf}")


if __name__ == "__main__":
    main()
