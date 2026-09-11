import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Root Redirect Handler:
 * Redirects logged-in users to their role dashboard, or unauthenticated users to /login.
 */
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'PARENT') return <Navigate to="/parent" replace />;
  if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
  if (role === 'ADMIN_PRINCIPAL') return <Navigate to="/admin" replace />;
  if (role === 'STUDENT') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
};

/**
 * App Component:
 * Wraps router in AuthProvider context for global authentication state management.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Parent Route */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Teacher Route */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin/Principal Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_PRINCIPAL']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Route */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root and Fallback Catch-all Route */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
