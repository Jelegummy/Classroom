import { ENDPOINT, fetchers, HttpStatus } from "@/utils";
import { CreateClassroom, UpdateClassroom } from "./types";

export const CreateClassRoom = async (args: CreateClassroom) => {
    const res = await fetchers.Post<{ accessToken: string }>(
        `${ENDPOINT}/classroom/internal/create`,
        { data: args },
    )
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}

export const UpdateClassRoom = async (args: UpdateClassroom) => {
    const res = await fetchers.Patch(`${ENDPOINT}/classroom/internal/update`, {
        data: args,
    })
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}

export const getClassroom = async (id: string) => {
    const res = await fetchers.Get(`${ENDPOINT}/classroom/internal/classroom/${id}`)
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const getAllClassrooms = async () => {
    const res = await fetchers.Get(`${ENDPOINT}/classroom/internal/all`)
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const deleteClassroom = async (id: string) => {
    const res = await fetchers.Delete(`${ENDPOINT}/classroom/internal/delete/${id}`)
    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
}