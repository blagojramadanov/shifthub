// TEMPORARY, dev only: lets you check the date helpers from the browser console.
// main.tsx loads this file only when import.meta.env.DEV is true, so it is never
// part of the production build. Delete this file and its import in main.tsx when done.
//
// In the console:   __shifthub.runDateChecks()
// Or by hand:       __shifthub.dates.startOfWeek(new Date(2026, 10, 15))

import * as dates from '../lib/dates'

type CheckResult = { check: string; expected: string; actual: string; pass: boolean }

function check(name: string, expected: string, getActual: () => string): CheckResult {
  let actual: string
  try {
    actual = getActual()
  } catch (err) {
    actual = `threw: ${err instanceof Error ? err.message : String(err)}`
  }
  return { check: name, expected, actual, pass: actual === expected }
}

// A Date as local wall-clock time, so the expected values are easy to read.
const local = (date: Date) => dates.toDateTimeLocalValue(date)

function runDateChecks(): boolean {
  const results = [
    check('1. round trip 2026-11-17T08:00', '2026-11-17T08:00', () =>
      local(new Date(dates.fromDateTimeLocalValue('2026-11-17T08:00'))),
    ),
    check('2. winter 08:00 local -> UTC (UTC+1)', '2026-11-17T07:00:00.000Z', () =>
      dates.fromDateTimeLocalValue('2026-11-17T08:00'),
    ),
    check('3. summer 08:00 local -> UTC (UTC+2)', '2026-07-17T06:00:00.000Z', () =>
      dates.fromDateTimeLocalValue('2026-07-17T08:00'),
    ),
    // Months are 0-based in new Date(y, m, d): 10 = November, 2 = March.
    check('4. startOfWeek(Sun 2026-11-15)', '2026-11-09T00:00', () =>
      local(dates.startOfWeek(new Date(2026, 10, 15))),
    ),
    check('5. addDays(startOfWeek(2027-03-22), 7), DST week', '2027-03-29T00:00', () =>
      local(dates.addDays(dates.startOfWeek(new Date(2027, 2, 22)), 7)),
    ),
    check('extra: empty input throws a clear Error', 'threw: fromDateTimeLocalValue: the value is empty', () =>
      dates.fromDateTimeLocalValue(''),
    ),
  ]

  console.log(`Browser timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  console.table(results)
  return results.every((r) => r.pass)
}

declare global {
  interface Window {
    __shifthub?: { dates: typeof dates; runDateChecks: typeof runDateChecks }
  }
}

window.__shifthub = { dates, runDateChecks }
console.info('[dev] Date helpers ready: run __shifthub.runDateChecks() in the console')
