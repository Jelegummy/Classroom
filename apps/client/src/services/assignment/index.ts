import { getSession } from 'next-auth/react'
import { api8000, api4000 } from '../api-client'
import {
  AnalyzeAssignmentResponse,
  CreateAssignmentArgs,
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssignmentsByClassroomResponse,
  GetAssignmentResponse,
  GetSubmissionsByAssignmentResponse,
  ApproveSubmissionResponse,
  GetSubmissionDetailResponse,
} from './types'
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'

export async function generateQuestions(
  title: string,
  file: File,
  classroomId: string,
  creatorId: string,
  dueDate?: string,
): Promise<AnalyzeAssignmentResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const uploadRes = await api8000.postForm<{
    success: boolean
    filePdf: string
  }>('/api/upload', formData)

  return api8000.post<AnalyzeAssignmentResponse>(
    '/api/assignments/generate-questions',
    {
      title,
      filePdf: uploadRes.filePdf,
      classroomId,
      creatorId,
    },
  )
}

// regenerate คำถามใหม่ — ไม่ save DB
export async function regenerateQuestions(
  filePdf: string,
  classroomId: string,
  creatorId: string,
  title: string,
): Promise<AnalyzeAssignmentResponse> {
  return api8000.post<AnalyzeAssignmentResponse>(
    '/api/assignments/generate-questions',
    { filePdf, classroomId, creatorId, title },
  )
}

// save DB ครั้งเดียวตอนกด "ยืนยัน"
export async function confirmAssignment(payload: {
  title: string
  filePdf?: string
  classroomId: string
  creatorId: string
  dueDate?: string
  generatedFileTxt?: string
  generatedContent?: string
  chatHistory: { role: string; content: string }[]
  answerFile?: { answer: string; question: string }[]
}): Promise<{ success: boolean; assignmentId: string }> {
  return api8000.post('/api/assignments/confirm', {
    ...payload,
    status: 'PUBLISHED',
  })
}

export async function createAssignment(
  args: CreateAssignmentArgs,
): Promise<CreateAssignmentResponse> {
  return api8000.post<CreateAssignmentResponse>('/api/assignments/upsert', {
    title: args.title,
    description: args.description,
    classroomId: args.classroomId,
    generatedFileTxt: args.generatedFileTxt,
    chatHistory: args.chatHistory,
    filePdf: args.filePdf,
    creatorId: args.creatorId,
    dueDate: args.dueDate ? new Date(args.dueDate).toISOString() : null,
    status: args.status ?? 'DRAFT',
  })
}

export async function startSession(payload: {
  assignmentId: string
  classroomAssignmentId: string
  userId: string
  duration?: number
}) {
  return api8000.post<{ session_id: string }>('/api/session/start', {
    assignment_id: payload.assignmentId,
    classroom_assignment_id: payload.classroomAssignmentId,
    duration: payload.duration,
    user_id: payload.userId,
  })
}

export async function pauseSession(sessionId: string) {
  return api8000.post<{ status: string }>(`/api/session/${sessionId}/pause`, {})
}

export async function resumeSession(sessionId: string) {
  return api8000.post<{ status: string }>(
    `/api/session/${sessionId}/resume`,
    {},
  )
}

export async function checkFace(frame: Blob) {
  const formData = new FormData()
  formData.append('frame', frame, 'frame.jpg')
  return api8000.postForm<{ face_detected: boolean }>(
    '/api/check-face',
    formData,
  )
}

export const getAssignment = async (assignmentId: string) => {
  const session = await getSession()
  const res = await fetchers.Get<GetAssignmentResponse>(
    `${ENDPOINT}/assignment/internal/get-assignment/${assignmentId}`,
    { token: session?.user.accessToken },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export const getAllAssignments = async (args: { classroomId?: string }) => {
  const session = await getSession()
  const queryString = args.classroomId ? `?classroomId=${args.classroomId}` : ''
  const res = await fetchers.Get<GetAssignmentsByClassroomResponse[]>(
    `${ENDPOINT}/assignment/internal/all${queryString}`,
    { token: session?.user.accessToken },
  )
  return res.data
}

export async function deleteAssignment(assignmentId: string) {
  const session = await getSession()
  const res = await fetchers.Delete<DeleteAssignmentResponse[]>(
    `${ENDPOINT}/assignment/internal/delete/${assignmentId}`,
    { token: session?.user.accessToken },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export const getClassroomAssignment = async (
  assignmentId: string,
  classroomId: string,
) => {
  const session = await getSession()
  const res = await fetchers.Get<{ id: string }>(
    `${ENDPOINT}/assignment/internal/classroom-assignment/${assignmentId}/${classroomId}`,
    { token: session?.user.accessToken },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export const getSubmissionsByAssignment = async (
  assignmentId: string,
  classroomId: string,
) => {
  const session = await getSession()
  const res = await fetchers.Get<GetSubmissionsByAssignmentResponse[]>(
    `${ENDPOINT}/assignment/internal/submissions/${assignmentId}/${classroomId}`,
    { token: session?.user.accessToken },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export const approveSubmission = async (
  submissionId: string,
  isApproved: boolean,
) => {
  const session = await getSession()
  const res = await fetchers.Post<ApproveSubmissionResponse>(
    `${ENDPOINT}/assignment/internal/approvesubmission`,
    {
      data: { submissionId, isApproved },
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export const getSubmissionDetail = async (submissionId: string) => {
  const session = await getSession()
  const res = await fetchers.Get<GetSubmissionDetailResponse>(
    `${ENDPOINT}/assignment/internal/submission/${submissionId}`,
    { token: session?.user.accessToken },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) throw new Error(res.message)
  return res.data
}

export async function stopSession(sessionId: string) {
  return api8000.post<{ status: string }>(`/api/session/${sessionId}/stop`, {})
}
