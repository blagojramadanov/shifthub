// Explains the two card styles. The swatches use the same classes as ShiftCard.
export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-4 rounded border border-slate-200 bg-white shadow-sm" aria-hidden="true" />
        Assigned
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-4 rounded border border-dashed border-amber-400 bg-amber-50" aria-hidden="true" />
        Open shift (no one assigned)
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-4 rounded border border-slate-200 bg-white opacity-60" aria-hidden="true" />
        ↳ Continues from the previous week
      </li>
    </ul>
  )
}
