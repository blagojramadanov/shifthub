import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routeGuards'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

// Which page shows for which URL.
function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      {/* Unknown URLs go home (which sends logged-out users on to /login). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
