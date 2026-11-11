import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

type ShiftModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

// A modal built on the browser's native <dialog>. showModal() gives us for free:
// the dimmed backdrop, focus kept inside the dialog, the rest of the page made
// inert, and Esc to close.
//
// React state is the source of truth: the parent renders <ShiftModal> while the
// modal should be open and removes it to close it. When the BROWSER closes the
// dialog (Esc), the dialog's "close" event calls onClose, so the parent's state
// follows and the modal can be opened again.
export function ShiftModal({ title, onClose, children }: ShiftModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // True when the current click started on the backdrop (see handleClick).
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    // The check matters in StrictMode, which runs effects twice in development.
    if (dialog && !dialog.open) dialog.showModal()
    // No dialog.close() in a cleanup: it would queue a "close" event, which in
    // StrictMode's second run would close the freshly reopened modal. Removing the
    // element from the page is enough to make it disappear.
  }, [])

  // A click on the backdrop has the <dialog> element itself as its target, because
  // the backdrop belongs to the dialog. Clicks on the content hit the inner <div>.
  // Both the press and the release must be on the backdrop, so selecting text in an
  // input and releasing the mouse outside doesn't close the form.
  function handleClick(e: MouseEvent<HTMLDialogElement>) {
    if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose()
    pressedOnBackdrop.current = false
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="shift-modal-title"
      onClose={onClose}
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={handleClick}
      className="m-auto w-full max-w-lg rounded-xl bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      {/* The content fills the whole dialog box, so only true backdrop clicks hit <dialog>. */}
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <h2 id="shift-modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-md px-2 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
