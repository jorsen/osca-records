'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">OSCA Records</h1>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">
          Senior Citizen & Pensioner Records
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Manage your profile and benefits information with ease. A comprehensive
          system for senior citizens and pensioners in the Philippines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
          >
            Login to Your Account
          </Link>
          <Link
            href="/signup"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
          >
            Create New Account
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-2">🔐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Login</h3>
            <p className="text-gray-600">
              Password-protected accounts with secure authentication
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-2">👤</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Management</h3>
            <p className="text-gray-600">
              Complete your profile with all relevant information
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Easy Registration</h3>
            <p className="text-gray-600">
              Simple and quick registration process
            </p>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg text-left">
            <h4 className="text-lg font-bold text-indigo-600 mb-4">
              What You Can Do
            </h4>
            <ul className="text-gray-700 space-y-2">
              <li>✓ Create a personal account</li>
              <li>✓ Manage your profile information</li>
              <li>✓ Update your personal details</li>
              <li>✓ Track your ID numbers</li>
              <li>✓ Manage pensioner status</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg text-left">
            <h4 className="text-lg font-bold text-indigo-600 mb-4">
              Information Stored
            </h4>
            <ul className="text-gray-700 space-y-2">
              <li>• Personal Details (Name, Birthday, Age)</li>
              <li>• Contact Information (Address, Location)</li>
              <li>• Government IDs (Senior ID, National ID)</li>
              <li>• Status (Relationship, Pensioner)</li>
              <li>• Gender and Demographics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 OSCA Records. All rights reserved.</p>
          <p className="text-gray-400 mt-2">
            Senior Citizen and Pensioner Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
