'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your username and password.');
        return;
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_role', data.user.role);

      setSuccess('Login successful! Please wait...');
      setTimeout(() => {
        router.push(data.user.role === 'SUPERADMIN' ? '/admin' : '/profile');
      }, 1500);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-blue-600 px-6 py-5 flex items-center gap-3 shadow-sm">
        <span className="text-4xl">🏛️</span>
        <div>
          <h1 className="text-2xl font-bold text-blue-700">OSCA Records</h1>
          <p className="text-sm text-gray-500">Office for Senior Citizens Affairs</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-10">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔑</div>
            <h2 className="text-4xl font-bold text-gray-800">Sign In</h2>
            <p className="text-lg text-gray-500 mt-2">Welcome back! Please enter your details.</p>
          </div>

          {success && (
            <div className="bg-green-50 border-2 border-green-400 text-green-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium text-center">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 text-red-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-2xl font-bold py-5 rounded-2xl transition shadow-md mt-2"
            >
              {loading ? '⏳ Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
            <p className="text-xl text-gray-600">
              No account yet?
            </p>
            <Link
              href="/signup"
              className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-10 rounded-2xl transition"
            >
              📝 Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
