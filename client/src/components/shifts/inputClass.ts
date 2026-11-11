// Classes for inputs inside a FormField, red when the field has an error.
// In its own file: the react-refresh lint rule wants component files (FormField.tsx)
// to export only components, so hot reload keeps working.
export function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'
  }`
}
