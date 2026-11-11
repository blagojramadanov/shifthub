import { useState } from 'react'
import { useWeekShifts } from '../../hooks/useWeekShifts'
import { addDays, isSameDay, startOfWeek } from '../../lib/dates'
import type { Shift } from '../../types'
import { ShiftDetails } from '../shifts/ShiftDetails'
import { ShiftForm } from '../shifts/ShiftForm'
import { ShiftModal } from '../shifts/ShiftModal'
import { CalendarError, CalendarSkeleton, weekGridClass } from './CalendarStatus'
import { DayColumn } from './DayColumn'
import { groupShiftsByDay } from './groupShiftsByDay'
import { Legend } from './Legend'
import { WeekNav } from './WeekNav'

// What the modal shows. null = closed.
type ModalState =
  | { kind: 'create'; day: Date }
  | { kind: 'edit'; shift: Shift }
  | { kind: 'view'; shift: Shift }
  | null

type WeekCalendarProps = {
  // true for managers: "New shift", "+" per day, and cards open the edit form.
  // false: cards open read-only details. (The server enforces the same rules.)
  canEdit: boolean
}

// The weekly shift calendar: navigation, loading/error/empty states, 7 days and the modal.
export function WeekCalendar({ canEdit }: WeekCalendarProps) {
  // The function form runs only on the first render.
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [modal, setModal] = useState<ModalState>(null)
  const week = useWeekShifts(weekStart)

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  // "New shift" prefills today if it's in the shown week, otherwise that week's Monday.
  const newShiftDay = days.find((d) => isSameDay(d, today)) ?? weekStart

  function closeModal() {
    setModal(null)
  }

  function handleSaved() {
    setModal(null)
    week.reload()
  }

  function openShift(shift: Shift) {
    setModal(canEdit ? { kind: 'edit', shift } : { kind: 'view', shift })
  }

  const modalTitle =
    modal?.kind === 'create' ? 'New shift' : modal?.kind === 'edit' ? 'Edit shift' : 'Shift details'

  return (
    <div className="space-y-4">
      <WeekNav
        weekStart={weekStart}
        onPrevious={() => setWeekStart((w) => addDays(w, -7))}
        onToday={() => setWeekStart(startOfWeek(new Date()))}
        onNext={() => setWeekStart((w) => addDays(w, 7))}
        onNewShift={canEdit ? () => setModal({ kind: 'create', day: newShiftDay }) : undefined}
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
          {/* aria-busy tells screen readers the shown cards are being refreshed. */}
          <div className={weekGridClass} aria-busy={week.refreshing || undefined}>
            {groupShiftsByDay(week.shifts, weekStart).map((entries, i) => (
              <DayColumn
                // The date is unique within the week and stays the same between renders.
                key={days[i].getTime()}
                day={days[i]}
                entries={entries}
                isToday={isSameDay(days[i], today)}
                onAdd={canEdit ? () => setModal({ kind: 'create', day: days[i] }) : undefined}
                // Continuation cards pass the same shift, so they open it too.
                onShiftClick={openShift}
              />
            ))}
          </div>
        </>
      )}

      {/* Rendered only while open: closing removes it, opening mounts a fresh form. */}
      {modal && (
        <ShiftModal title={modalTitle} onClose={closeModal}>
          {modal.kind === 'view' ? (
            <ShiftDetails shift={modal.shift} onClose={closeModal} />
          ) : (
            <ShiftForm
              shift={modal.kind === 'edit' ? modal.shift : undefined}
              day={modal.kind === 'create' ? modal.day : weekStart}
              onDone={handleSaved}
              onCancel={closeModal}
            />
          )}
        </ShiftModal>
      )}
    </div>
  )
}
