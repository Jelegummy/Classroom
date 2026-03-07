export interface AnalyzeAssignmentResponse {
  success: boolean
  assignmentId: string
  assignment: {
    chat_history: {
      role: string
      content: string
    }[]
    generated_file_txt: string
  }
}

export interface CreateAssignmentArgs {
  title: string
  classroomId: string
  description?: string
  chatHistory: {
    role: string
    content: string
  }[]
  generatedFileTxt?: string
  filePdf?: string
  creatorId: string
  dueDate?: string
  status?: 'DRAFT' | 'PUBLISHED'
}

export interface CreateAssignmentResponse {
  success: boolean
  assignmentId: string
}

export interface GetAssignmentResponse {
  id: string
  title: string
  chatHistory: {
    role: string
    content: string
  }[]
  filePdf?: string | null
  description?: string | null
  creatorId?: string | null
  classrooms: {
    classroomId: string
    dueDate?: string | null
    submissions: {
      id: string
      userId: string
      score?: number | null
      isApproved: boolean
      submittedAt: string
    }[]
  }[]
}

export interface DeleteAssignmentResponse {
  message: string
}

export type GetAssignmentsByClassroomResponse = {
  id: string
  title: string
  status: string
  classroomId: string
  classrooms: {
    dueDate: string | null
    submissions: {
      id: string
      userId: string
    }[]
  }[]
}

// types.ts (เพิ่มเข้าไป)

export type GetSubmissionsByAssignmentResponse = {
  id: string
  isApproved: boolean
  submittedAt: string
  score?: number | null
  aiFeedback?: string | null
  transcription?: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    studentId?: string | null
  }
}

export type ApproveSubmissionResponse = {
  id: string
  isApproved: boolean
}

export type GetAnswerHistoryResponse = {
  id: string
  answerHistory: {
    role: 'bot' | 'student'
    content: string
    timestamp?: string
  }[] | null
  user: {
    firstName: string
    lastName: string
  }
}