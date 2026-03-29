from pydantic import BaseModel
from typing import Optional, List


class AssignmentUpsertRequest(BaseModel):
    title: str
    chatHistory: Optional[List[dict]] = None
    filePdf: Optional[str] = None
    generatedFileTxt: Optional[str] = None
    creatorId: str
    generatedContent: Optional[str] = None
    answerFile: Optional[List[dict]] = None
    description: Optional[str] = None
    classroomId: str
    dueDate: Optional[str] = None
    status: Optional[str] = "DRAFT"


class ProcessPdfRequest(BaseModel):
    title: str
    filePdf: str
    creatorId: str
    classroomId: str
    dueDate: Optional[str] = None
