import { signOut } from 'next-auth/react'

type ModifiedResponse<T = Record<string, unknown>> = {
  statusCode: number
  message?: string
  data?: T
}

export const Get = async <T = Record<string, unknown>>(
  url: string,
  options?: { token?: string; headers?: { [key: string]: string } },
): Promise<ModifiedResponse<T>> => {
  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options?.headers,
    })

    const res = await fetch(url, {
      method: 'GET',
      headers,
    })

    return await handleResponse(res)
  } catch (e) {
    return (await handleError(e)) as ModifiedResponse<T>
  }
}

export const Post = async <T = Record<string, unknown>>(
  url: string,
  options?: {
    data?: object
    token?: string
    headers?: { [key: string]: string }
  },
): Promise<ModifiedResponse<T>> => {
  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options?.headers,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(options?.data ? options.data : {}),
    })

    return await handleResponse(res)
  } catch (e) {
    return (await handleError(e)) as ModifiedResponse<T>
  }
}

export const Patch = async <T = Record<string, unknown>>(
  url: string,
  options?: { data?: object; token?: string },
): Promise<ModifiedResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: JSON.stringify(options?.data ? options.data : {}),
    })

    return await handleResponse(res)
  } catch (e) {
    return (await handleError(e)) as ModifiedResponse<T>
  }
}

export const Delete = async <T = Record<string, unknown>>(
  url: string,
  options?: { data?: object; token?: string },
): Promise<ModifiedResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: JSON.stringify(options?.data ? options.data : {}),
    })

    return await handleResponse(res)
  } catch (e) {
    return (await handleError(e)) as ModifiedResponse<T>
  }
}

export const Upload = async <T = Record<string, unknown>>(
  url: string,
  options: { data: FormData; token?: string },
): Promise<ModifiedResponse<T>> => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.data,
    })

    return await handleResponse(res)
  } catch (e) {
    return (await handleError(e)) as ModifiedResponse<T>
  }
}

const handleResponse = async <T = Record<string, unknown>>(
  res: Response,
): Promise<ModifiedResponse<T>> => {
  if (res.ok) {
    try {
      const data = await res.json()

      return {
        statusCode: data.statusCode,
        message: data.message,
        data: data.data,
      }
    } catch {
      return { statusCode: 1000, message: 'ไม่สามารถดึงข้อมูลได้' }
    }
  } else {
    throw res
  }
}

const handleError = async (err: unknown): Promise<ModifiedResponse> => {
  try {
    const data = (await (err as Response).json()) as ModifiedResponse

    if (data.statusCode === 401) {
      signOut()

      return {
        statusCode: data.statusCode,
        message: 'กรุณาเข้าสู่ระบบ',
      }
    }

    return {
      statusCode: data.statusCode,
      data: data.data,
      message: data.message,
    }
  } catch {
    return {
      statusCode: (err as Response).status,
      message: 'ไม่สามารถดึงข้อมูลได้',
    }
  }
}
