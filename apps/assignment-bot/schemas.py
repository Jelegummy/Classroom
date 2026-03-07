from pydantic import BaseModel
from typing import Optional, List


class AssignmentUpsertRequest(BaseModel):
    title: str
    chatHistory: Optional[List[dict]] = None
    filePdf: Optional[str] = None
    generatedFileTxt: Optional[str] = None
    creatorId: str
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
