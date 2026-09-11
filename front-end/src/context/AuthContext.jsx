import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

// 1. Create the AuthContext to share authentication state across components
const AuthContext = createContext();

/**
 * AuthProvider component wraps the application and provides user state,
 * token management, login, and logout helper functions.
 */
export const AuthProvider = ({ children }) => {
  // State 1: Store logged-in user details (e.g. { id, username, full_name, role })
  const [user, setUser] = useState(null);

  // State 2: Store JWT token string
  const [token, setToken] = useState(null);

  // State 3: Store user role string (ADMIN_PRINCIPAL, TEACHER, PARENT, STUDENT)
  const [role, setRole] = useState(null);

  // State 4: Track loading state while checking existing localStorage session
  const [loading, setLoading] = useState(true);

  /**
   * useEffect Hook: Runs once when the React app loads.
   * Restores user session, token, and role from browser localStorage if present.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setRole(parsedUser.role);
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  /**
   * login Function:
   * Sends user credentials to backend /token endpoint.
   * On success:
   *  1. Receives JWT token, user_id, role, full_name from backend.
   *  2. Saves token and user metadata in localStorage for persistence across page refreshes.
   *  3. Updates React state so components re-render with logged-in user context.
   */
  const login = async (username, password) => {
    try {
      const response = await api.post('/token', { username, password });
      const data = response.data;

      const userObj = {
        id: data.user_id,
        role: data.role,
        full_name: data.full_name,
        username: username,
      };

      // Save to localStorage for session persistence
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userObj));

      // Update React state
      setToken(data.access_token);
      setUser(userObj);
      setRole(data.role);

      return { success: true, role: data.role };
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.detail || 'Invalid username or password';
      return { success: false, message };
    }
  };

  /**
   * logout Function:
   * Clears stored JWT token from localStorage and resets React state to null.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for consuming AuthContext in any React functional component.
 * Usage: const { user, role, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
