import { env } from '../../app/config/env'
import { ApiError } from './apiError'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...requestInit } = options
  const headers = new Headers(requestInit.headers)

  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...requestInit,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? response.statusText, payload)
  }

  return payload as T
}

export const httpClient = {
  get<T>(path: string) {
    return request<T>(path, { method: 'GET' })
  },
  post<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'POST', body })
  },
  put<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'PUT', body })
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body })
  },
}
