import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/Toast';
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import PendingWorkersPage from './pages/PendingWorkersPage';
import WorkersListPage    from './pages/WorkersListPage';
import UsersListPage      from './pages/UsersListPage';

/**
 * App — Root component
 *
 * Route Structure (Slice 2):
 *   /login            → AdminLoginPage (public)
 *   /dashboard        → DashboardPage        (protected)
 *   /pending-workers  → PendingWorkersPage   (protected)
 *   /workers          → WorkersListPage      (protected)
 *   /users            → UsersListPage        (protected)
 *   /                 → redirect to /dashboard
 *   *                 → redirect to /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notifications */}
        <ToastProvider />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — Slice 1 */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* Protected — Slice 2 */}
          <Route path="/pending-workers" element={
            <ProtectedRoute><PendingWorkersPage /></ProtectedRoute>
          } />
          <Route path="/workers" element={
            <ProtectedRoute><WorkersListPage /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute><UsersListPage /></ProtectedRoute>
          } />

          {/* Defaults */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
