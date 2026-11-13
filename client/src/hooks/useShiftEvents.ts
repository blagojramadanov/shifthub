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
// A lost connection is only reported as "reconnecting" if it isn't back within this time.
// The first retry alone waits 1-1.5 s, so a quick drop (or a dev server restart) never
// flashes "Reconnecting…" in the header.
const RECONNECTING_GRACE_MS = 3_000

// What the header shows about the live connection.
//   connecting:   not connected yet (first attempt, or first attempts failing, e.g. a cold start)
//   live:         the event stream is open
//   reconnecting: was live, lost the connection, and is retrying (after the grace period)
//   stopped:      gave up after a 401 (the user is being logged out at the same moment)
export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'stopped'

// Keeps a live connection to the server's event stream (Server-Sent Events) and calls
// onChange whenever shifts were created, updated or deleted by anyone.
// The events carry no data: onChange should simply load the shifts again.
// onStatusChange (optional) hears about connection changes. It starts at "connecting":
// the hook only reports changes after that, when something actually happens.
export function useShiftEvents(
  onChange: () => void,
  onStatusChange?: (status: ConnectionStatus) => void,
): void {
  // An "effect event": always calls the LATEST onChange, but isn't a dependency of the
  // effect. Without it, a new onChange function on every render would reconnect every time.
  const handleChange = useEffectEvent(onChange)
  const reportStatus = useEffectEvent((status: ConnectionStatus) => onStatusChange?.(status))

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
    // Status bookkeeping (doesn't affect the reconnect logic itself).
    let wasLive = false // connected at least once: a failure now is "reconnecting", not "connecting"
    let connectionLost = false // the grace timer for this outage was already started
    let graceTimer: ReturnType<typeof setTimeout> | undefined

    function report(status: ConnectionStatus) {
      if (!cancelled) reportStatus(status) // nothing after unmount/logout
    }

    function scheduleReconnect() {
      if (cancelled) return
      needsCatchUp = true
      if (wasLive && !connectionLost) {
        connectionLost = true
        graceTimer = setTimeout(() => report('reconnecting'), RECONNECTING_GRACE_MS)
      }
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
        if (err instanceof ApiError && err.status === 401) {
          clearTimeout(graceTimer)
          report('stopped')
          return
        }
        scheduleReconnect() // server asleep, network down, ...
        return
      }
      if (cancelled) return

      const es = new EventSource(eventsUrl(ticket))
      source = es

      es.addEventListener('open', () => {
        delay = MIN_DELAY_MS // connected: the next failure starts the backoff from 1 s again
        wasLive = true
        connectionLost = false
        clearTimeout(graceTimer) // back within the grace period: "reconnecting" is never shown
        report('live')
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
      clearTimeout(graceTimer)
      source?.close()
    }
  }, [])
}
