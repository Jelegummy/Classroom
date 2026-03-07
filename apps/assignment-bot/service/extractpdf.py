import sys
import os
import json
import cv2
import numpy as np
import pytesseract
import pdfplumber
from pdf2image import convert_from_path
import ollama


class HybridSmartExtractor:
    def __init__(self, config="-l tha+eng --psm 6"):
        self.config = config

    def is_overlap(self, box1, box2):
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2
        return not (x1 + w1 < x2 or x2 + w2 < x1 or y1 + h1 < y2 or y2 + h2 < y1)

    def process_page(self, pdf_path, page_idx, pil_img):
        # 1. ดึง Digital Text พร้อมพิกัด (ใช้ pdfplumber)
        digital_elements = []
        with pdfplumber.open(pdf_path) as pdf:
            page = pdf.pages[page_idx]
            width, height = page.width, page.height
            words = page.extract_words()
            for w in words:
                digital_elements.append({
                    'text': w['text'],
                    'box': (w['x0'], w['top'], w['x1'] - w['x0'], w['bottom'] - w['top'])
                })

        # 2. เตรียมรูปภาพเพื่อหา "บล็อกข้อความ" ที่ตามองเห็น
        img_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        img_h, img_w = img_cv.shape[:2]
        scale_x, scale_y = img_w / width, img_h / height

        # ทำ Image Processing หาพื้นที่ที่มีตัวอักษร
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (50, 10))  # รวมกลุ่มข้อความแนวนอน
        dilated = cv2.dilate(thresh, kernel, iterations=2)
        contours, _ = cv2.findContours(
            dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        visual_blocks = sorted([cv2.boundingRect(c)
                               for c in contours], key=lambda b: b[1])

        combined_text = []

        # ส่วนเตรียม Debug Image (ย้ายไปเก็บใน log)
        debug_img = img_cv.copy()

        for bx, by, bw, bh in visual_blocks:
            if bw < 20 or bh < 10:
                continue

            found_digital = []
            for el in digital_elements:
                dx, dy, dw, dh = el['box']
                if self.is_overlap((bx, by, bw, bh), (dx*scale_x, dy*scale_y, dw*scale_x, dh*scale_y)):
                    found_digital.append(el['text'])

            if found_digital:
                text_block = " ".join(found_digital)
                cv2.rectangle(debug_img, (bx, by),
                              (bx+bw, by+bh), (0, 255, 0), 2)
                combined_text.append(text_block)
            else:
                roi = img_cv[by:by+bh, bx:bx+bw]
                ocr_text = pytesseract.image_to_string(
                    roi, config=self.config).strip()
                if ocr_text:
                    cv2.rectangle(debug_img, (bx, by),
                                  (bx+bw, by+bh), (0, 0, 255), 2)
                    combined_text.append(f"[OCR]: {ocr_text}")

        # บันทึก Debug Image ลงในโฟลเดอร์ log
        log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
        os.makedirs(log_dir, exist_ok=True)
        cv2.imwrite(os.path.join(
            log_dir, f"debug_page_{page_idx+1}.png"), debug_img)

        return "\n".join(combined_text)

    def analyze_text(self, text):
        if not text.strip():
            return ""
        prompt = f"""
    [Strict Instruction]
    คุณคือผู้เชี่ยวชาญด้านการจัดรูปแบบเอกสารทางเทคนิค (Technical Document Formatter)

    ภารกิจ:
    1. นำ Raw Text จาก OCR มาจัดเรียงใหม่ให้ "อ่านง่าย" และ "เป็นระเบียบ"
    2. **ห้ามเพิ่มคำตอบ ห้ามแก้โจทย์ และห้ามคำนวณใดๆ ทั้งสิ้น** ให้คงเนื้อหาโจทย์เดิมไว้ 100%
    3. **ห้ามตัดเนื้อหาทิ้ง** แม้จะเป็นตัวอย่าง (เช่น A[] = ...) หรือ Code ภายในโจทย์
    4. แก้ไขเฉพาะคำที่ OCR อ่านผิดให้ถูกต้องตามบริบท (เช่น "ก าหนด" -> "กำหนด")

    ข้อความต้นฉบับที่ต้องจัดการ:
    {text}
    """
        res = ollama.chat(
            model="scb10x/typhoon-translate1.5-4b",
            messages=[{"role": "user", "content": prompt}],
            options={
                "temperature": 0,
            }
        )
        return res['message']['content']


def run_extraction(pdf_path):
    extractor = HybridSmartExtractor()
    pages_images = convert_from_path(pdf_path, dpi=300)
    all_raw_pages = []

    for i, img in enumerate(pages_images):
        raw_page_text = extractor.process_page(pdf_path, i, img)
        all_raw_pages.append(raw_page_text)

    full_raw_text = "\n".join(all_raw_pages)
    final_output = extractor.analyze_text(full_raw_text)

    log_dir = os.path.join(os.path.dirname(__file__), "..", "log")
    os.makedirs(log_dir, exist_ok=True)
    extract_dir = os.path.join(os.path.dirname(
        __file__), "../data", "extractpdf-txt")
    os.makedirs(extract_dir, exist_ok=True)

    with open(os.path.join(extract_dir, "extractpdf.txt"), "w", encoding="utf-8") as f:
        f.write(final_output)

    with open(os.path.join(log_dir, "raw_combined.txt"), "w", encoding="utf-8") as f:
        f.write(full_raw_text)

    return final_output


def extract_pdf(pdf_path: str) -> str:
    """
    FastAPI จะเรียก function นี้
    return path ของ txt
    """
    run_extraction(pdf_path)
    extract_dir = os.path.join(os.path.dirname(
        __file__), "../data", "extractpdf-txt")
    txt_path = os.path.join(extract_dir, "extractpdf.txt")
    return txt_path


def main():
    pdf_path = sys.argv[1] if len(
        sys.argv) > 1 else "./data/contents/timecomplexity.pdf"
    if os.path.exists(pdf_path):
        print(run_extraction(pdf_path))
    else:
        print(f"Error: File not found {pdf_path}")


if __name__ == "__main__":
    main()
