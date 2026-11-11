import { useState } from 'react'
import { useWeekShifts } from '../../hooks/useWeekShifts'
import { addDays, isSameDay, startOfWeek } from '../../lib/dates'
import { CalendarError, CalendarSkeleton, weekGridClass } from './CalendarStatus'
import { DayColumn } from './DayColumn'
import { groupShiftsByDay } from './groupShiftsByDay'
import { Legend } from './Legend'
import { WeekNav } from './WeekNav'

// The weekly shift calendar: navigation, loading/error/empty states and 7 days.
// Read-only for now. Phase D adds the manager actions by passing onNewShift (WeekNav),
// onAdd and onShiftClick (DayColumn), plus the modal, which lives here because
// it needs reload() after saving.
export function WeekCalendar() {
  // The function form runs only on the first render.
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const week = useWeekShifts(weekStart)

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-4">
      <WeekNav
        weekStart={weekStart}
        onPrevious={() => setWeekStart((w) => addDays(w, -7))}
        onToday={() => setWeekStart(startOfWeek(new Date()))}
        onNext={() => setWeekStart((w) => addDays(w, 7))}
      />
      <Legend />

      {week.status === 'loading' && <CalendarSkeleton />}

      {week.status === 'error' && <CalendarError message={week.message} onRetry={week.reload} />}

      {week.status === 'ready' && (
        <>
          {week.shifts.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              No shifts this week.
            </p>
          )}
          <div className={weekGridClass}>
            {groupShiftsByDay(week.shifts, weekStart).map((entries, i) => (
              <DayColumn
                // The date is unique within the week and stays the same between renders.
                key={days[i].getTime()}
                day={days[i]}
                entries={entries}
                isToday={isSameDay(days[i], today)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
