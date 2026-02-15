import { ENDPOINT, fetchers, HttpStatus } from "@/utils"
import { getSession } from "next-auth/react"
import { CreateTutorArgs, Tutor } from "./types"

export const createTutor = async (args: CreateTutorArgs) => {
    const session = await getSession()

    const res = await fetchers.Post<CreateTutorArgs>(
        `${ENDPOINT}/tutor/internal/create`,
        {
            data: args,
            token: session?.user.accessToken,
        }
    )

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const getAllTutors = async () => {
    const session = await getSession()

    const res = await fetchers.Get<Tutor[]>(
        `${ENDPOINT}/tutor/internal/all`,
        {
            token: session?.user.accessToken,
        }
    )

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const getTutorById = async (id: string) => {
    const session = await getSession()

    const res = await fetchers.Get<Tutor>(
        `${ENDPOINT}/tutor/internal/${id}`,
        {
            token: session?.user.accessToken,
        }
    )

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

