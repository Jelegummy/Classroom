import os
import shutil
import uuid
import logging
import traceback
import asyncio
from typing import Optional

import cv2
import numpy as np
from contextlib import asynccontextmanager
from pydantic import BaseModel

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from schemas import AssignmentUpsertRequest, ProcessPdfRequest
from services.assignment_service import create_assignment, attach_to_classroom
from service.genquestion import run_genquestiontext
from service.extractpdf import extract_pdf
from service.checkhomework import run_check_session
from service.genenswer import run_genanswer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ASSIGNMENT_TXT_DIR = os.path.join(DATA_DIR, "assignments")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(ASSIGNMENT_TXT_DIR, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
active_sessions: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    for session in active_sessions.values():
        session["status"] = "stopped"
        ws = session.get("ws")
        if ws:
            try:
                await asyncio.wait_for(ws.close(), timeout=1.0)
            except:
                pass


app = FastAPI(lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Utils ---
def save_txt_file(assignment_id: str, content: str):
    file_path = os.path.join(ASSIGNMENT_TXT_DIR, f"{assignment_id}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return file_path


def parse_due_date(date_str):
    if not date_str:
        return None
    try:
        if "T" in date_str:
            return datetime.fromisoformat(date_str.replace("Z", ""))
        else:
            return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception as e:
        logger.error(f"DATE PARSE ERROR: {e}")
        return None


# --- Pydantic Models ---
class RegenerateQuestionsRequest(BaseModel):
    filePdf: str
    classroomId: str
    creatorId: str
    title: str


class ConfirmAssignmentRequest(BaseModel):
    title: str
    filePdf: Optional[str] = None
    classroomId: str
    creatorId: str
    dueDate: Optional[str] = None
    generatedFileTxt: Optional[str] = None
    generatedContent: Optional[str] = None
    chatHistory: Optional[list] = None
    answerFile: Optional[list] = None
    status: Optional[str] = "PUBLISHED"


# --- Assignment Endpoints ---
@app.post("/api/assignments/upsert")
def upsert_assignment(
    payload: AssignmentUpsertRequest,
    assignment_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        logger.info("========== UPSERT START ==========")
        due_date = parse_due_date(payload.dueDate)

        final_assignment_id = create_assignment(db, payload, assignment_id)
        attach_to_classroom(db, final_assignment_id,
                            payload.classroomId, due_date)

        db.commit()
        logger.info("========== UPSERT SUCCESS ==========")
        return {"success": True, "assignmentId": final_assignment_id}
    except Exception as e:
        db.rollback()
        logger.error(f"UPSERT ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# generate คำถาม + answer ไม่ save DB
# @app.post("/api/assignments/generate-questions")
# async def generate_questions_endpoint(payload: RegenerateQuestionsRequest):
#     try:
#         logger.info("========== GENERATE QUESTIONS START ==========")

#         pdf_path = os.path.join(DATA_DIR, payload.filePdf)
#         if not os.path.exists(pdf_path):
#             raise HTTPException(status_code=404, detail="PDF not found")

#         loop = asyncio.get_event_loop()
#         temp_id = str(uuid.uuid4())
#         pdf_filename = os.path.basename(payload.filePdf)
#         file_name_no_ext = os.path.splitext(pdf_filename)[0]

#         extract_dir = os.path.join(BASE_DIR, "data", "extractpdf-txt")
#         final_txt_path = os.path.join(extract_dir, f"{file_name_no_ext}.txt")
#         extracted_text = open(final_txt_path, "r", encoding="utf-8").read()

#         questions_raw = await loop.run_in_executor(
#             None, run_genquestiontext, final_txt_path
#         )

#         logger.info(f"TOTAL QUESTIONS GENERATED: {len(questions_raw)} ข้อ")

#         answer_data = await loop.run_in_executor(
#             None, run_genanswer, temp_id, final_txt_path, questions_raw
#         )

#         questions = [
#             {"role": "assistant", "content": q}
#             for q in questions_raw
#         ]

#         logger.info("========== GENERATE QUESTIONS SUCCESS ==========")

#         # ไม่ save DB เลย
#         return {
#             "success": True,
#             "assignment": {
#                 "chat_history": questions,
#                 "generated_file_txt": final_txt_path,
#                 "generated_content": extracted_text,
#                 "answer_file": answer_data,
#             }
#         }

#     except Exception as e:
#         logger.error(f"GENERATE QUESTIONS ERROR: {traceback.format_exc()}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assignments/generate-questions")
async def generate_questions_endpoint(payload: RegenerateQuestionsRequest):
    try:
        logger.info("========== GENERATE QUESTIONS START ==========")

        # 1. เตรียม Path ของไฟล์ PDF ต้นทาง
        pdf_path = os.path.join(DATA_DIR, payload.filePdf)
        if not os.path.exists(pdf_path):
            logger.error(f"PDF not found at: {pdf_path}")
            raise HTTPException(
                status_code=404, detail="ไม่พบไฟล์ PDF ต้นฉบับ")

        # 2. จัดการเรื่อง Path ของไฟล์ Text
        loop = asyncio.get_event_loop()
        pdf_filename = os.path.basename(payload.filePdf)
        file_name_no_ext = os.path.splitext(pdf_filename)[0]

        # ตรวจสอบว่า extract_dir มีอยู่จริง
        extract_dir = os.path.join(BASE_DIR, "data", "extractpdf-txt")
        os.makedirs(extract_dir, exist_ok=True)
        final_txt_path = os.path.join(extract_dir, f"{file_name_no_ext}.txt")

        # 3. [CRITICAL] ตรวจสอบว่ามีไฟล์ txt หรือยัง ถ้าไม่มีให้รัน extract_pdf ก่อน
        if not os.path.exists(final_txt_path):
            logger.info(
                f"Text file not found. Starting OCR for: {pdf_filename}")
            # รัน Gemini OCR ใน executor เพื่อไม่ให้ block event loop
            await loop.run_in_executor(None, extract_pdf, pdf_path)

            # เช็คอีกครั้งเผื่อเกิดความผิดพลาดในการสร้างไฟล์
            if not os.path.exists(final_txt_path):
                raise HTTPException(
                    status_code=500, detail="กระบวนการสกัดข้อความจาก PDF ล้มเหลว")

        # 4. อ่านเนื้อหาที่สกัดมาได้
        with open(final_txt_path, "r", encoding="utf-8") as f:
            extracted_text = f.read()

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400, detail="ไฟล์ PDF ไม่มีเนื้อหาข้อความ")

        # 5. สั่งสร้างคำถาม (Run Gen Question)
        logger.info("Generating questions using Typhoon LLM...")
        questions_raw = await loop.run_in_executor(
            None, run_genquestiontext, final_txt_path
        )

        if not questions_raw:
            logger.warning("No questions generated.")
            questions_raw = []

        logger.info(f"TOTAL QUESTIONS GENERATED: {len(questions_raw)} ข้อ")

        # 6. สั่งสร้างเฉลยมาตรฐาน (Run Gen Answer)
        temp_id = str(uuid.uuid4())
        logger.info("Generating standard answers for verification...")
        answer_data = await loop.run_in_executor(
            None, run_genanswer, temp_id, final_txt_path, questions_raw
        )

        # 7. จัดรูปแบบ chat_history สำหรับส่งกลับไปแสดงผลบน Frontend
        questions = [
            {"role": "assistant", "content": q}
            for q in questions_raw
        ]

        logger.info("========== GENERATE QUESTIONS SUCCESS ==========")

        # ส่งคืนข้อมูลทั้งหมด เพื่อให้ User ตรวจสอบก่อนกด Confirm ลง DB
        return {
            "success": True,
            "assignment": {
                "chat_history": questions,
                "generated_file_txt": final_txt_path,
                "generated_content": extracted_text,
                "answer_file": answer_data,
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"GENERATE QUESTIONS ERROR: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {str(e)}")

# save DB ครั้งเดียวตอนกด "ยืนยัน"


@app.post("/api/assignments/confirm")
async def confirm_assignment(
    payload: ConfirmAssignmentRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info("========== CONFIRM ASSIGNMENT START ==========")

        assignment_id = str(uuid.uuid4())
        due_date = parse_due_date(payload.dueDate)

        assignment_payload = AssignmentUpsertRequest(
            title=payload.title,
            creatorId=payload.creatorId,
            classroomId=payload.classroomId,
            dueDate=payload.dueDate,
            filePdf=payload.filePdf,
            generatedFileTxt=payload.generatedFileTxt,
            generatedContent=payload.generatedContent,
            chatHistory=payload.chatHistory,
            answerFile=payload.answerFile,
            status=payload.status or "PUBLISHED"
        )

        final_assignment_id = create_assignment(
            db, assignment_payload, assignment_id)
        attach_to_classroom(db, final_assignment_id,
                            payload.classroomId, due_date)
        db.commit()

        logger.info("========== CONFIRM ASSIGNMENT SUCCESS ==========")
        return {"success": True, "assignmentId": final_assignment_id}

    except Exception as e:
        db.rollback()
        logger.error(f"CONFIRM ASSIGNMENT ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
def upload_pdf(file: UploadFile = File(...)):
    upload_path = os.path.join(DATA_DIR, file.filename)
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"success": True, "filePdf": file.filename}


# --- Face Check ---
@app.post("/api/check-face")
async def check_face(frame: UploadFile = File(...)):
    contents = await frame.read()
    img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {"face_detected": False}
    faces = face_cascade.detectMultiScale(
        cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 4
    )
    return {"face_detected": len(faces) > 0}


# --- Session Endpoints ---
class StartSessionRequest(BaseModel):
    assignment_id: str
    classroom_assignment_id: str
    user_id: str
    duration: int = 10


@app.post("/api/session/start")
async def start_session(payload: StartSessionRequest):
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = {
        "status": "running",
        "paused": False,
        "ws": None,
        "user_id": payload.user_id,
        "duration": payload.duration,
        "classroom_assignment_id": payload.classroom_assignment_id,
    }
    asyncio.create_task(
        run_check_session(session_id, payload.assignment_id,
                          active_sessions, payload.duration)
    )
    return {"session_id": session_id}


@app.post("/api/session/{session_id}/pause")
async def pause_session(session_id: str):
    if session_id in active_sessions:
        active_sessions[session_id]["paused"] = True
    return {"status": "paused"}


@app.post("/api/session/{session_id}/resume")
async def resume_session(session_id: str):
    if session_id in active_sessions:
        active_sessions[session_id]["paused"] = False
    return {"status": "resumed"}


@app.websocket("/ws/session/{session_id}")
async def ws_session(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"connection open")
    if session_id in active_sessions:
        active_sessions[session_id]["ws"] = websocket
    try:
        while True:
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        logger.info(f"connection closed")
        if session_id in active_sessions:
            active_sessions[session_id]["ws"] = None


@app.post("/api/session/{session_id}/stop")
async def stop_session(session_id: str):
    if session_id in active_sessions:
        active_sessions[session_id]["status"] = "stopped"
        ws = active_sessions[session_id].get("ws")
        if ws:
            try:
                await ws.close()
            except:
                pass
    return {"status": "stopped"}
