'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = ['Account', 'Personal Info', 'ID & Status'];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    address: '',
    birthday: '',
    age: '',
    gender: '',
    relationshipStatus: '',
    seniorIdNumber: '',
    nationalIdNumber: '',
    pensioner: 'no',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 0) {
      if (!formData.username.trim()) { setError('Please enter a username.'); return false; }
      if (!formData.password) { setError('Please enter a password.'); return false; }
      if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return false; }
    }
    if (step === 2) {
      if (formData.seniorIdNumber && !/^\d{16}$/.test(formData.seniorIdNumber)) {
        setError('Senior ID must be exactly 16 digits.'); return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setError('');
    setStep((s) => s + 1);
  };

  const prevStep = () => { setError(''); setStep((s) => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || 'Registration failed. Please try again.'); return; }

      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
  const labelClass = 'block text-xl font-semibold text-gray-700 mb-2';
  const selectClass = `${inputClass} bg-white`;

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

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-10">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">📝</div>
            <h2 className="text-4xl font-bold text-gray-800">Register</h2>
            <p className="text-lg text-gray-500 mt-1">Create your OSCA account</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  i < step ? 'bg-green-500 border-green-500 text-white' :
                  i === step ? 'bg-blue-600 border-blue-600 text-white' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-1 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {success && (
            <div className="bg-green-50 border-2 border-green-400 text-green-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium text-center">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 text-red-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            {/* Step 1 — Account */}
            {step === 0 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500 mb-4">Choose a username and password for your account.</p>
                <div>
                  <label className={labelClass}>Username <span className="text-red-500">*</span></label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className={inputClass} placeholder="e.g. juandelacruz" required autoComplete="username" />
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="At least 6 characters" required autoComplete="new-password" />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Re-enter your password" required autoComplete="new-password" />
                </div>
              </div>
            )}

            {/* Step 2 — Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500 mb-4">Tell us about yourself. All fields here are optional.</p>
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} placeholder="e.g. Juan dela Cruz" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Birthday</label>
                    <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass} placeholder="e.g. 65" min="60" max="120" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Home Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Street, Barangay, City" />
                </div>
                <div>
                  <label className={labelClass}>Relationship Status</label>
                  <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleChange} className={selectClass}>
                    <option value="">— Select —</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3 — IDs & Status */}
            {step === 2 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500 mb-4">Enter your ID numbers and pensioner status. All fields are optional.</p>
                <div>
                  <label className={labelClass}>Senior ID Number</label>
                  <input
                    type="text"
                    name="seniorIdNumber"
                    value={formData.seniorIdNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="16-digit OSCA Senior ID"
                    maxLength={16}
                    minLength={16}
                    pattern="\d{16}"
                    title="Must be exactly 16 digits"
                  />
                  <p className="text-gray-400 text-base mt-1">Must be exactly 16 digits</p>
                </div>
                <div>
                  <label className={labelClass}>National ID Number</label>
                  <input type="text" name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className={inputClass} placeholder="SSS / GSIS / PhilSys" />
                </div>
                <div>
                  <label className={labelClass}>Are you a Pensioner?</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    {['no', 'yes'].map((val) => (
                      <label key={val} className={`flex items-center justify-center gap-3 py-4 px-5 rounded-xl border-2 cursor-pointer text-xl font-semibold transition ${
                        formData.pensioner === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                        <input type="radio" name="pensioner" value={val} checked={formData.pensioner === val} onChange={handleChange} className="sr-only" />
                        {val === 'yes' ? '✅ Yes' : '❌ No'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className={`flex gap-4 mt-8 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
              {step > 0 && (
                <button type="button" onClick={prevStep} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold py-4 rounded-2xl transition">
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl transition shadow-md">
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xl font-bold py-4 rounded-2xl transition shadow-md">
                  {loading ? '⏳ Creating Account...' : '✅ Create Account'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
            <p className="text-xl text-gray-600">Already have an account?</p>
            <Link href="/login" className="inline-block mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-10 rounded-2xl transition">
              🔑 Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
