// All calls to the ShiftHub API go through this file.

import type { User } from '../types'

// Base URL of the API, injected by Vite at build time (VITE_API_URL).
// A trailing slash is removed so paths like `/api/health` join cleanly.
export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------
// The login token lives in localStorage so it survives a page reload.
// localStorage can throw (private mode, blocked storage), so every access is guarded.

const TOKEN_KEY = 'shifthub.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable: the user stays logged in until the page reloads.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear.
  }
}

// Called when a request that SENT a token gets a 401 (expired token, deleted user).
// AuthProvider registers a function here that logs the user out.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

// Every failed API call throws this. `code` comes from the server's error format
// ({ error: { message, code, details? } }), or is NETWORK_ERROR / UNKNOWN on the client side.
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type ErrorBody = { error: { message: string; code: string; details?: unknown } }

// Type guard: checks at runtime that a response body has our error shape.
function isErrorBody(data: unknown): data is ErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false
  const error = (data as { error: unknown }).error
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { message?: unknown }).message === 'string' &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}

// Some responses aren't JSON (204 No Content, an HTML error page from a proxy).
function parseJson(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// The fetch wrapper
// ---------------------------------------------------------------------------

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown // sent as JSON
  signal?: AbortSignal
  // false = never send the token and never auto-logout on 401 (used by login).
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true } = options

  if (!API_URL) {
    throw new ApiError('VITE_API_URL is not set', 'CONFIG_ERROR', 0)
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // Network errors (server down, CORS blocked, DNS) surface as a vague TypeError.
    if (err instanceof TypeError) {
      throw new ApiError(`Could not reach the API at ${API_URL}`, 'NETWORK_ERROR', 0)
    }
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new ApiError('The server took too long to respond', 'NETWORK_ERROR', 0)
    }
    throw err // AbortError: the caller cancelled on purpose
  }

  const data = parseJson(await res.text())

  if (!res.ok) {
    // Only a request that carried a token can mean "your session is over".
    // A 401 from login (wrong password) has no token, so it just becomes an error.
    if (res.status === 401 && token) {
      clearToken()
      onUnauthorized?.()
    }
    if (isErrorBody(data)) {
      const { message, code, details } = data.error
      throw new ApiError(message, code, res.status, details)
    }
    throw new ApiError(`Server responded with ${res.status} ${res.statusText}`, 'UNKNOWN', res.status)
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

// Auth endpoints live here because AuthProvider uses them together with the token storage.
// Resource endpoints (shifts, users) live in src/api/.

// What both login and register answer with.
export type AuthResponse = { token: string; user: User }

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

// Always creates an EMPLOYEE: the server has no role field to send (see docs/DECISIONS.md).
// auth: false for the same reason as login: no token yet, and a failure is not a logout.
export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
    auth: false,
  })
}

export function getMe(signal?: AbortSignal): Promise<User> {
  return apiFetch<User>('/api/auth/me', { signal })
}

export type HealthResponse = {
  status: string
  app: string
}

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health', { signal, auth: false })
}
