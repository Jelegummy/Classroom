const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:8000'

const API_8000 =
  process.env.NEXT_PUBLIC_API_8000 ??
  'http://127.0.0.1:8000'

const API_4000 =
  process.env.NEXT_PUBLIC_API_4000 ??
  'http://127.0.0.1:4000'

// async function request<T>(
//   url: string,
//   options?: RequestInit
// ): Promise<T> {
//   const isFormData =
//     options?.body instanceof FormData

//   const res = await fetch(`${BASE_URL}${url}`, {
//     credentials: 'include',
//     headers: {
//       ...(isFormData
//         ? {}
//         : { 'Content-Type': 'application/json' }),
//       ...(options?.headers || {}),
//     },
//     ...options,
//   })

//   const data = await res.json().catch(() => null)

//   if (!res.ok) {
//     const message =
//       data?.detail?.[0]?.msg ||
//       data?.detail ||
//       data?.message ||
//       'Something went wrong'

//     throw new Error(message)
//   }

//   return data as T
// }

// export const apiClient = {
//   get: <T>(url: string) => request<T>(url),

//   post: <T>(url: string, body?: unknown) =>
//     request<T>(url, {
//       method: 'POST',
//       body: JSON.stringify(body),
//     }),

//   postForm: <T>(url: string, formData: FormData) =>
//     request<T>(url, {
//       method: 'POST',
//       body: formData,
//     }),
// }


async function request<T>(
  base: string,
  url: string,
  options?: RequestInit
): Promise<T> {
  const isFormData =
    options?.body instanceof FormData

  const res = await fetch(`${base}${url}`, {
    credentials: 'include',
    headers: {
      ...(isFormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options?.headers || {}),
    },
    ...options,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      data?.detail?.[0]?.msg ||
      data?.detail ||
      data?.message ||
      'Something went wrong'

    throw new Error(message)
  }

  return data as T
}

export const api8000 = {
  post: <T>(url: string, body?: unknown) =>
    request<T>(API_8000, url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // 👇 เพิ่มอันนี้เข้าไป
  postForm: <T>(url: string, formData: FormData) =>
    request<T>(API_8000, url, {
      method: 'POST',
      body: formData,
    }),
}

export const api4000 = {
  get: <T>(url: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<T>(API_4000, url + query, { method: 'GET' })
  },
  post: <T>(url: string, body?: unknown) =>
    request<T>(API_4000, url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  delete: <T>(url: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<T>(API_4000, url + query, { method: 'DELETE' })
  },
}