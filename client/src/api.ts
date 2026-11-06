// Base URL of the ShiftHub API, injected by Vite at build time.
// A trailing slash is removed so paths like `/api/health` join cleanly.
export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

export type HealthResponse = {
  status: string
  app: string
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not set')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/health`, { signal })
  } catch (err) {
    // Network errors (server down, CORS blocked, DNS) surface as a vague TypeError.
    if (err instanceof TypeError) {
      throw new Error(`Could not reach the API at ${API_URL}`, { cause: err })
    }
    throw err
  }
  if (!res.ok) {
    throw new Error(`Server responded with ${res.status} ${res.statusText}`)
  }
  return res.json()
}
