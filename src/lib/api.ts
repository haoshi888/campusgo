const USER_KEY = 'campusgo_user_id'
const SESSION_KEY = 'campusgo_session_id'

export function getStoredUserId() {
  return localStorage.getItem(USER_KEY)
}

export function setStoredUserId(userId: string | null) {
  if (userId) localStorage.setItem(USER_KEY, userId)
  else localStorage.removeItem(USER_KEY)
}

export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const query = new URLSearchParams()
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const headers = new Headers(options.headers)
  const userId = getStoredUserId()
  if (userId) headers.set('x-user-id', userId)
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`/api${path}${suffix}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.message || '请求失败，请稍后重试', response.status)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
}
