import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import schoolLogo from '../assets/Alene.jpg';

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ADMIN_PRINCIPAL', label: 'Principal' },
];

/**
 * Login Page Component:
 * Renders the Alene High School (MUSSC) Portal sign-in form.
 * The user picks which role they're signing in as; after a successful login,
 * the returned account role is checked against that selection so nobody can
 * accidentally land on the wrong dashboard.
 */
const Login = () => {
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Role Redirect Handler:
   * Maps backend user role to target frontend route.
   */
  const redirectByRole = (userRole) => {
    switch (userRole) {
      case 'ADMIN_PRINCIPAL':
        navigate('/admin');
        break;
      case 'TEACHER':
        navigate('/teacher');
        break;
      case 'PARENT':
        navigate('/parent');
        break;
      case 'STUDENT':
        navigate('/student');
        break;
      default:
        navigate('/');
        break;
    }
  };

  /**
   * Form Submit Handler:
   * Calls login() from AuthContext. Upon success, verifies the account's actual
   * role matches the "Who is logging in?" selection before redirecting.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(identifier, password);

    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    if (result.role !== selectedRole) {
      // Credentials were valid, but for a different role than selected - undo the login.
      logout();
      setError(
        `This account is not registered as a ${ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}. Please check your selection.`
      );
      setIsSubmitting(false);
      return;
    }

    redirectByRole(result.role);
    setIsSubmitting(false);
  };

  /**
   * Quick Fill Demo Helper:
   * Allows 1-click selection of pre-configured demo users for quick testing.
   */
  const setDemoCredentials = (demoUsername, role) => {
    setIdentifier(demoUsername);
    setPassword('password123');
    setSelectedRole(role);
    setError('');
  };

  const identifierLabel = selectedRole === 'STUDENT' ? 'Student ID Number' : 'Username';
  const identifierPlaceholder =
    selectedRole === 'STUDENT' ? 'Enter your student ID' : 'Enter your username';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl p-8 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={schoolLogo}
            alt="Alene High School seal"
            className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-2 border-slate-700 ring-4 ring-indigo-500/20"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
            Alene High School (MUSSC) Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              {identifierLabel}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={identifierPlaceholder}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
            />
            {selectedRole === 'STUDENT' && (
              <p className="text-xs text-slate-500 mt-1">(e.g. student1)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-11 bg-slate-950/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Who is logging in? Role Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Who is logging in?
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-slate-950/40 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Click to fill Demo User Credentials:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('student1', 'STUDENT')}
              className="px-2 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer"
            >
              Student 1
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('parent1', 'PARENT')}
              className="px-2 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer"
            >
              Parent 1
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('teacher1', 'TEACHER')}
              className="px-2 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer"
            >
              Teacher 1
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('principal1', 'ADMIN_PRINCIPAL')}
              className="px-2 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors text-center cursor-pointer"
            >
              Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
