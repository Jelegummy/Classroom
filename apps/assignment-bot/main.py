import os
import shutil
import uuid
import logging
import traceback
import asyncio

import cv2
import numpy as np
from contextlib import asynccontextmanager
from pydantic import BaseModel

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import time
from database import get_db
from schemas import AssignmentUpsertRequest, ProcessPdfRequest
from services.assignment_service import create_assignment, attach_to_classroom
from service.genquestion import run_genquestiontext
from service.extractpdf import extract_pdf
from service.checkhomework import run_check_session

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
    # force stop ทุก session ตอน shutdown
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


# --- Assignment Endpoints ---
@app.post("/api/assignments/upsert")
def upsert_assignment(
    payload: AssignmentUpsertRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info("========== UPSERT START ==========")
        due_date = parse_due_date(payload.dueDate)
        assignment_id = create_assignment(db, payload)
        attach_to_classroom(db, assignment_id, payload.classroomId, due_date)
        db.commit()
        logger.info("========== UPSERT SUCCESS ==========")
        return {"success": True, "assignmentId": assignment_id}
    except Exception as e:
        db.rollback()
        logger.error(f"UPSERT ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assignments/process-pdf")
async def process_pdf(
    payload: ProcessPdfRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info("========== PROCESS PDF START ==========")

        pdf_path = os.path.join(DATA_DIR, payload.filePdf)
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF not found")

        loop = asyncio.get_event_loop()

        # รัน CPU-heavy ใน thread แยก ไม่บล็อก event loop
        extracted_text = await loop.run_in_executor(
            None, extract_pdf, pdf_path
        )

        temp_assignment_id = str(uuid.uuid4())
        txt_path = save_txt_file(temp_assignment_id, extracted_text)

        # LLM รัน thread แยก
        questions_raw = await loop.run_in_executor(
            None, run_genquestiontext, extracted_text
        )

        questions = [
            {"role": "assistant", "content": q}
            for q in questions_raw
        ]

        logger.info(f"🔥 GENERATED QUESTIONS: {len(questions)} ข้อ")

        due_date = parse_due_date(payload.dueDate)

        payload_dict = AssignmentUpsertRequest(
            title=payload.title,
            chatHistory=questions,
            filePdf=payload.filePdf,
            generatedFileTxt=txt_path,
            creatorId=payload.creatorId,
            classroomId=payload.classroomId,
            dueDate=payload.dueDate,
            status="DRAFT"
        )

        assignment_id = create_assignment(db, payload_dict)

        return {
            "success": True,
            "assignmentId": assignment_id,
            "assignment": {
                "chat_history": questions,
                "generated_file_txt": txt_path
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"PROCESS PDF ERROR: {traceback.format_exc()}")
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


@app.post("/api/session/start")
async def start_session(payload: StartSessionRequest):
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = {
        "status": "running",
        "paused": False,
        "ws": None,
    }
    asyncio.create_task(
        run_check_session(session_id, payload.assignment_id, active_sessions)
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
