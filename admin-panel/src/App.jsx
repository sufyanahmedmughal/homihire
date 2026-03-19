import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PendingWorkersPage from './pages/PendingWorkersPage';
import WorkersListPage from './pages/WorkersListPage';
import UsersListPage from './pages/UsersListPage';
import { Toaster } from 'react-hot-toast';

/**
 * App — Root component
 *
 * Route Structure (Slice 2):
 *   /login             → AdminLoginPage (public)
 *   /dashboard         → DashboardPage
 *   /pending-workers   → PendingWorkersPage
 *   /workers           → WorkersListPage
 *   /users             → UsersListPage
 *   /                  → redirect to /dashboard
 *   *                  → redirect to /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
            style: {
                background: '#151820',
                color: '#f1f5f9',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={ <ProtectedRoute><DashboardPage /></ProtectedRoute> }
          />
          <Route
            path="/pending-workers"
            element={ <ProtectedRoute><PendingWorkersPage /></ProtectedRoute> }
          />
          <Route
            path="/workers"
            element={ <ProtectedRoute><WorkersListPage /></ProtectedRoute> }
          />
          <Route
            path="/users"
            element={ <ProtectedRoute><UsersListPage /></ProtectedRoute> }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
