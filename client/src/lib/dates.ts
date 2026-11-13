// Date helpers for the calendar. Pure functions, no libraries.
//
// Everything here works in the user's LOCAL time (the browser's timezone):
// "Monday", "today" and "09:00" mean what the user sees on their wall clock.
// Conversion to UTC happens only at the API boundary, with toISOString().
//
// Every function returns a NEW Date and never changes the one passed in.

const DAY_MS = 24 * 60 * 60 * 1000

// Midnight (00:00 local) at the start of the given day.
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Monday 00:00 local of the week that contains `date`.
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  // getDay(): 0 = Sunday, 1 = Monday ... 6 = Saturday.
  // (+ 6) % 7 turns that into "days since Monday": Mon 0, Tue 1 ... Sun 6.
  const daysSinceMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - daysSinceMonday)
  return d
}

// The same wall-clock time n days later (n may be negative).
// setDate() moves by calendar days. Adding n * 24h in milliseconds would be wrong
// across a DST change, where a day is 23 or 25 hours long: Monday 00:00 + 7 * 24h
// would land on Sunday 23:00 in the spring-forward week.
// setDate() also handles overflow: 31 Jan + 1 day = 1 Feb.
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// The same day at the given LOCAL time, e.g. withTime(day, 9, 0) = that day 09:00.
export function withTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

// True when both dates fall on the same LOCAL calendar day (time ignored).
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// How many calendar days lie between the day of `a` and the day of `b`.
// 0 = same day, 1 = b is the next day (used for the "+1" after a night shift's end time).
// Math.round absorbs the 23h/25h days around DST changes.
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)
}

// ---------------------------------------------------------------------------
// Display formatting (British English to match the UI, 24h clock)
// ---------------------------------------------------------------------------
// Creating an Intl.DateTimeFormat is relatively slow, so each one is created
// once here and reused for every call.

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // 00-23, never "24:00"
})

const dayHeaderFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short', // a month name, so "9 Nov" can't be misread as 11 September
})

const weekdayShortFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

const weekRangeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const weekdayTimeFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// "Sun 22:00": for a shift that started in the previous week.
export function formatWeekdayTime(date: Date): string {
  return weekdayTimeFormat.format(date)
}

// "08:00"
export function formatTime(date: Date): string {
  return timeFormat.format(date)
}

// "Mon 9 Nov"
export function formatDayHeader(date: Date): string {
  return dayHeaderFormat.format(date)
}

// "Mon": the first line of a calendar day header.
export function formatWeekdayShort(date: Date): string {
  return weekdayShortFormat.format(date)
}

// "9 – 15 November 2026", or "30 November – 6 December 2026" across months.
// formatRange() leaves out the parts both ends share (month, year).
export function formatWeekRange(weekStart: Date): string {
  return weekRangeFormat.formatRange(weekStart, addDays(weekStart, 6))
}

// ---------------------------------------------------------------------------
// <input type="datetime-local"> conversion
// ---------------------------------------------------------------------------
// The input's value is a LOCAL wall-clock time without timezone: "2026-11-17T08:00".
// The API wants a UTC ISO string: "2026-11-17T07:00:00.000Z" (in winter in Central Europe, UTC+1).

function pad(n: number, length = 2): string {
  return String(n).padStart(length, '0')
}

// Date -> "YYYY-MM-DDTHH:mm" in LOCAL time, for the input's value.
// Not toISOString().slice(0, 16): that would give the UTC time, one or two hours off here.
export function toDateTimeLocalValue(date: Date): string {
  const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return `${day}T${time}`
}

// The input sends "HH:mm", or "HH:mm:ss" when the input has a step below one minute.
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/

// "YYYY-MM-DDTHH:mm" (local) -> UTC ISO string, for the API.
// Throws a clear Error for an empty or malformed value. Check the form fields
// before calling this; the throw only catches programming mistakes.
export function fromDateTimeLocalValue(value: string): string {
  if (value === '') {
    throw new Error('fromDateTimeLocalValue: the value is empty')
  }
  if (!DATETIME_LOCAL_PATTERN.test(value)) {
    throw new Error(`fromDateTimeLocalValue: "${value}" is not in the format YYYY-MM-DDTHH:mm`)
  }
  // By the JavaScript spec, a date-time string WITHOUT "Z" or an offset is read as
  // local time. (Careful: a date-only string like "2026-11-17" is read as UTC.)
  const date = new Date(value)
  // e.g. "2026-13-45T08:00" matches the pattern, but is no real date.
  if (Number.isNaN(date.getTime())) {
    throw new Error(`fromDateTimeLocalValue: "${value}" is not a valid date`)
  }
  return date.toISOString()
}
