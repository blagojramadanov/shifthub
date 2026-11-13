import type { ConnectionStatus } from '../../hooks/useShiftEvents'

// Dot color + text for each status. The text is always shown, so the meaning
// never depends on color alone. Pulsing dots stop for "reduce motion" users.
const DISPLAY: Record<ConnectionStatus, { label: string; dotClass: string; title: string }> = {
  connecting: {
    label: 'Connecting…',
    dotClass: 'bg-amber-400 animate-pulse motion-reduce:animate-none',
    title: 'Connecting to live updates',
  },
  live: {
    label: 'Live',
    dotClass: 'bg-emerald-500',
    title: 'Live: changes by others appear automatically',
  },
  reconnecting: {
    label: 'Reconnecting…',
    dotClass: 'bg-red-500 animate-pulse motion-reduce:animate-none',
    title: 'Connection lost. Trying again…',
  },
  stopped: {
    label: 'Offline',
    dotClass: 'bg-slate-400',
    title: 'Live updates are off',
  },
}

// Shows whether the realtime connection (useShiftEvents) is up.
// role="status" + aria-live="polite": screen readers announce a change without interrupting.
export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const { label, dotClass, title } = DISPLAY[status]
  return (
    <span
      role="status"
      aria-live="polite"
      title={title}
      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-600"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  )
}
