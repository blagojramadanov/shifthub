import { useState } from 'react'

type DeleteShiftButtonProps = {
  onConfirm: () => void
  deleting: boolean
  disabled: boolean
}

// "Delete" first asks inline: "Really delete? Yes / Cancel". No window.confirm(),
// which blocks the whole page and can't be styled.
export function DeleteShiftButton({ onConfirm, deleting, disabled }: DeleteShiftButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={disabled}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Delete
      </button>
    )
  }

  return (
    <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-red-800">Really delete?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
      >
        {deleting ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={disabled}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        Cancel
      </button>
    </div>
  )
}
