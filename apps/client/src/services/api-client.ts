const API_8000 =
  process.env.NEXT_PUBLIC_FAST_API_ENDPOINT ?? 'http://127.0.0.1:8000'

async function request<T>(
  base: string,
  url: string,
  options?: RequestInit,
): Promise<T> {
  const isFormData = options?.body instanceof FormData

  const res = await fetch(`${base}${url}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  postForm: <T>(url: string, formData: FormData) =>
    request<T>(API_8000, url, {
      method: 'POST',
      body: formData,
    }),
}
