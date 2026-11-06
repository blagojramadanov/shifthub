function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          ShiftHub
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Shift scheduling made simple
        </p>

        <section
          aria-label="API status"
          className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            API status
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-700">Not checked yet</span>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
