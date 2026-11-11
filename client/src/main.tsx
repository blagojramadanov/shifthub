import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'

// TEMPORARY dev-only console checks for the date helpers (see src/dev/dateChecks.ts).
// In a production build DEV is the constant false, so Vite drops this import entirely.
if (import.meta.env.DEV) {
  void import('./dev/dateChecks')
}

// BrowserRouter: reads the URL and makes routing work.
// AuthProvider: inside the router, so auth-aware components can also navigate.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
