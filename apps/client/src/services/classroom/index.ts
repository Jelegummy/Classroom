import { ENDPOINT, fetchers, HttpStatus } from "@/utils";
import { Classroom, CreateClassroom, UpdateClassroom } from "./types";
import { getSession } from "next-auth/react";

export const CreateClassRoom = async (args: CreateClassroom) => {
    const session = await getSession()

    const res = await fetchers.Post<{ accessToken: string }>(
        `${ENDPOINT}/classroom/internal/create`,
        {
            data: args,
            token: session?.user.accessToken,
        },
    )
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}

export const UpdateClassRoom = async (args: UpdateClassroom) => {
    const session = await getSession()

    const res = await fetchers.Patch(`${ENDPOINT}/classroom/internal/update`, {
        data: args,
        token: session?.user.accessToken,
    })
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}

export const getClassroom = async (id: string) => {
    const session = await getSession()
    const res = await fetchers.Get<Classroom>(`${ENDPOINT}/classroom/internal/classroom/${id}`, {
        token: session?.user.accessToken,
    })
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const getAllClassrooms = async () => {
    const session = await getSession()
    const res = await fetchers.Get<Classroom[]>(`${ENDPOINT}/classroom/internal/all`, {
        token: session?.user.accessToken,
    })
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const deleteClassroom = async (id: string) => {
    const session = await getSession()
    const res = await fetchers.Delete(`${ENDPOINT}/classroom/internal/delete/${id}`, {
        token: session?.user.accessToken,
    })
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}