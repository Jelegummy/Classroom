import uuid
import json
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text


def create_assignment(db: Session, payload):
    assignment_id = str(uuid.uuid4())

    db.execute(text("""
        INSERT INTO assignments (
            id,
            title,
            chat_history,
            file_pdf,
            generated_file_txt,
            creator_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            :id,
            :title,
            :chat_history,
            :file_pdf,
            :generated_file_txt,
            :creator_id,
            :status,
            NOW(),
            NOW()
        )
    """), {
        "id": assignment_id,
        "title": payload.title,
        "chat_history": json.dumps(payload.chatHistory or []),
        "file_pdf": payload.filePdf,
        "generated_file_txt": payload.generatedFileTxt,
        "creator_id": payload.creatorId,
        "status": payload.status
    })

    return assignment_id


def attach_to_classroom(
    db: Session,
    assignment_id: str,
    classroom_id: str,
    due_date: Optional[str]
):
    db.execute(text("""
        INSERT INTO classroom_assignments (
            id,
            due_date,
            classroom_id,
            assignment_id
        )
        VALUES (
            :id,
            :due_date,
            :classroom_id,
            :assignment_id
        )
    """), {
        "id": str(uuid.uuid4()),
        "due_date": due_date,
        "classroom_id": classroom_id,
        "assignment_id": assignment_id
    })
