import { getSession } from "next-auth/react";
import { Character, CreateCharacter } from "./types";
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'


export const createCharacter = async (args: CreateCharacter) => {
    const session = await getSession()

    const res = await fetchers.Post<{ accessToken: string }>(`${ENDPOINT}/character/internal/create/character`, {
        data: args,
        token: session?.user.accessToken,
    })

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }
    return res.data
}

export const getAllCharacters = async () => {
    const session = await getSession()

    const res = await fetchers.Get<Character[]>(`${ENDPOINT}/character/internal/all`, {
        token: session?.user.accessToken,
    })

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}

export const getCharacter = async (id: string) => {
    const session = await getSession()

    const res = await fetchers.Get<Character>(`${ENDPOINT}/character/internal/character/${id}`, {
        token: session?.user.accessToken,
    })

    if (res.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new Error(res.message)
    }

    return res.data
}