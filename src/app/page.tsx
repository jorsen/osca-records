'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-blue-600 px-6 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏛️</span>
          <div>
            <h1 className="text-2xl font-bold text-blue-700 leading-tight">OSCA Records</h1>
            <p className="text-sm text-gray-500">Office for Senior Citizens Affairs</p>
          </div>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl transition"
        >
          Login
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-7xl mb-6">👴👵</div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-5 leading-tight">
            Welcome, Senior Citizens!
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            Manage your personal information and senior citizen records easily and securely.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/login"
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-5 px-10 rounded-2xl transition shadow-lg"
            >
              <span className="text-2xl">🔑</span> I Already Have an Account
            </Link>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-5 px-10 rounded-2xl transition shadow-lg"
            >
              <span className="text-2xl">📝</span> Register Now
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-4xl mx-auto w-full">
          <h3 className="text-2xl font-bold text-gray-700 mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📝', step: '1', title: 'Register', desc: 'Create your account with your personal information.' },
              { icon: '🔑', step: '2', title: 'Log In', desc: 'Sign in anytime to view or update your records.' },
              { icon: '📋', step: '3', title: 'Manage', desc: 'Keep your information updated and print your profile.' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center">
                <div className="text-5xl mb-3">{icon}</div>
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {step}
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{title}</h4>
                <p className="text-gray-600 text-lg">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 text-center text-lg">
        <p>&copy; 2026 OSCA Records — Senior Citizen and Pensioner Management System</p>
      </footer>
    </div>
  );
}
