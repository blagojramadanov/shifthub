import type { ReactNode } from 'react'

type AuthLayoutProps = {
  subtitle: string
  children: ReactNode // the form, shown inside the white card
  footer: ReactNode // e.g. the link to the other auth page
}

// The shared frame of the login and register pages, so both always look the same.
export function AuthLayout({ subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">ShiftHub</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>

        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  )
}
