import { useEffect, useEffectEvent } from 'react'
import { eventsUrl, getEventsTicket } from '../api/events'
import { ApiError } from '../lib/api'

// Reconnect delays: 1 s, 2 s, 4 s ... up to 30 s, plus 0-500 ms of random "jitter"
// so many browsers that lost the connection at once don't all retry at the same moment.
const MIN_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000
const MAX_JITTER_MS = 500
// Render's free tier can take ~50 seconds to wake up, so allow plenty of time.
const TICKET_TIMEOUT_MS = 90_000

// Keeps a live connection to the server's event stream (Server-Sent Events) and calls
// onChange whenever shifts were created, updated or deleted by anyone.
// The events carry no data: onChange should simply load the shifts again.
export function useShiftEvents(onChange: () => void): void {
  // An "effect event": always calls the LATEST onChange, but isn't a dependency of the
  // effect. Without it, a new onChange function on every render would reconnect every time.
  const handleChange = useEffectEvent(onChange)

  // Connects once per mount. The cleanup closes everything, which also handles
  // StrictMode's mount -> cleanup -> mount test run in development: no duplicate connection.
  useEffect(() => {
    let cancelled = false // set by the cleanup: stop everything
    let source: EventSource | null = null
    let ticketRequest: AbortController | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let delay = MIN_DELAY_MS
    // True after a failed attempt: events may have been missed, so reload once connected.
    let needsCatchUp = false

    function scheduleReconnect() {
      if (cancelled) return
      needsCatchUp = true
      const wait = delay + Math.random() * MAX_JITTER_MS
      delay = Math.min(delay * 2, MAX_DELAY_MS)
      retryTimer = setTimeout(connect, wait)
    }

    async function connect() {
      ticketRequest = new AbortController()
      const signal = AbortSignal.any([ticketRequest.signal, AbortSignal.timeout(TICKET_TIMEOUT_MS)])

      let ticket: string
      try {
        ticket = await getEventsTicket(signal)
      } catch (err) {
        if (cancelled) return
        // 401: the login token is no longer valid. lib/api.ts has already logged the
        // user out, which unmounts the calendar. Don't retry.
        if (err instanceof ApiError && err.status === 401) return
        scheduleReconnect() // server asleep, network down, ...
        return
      }
      if (cancelled) return

      const es = new EventSource(eventsUrl(ticket))
      source = es

      es.addEventListener('open', () => {
        delay = MIN_DELAY_MS // connected: the next failure starts the backoff from 1 s again
        if (needsCatchUp) {
          needsCatchUp = false
          handleChange()
        }
      })

      // A NAMED event ("event: shifts-changed"), so onmessage would never see it.
      es.addEventListener('shifts-changed', () => handleChange())

      es.addEventListener('error', () => {
        // EventSource would retry on its own with the SAME url, but the ticket in it is
        // already used. So close it and reconnect ourselves with a fresh ticket.
        // (A 401 from the stream also lands here: the browser can't tell us the status.)
        es.close()
        if (source === es) source = null
        scheduleReconnect()
      })
    }

    void connect()

    return () => {
      cancelled = true
      ticketRequest?.abort()
      clearTimeout(retryTimer)
      source?.close()
    }
  }, [])
}
