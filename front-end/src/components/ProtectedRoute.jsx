import { Navigate } from 'react-router-dom';


import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component:
 * Guards protected pages. Checks if user is authenticated and has allowed role.
 * If not authenticated -> redirects to /login.
 * If role is not permitted -> redirects to home or unauthorized page.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user to their own role home if trying to access unauthorized route
    if (role === 'PARENT') return <Navigate to="/parent" replace />;
    if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (role === 'ADMIN_PRINCIPAL') return <Navigate to="/admin" replace />;
    if (role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
