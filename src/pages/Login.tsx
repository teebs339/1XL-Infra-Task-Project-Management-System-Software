import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  const demoAccounts = [
    { role: 'Admin', email: 'sarah.chen@company.com', password: 'admin123' },
    { role: 'Project Manager', email: 'marcus.r@company.com', password: 'pm123' },
    { role: 'Team Member', email: 'james.p@company.com', password: 'team123' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <FolderKanban className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TaskFlow Pro</h1>
          <p className="text-gray-500 mt-1">Task & Project Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-lg font-medium text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Accounts</h3>
          <div className="space-y-2">
            {demoAccounts.map(account => (
              <button
                key={account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError('');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{account.role}</p>
                  <p className="text-xs text-gray-500">{account.email}</p>
                </div>
                <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Use →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
