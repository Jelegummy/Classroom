import { getSession } from 'next-auth/react'
import { api8000,api4000 } from '../api-client'
import {
  AnalyzeAssignmentResponse,
  CreateAssignmentArgs,
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssignmentsByClassroomResponse,
  GetAssignmentResponse,
  GetSubmissionsByAssignmentResponse,
  ApproveSubmissionResponse,
  GetAnswerHistoryResponse,
} from './types'
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'

export async function analyzeAssignment(
  title: string,
  file: File,
  classroomId: string,
  creatorId: string,
  dueDate?: string
): Promise<AnalyzeAssignmentResponse> {

  const formData = new FormData()
  formData.append('file', file)

  const uploadRes = await api8000.postForm<{
    success: boolean
    filePdf: string
  }>('/api/upload', formData)

  const result = await api8000.post<AnalyzeAssignmentResponse>(
    '/api/assignments/process-pdf',
    {
      title,
      filePdf: uploadRes.filePdf,
      classroomId,
      creatorId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    }
  )

  return result  
}

export async function createAssignment(
  args: CreateAssignmentArgs
): Promise<CreateAssignmentResponse> {
  return api8000.post<CreateAssignmentResponse>(
    '/api/assignments/upsert',
    {
      title: args.title,
      description: args.description,
      classroomId: args.classroomId,
      generatedFileTxt: args.generatedFileTxt,
      chatHistory: args.chatHistory,
      filePdf: args.filePdf,     
      creatorId: args.creatorId,
      dueDate: args.dueDate
        ? new Date(args.dueDate).toISOString()
        : null,
      status: args.status ?? 'DRAFT',
    }
  )
}

export async function startSession(assignmentId: string) {
  return api8000.post<{ session_id: string }>(
    '/api/session/start',
    { assignment_id: assignmentId }
  )
}

export async function pauseSession(sessionId: string) {
  return api8000.post<{ status: string }>(
    `/api/session/${sessionId}/pause`,
    {}
  )
}

export async function resumeSession(sessionId: string) {
  return api8000.post<{ status: string }>(
    `/api/session/${sessionId}/resume`,
    {}
  )
}

export async function checkFace(frame: Blob) {
  const formData = new FormData()
  formData.append('frame', frame, 'frame.jpg')
  return api8000.postForm<{ face_detected: boolean }>(
    '/api/check-face',
    formData
  )
}

// export async function getAssignment(assignmentId: string) {
//   return api4000.get<GetAssignmentResponse>(
//     '/assignment/internal/get-assignment',
//     { assignmentId }
//   )
// }

export const getAssignment = async (assignmentId: string) => {
  const session = await getSession()
  const res = await fetchers.Get<GetAssignmentResponse>(
    `${ENDPOINT}/assignment/internal/get-assignment/${assignmentId}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getAllAssignments = async (args: { classroomId?: string }) => {
  const session = await getSession()
  const queryString = args.classroomId ? `?classroomId=${args.classroomId}` : ''
  const res = await fetchers.Get<GetAssignmentsByClassroomResponse[]>(
    `${ENDPOINT}/assignment/internal/all${queryString}`,
    {
      token: session?.user.accessToken,
    },
  )

  return res.data
}

export async function deleteAssignment(assignmentId: string) {
  return api4000.post<DeleteAssignmentResponse>(
    '/assignment/internal/delete-assignment',
    { assignmentId }
  )
}

// export async function getAssignmentsByClassroom(classroomId: string) {
//   return api4000.get<GetAssignmentsByClassroomResponse[]>(
//     '/assignment/internal/get-assignments-by-classroom',
//     { classroomId }
//   )
// }

export async function getSubmissionsByAssignment(
  assignmentId: string,
  classroomId: string,
) {
  return api4000.get<GetSubmissionsByAssignmentResponse[]>(
    '/assignment/internal/getsubmissions',
    { assignmentId, classroomId },
  )
}

export async function approveSubmission(
  submissionId: string,
  isApproved: boolean,
) {
  return api4000.post<ApproveSubmissionResponse>(
    '/assignment/internal/approvesubmission',
    { submissionId, isApproved },
  )
}

export async function getAnswerHistory(submissionId: string) {
  return api4000.get<GetAnswerHistoryResponse>(
    '/assignment/internal/getanswerhistory',
    { submissionId },
  )
}

export async function stopSession(sessionId: string) {
  return api8000.post<{ status: string }>(
    `/api/session/${sessionId}/stop`,
    {}
  )
}