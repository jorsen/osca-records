'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CameraCapture from '@/components/CameraCapture';

const STEPS = ['Account', 'Personal Info', 'IDs & Status', 'ID Photos'];

interface UploadedDoc { label: string; url: string; }

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    fullName: '', address: '', birthplace: '', birthday: '', age: '',
    gender: '', relationshipStatus: '',
    seniorIdNumber: '', nationalIdNumber: '', philsysId: '',
    pensioner: 'no', hasNoId: false,
  });
  const [idDocuments, setIdDocuments] = useState<UploadedDoc[]>([]);
  const [uploadingLabel, setUploadingLabel] = useState('Senior Citizen ID');
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData(prev => ({ ...prev, [target.name]: value }));
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

  const nextStep = () => { if (!validateStep()) return; setError(''); setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const clearPending = () => {
    setPendingFile(null);
    setUploadPreview(null);
  };

  const handleUploadDoc = async () => {
    if (!pendingFile) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      setIdDocuments(prev => [...prev, { label: uploadingLabel, url: data.url }]);
      clearPending();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (index: number) => setIdDocuments(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, idDocuments }),
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

  const ic = 'w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200';
  const lc = 'block text-xl font-semibold text-gray-700 mb-2';
  const sc = `${ic} bg-white`;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-white border-b-4 border-green-700 px-6 py-5 flex items-center gap-3 shadow-sm">
        <span className="text-4xl">🏛️</span>
        <div>
          <h1 className="text-2xl font-bold text-green-800">OSCA Records</h1>
          <p className="text-sm text-gray-500">Office for Senior Citizens Affairs</p>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">📝</div>
            <h2 className="text-4xl font-bold text-gray-800">Register</h2>
            <p className="text-lg text-gray-500 mt-1">Create your OSCA account</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all ${
                  i < step ? 'bg-green-500 border-green-500 text-white' :
                  i === step ? 'bg-green-700 border-green-700 text-white' :
                  'bg-white border-gray-300 text-gray-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`w-6 h-1 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {success && <div className="bg-green-50 border-2 border-green-400 text-green-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium text-center">✅ {success}</div>}
          {error && <div className="bg-red-50 border-2 border-red-400 text-red-800 px-5 py-4 rounded-xl mb-6 text-lg font-medium">⚠️ {error}</div>}

          <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>

            {/* Step 1 — Account */}
            {step === 0 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500 mb-4">Choose a username and password.</p>
                <div>
                  <label className={lc}>Username <span className="text-red-500">*</span></label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className={ic} placeholder="e.g. juandelacruz" required autoComplete="username" />
                </div>
                <div>
                  <label className={lc}>Password <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className={ic} placeholder="At least 6 characters" required autoComplete="new-password" />
                </div>
                <div>
                  <label className={lc}>Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={ic} placeholder="Re-enter your password" required autoComplete="new-password" />
                </div>
              </div>
            )}

            {/* Step 2 — Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500 mb-4">Tell us about yourself. All fields are optional.</p>
                <div>
                  <label className={lc}>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={ic} placeholder="e.g. Juan dela Cruz" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>Birthday</label>
                    <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className={ic} placeholder="65" min="60" max="120" />
                  </div>
                </div>
                <div>
                  <label className={lc}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={sc}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={lc}>Home Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={ic} placeholder="Street, Barangay, City" />
                </div>
                <div>
                  <label className={lc}>Birthplace</label>
                  <input type="text" name="birthplace" value={formData.birthplace} onChange={handleChange} className={ic} placeholder="City/Municipality where you were born" />
                </div>
                <div>
                  <label className={lc}>Relationship Status</label>
                  <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleChange} className={sc}>
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
                <p className="text-lg text-gray-500 mb-4">Enter your ID numbers. Senior ID is required if available.</p>

                {/* Senior ID — always shown */}
                <div>
                  <label className={lc}>Senior ID Number <span className="text-green-700 text-base font-normal">(Always required)</span></label>
                  <input type="text" name="seniorIdNumber" value={formData.seniorIdNumber} onChange={handleChange} className={ic} placeholder="16-digit OSCA Senior ID" maxLength={16} minLength={16} pattern="\d{16}" title="Must be exactly 16 digits" />
                  <p className="text-gray-400 text-base mt-1">Must be exactly 16 digits</p>
                </div>

                {/* No ID checkbox */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition ${formData.hasNoId ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" name="hasNoId" checked={formData.hasNoId} onChange={handleChange} className="w-6 h-6 accent-orange-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">I have no other IDs</p>
                    <p className="text-sm text-gray-500">Check this if you do not have a National ID, PhilSys ID, or other ID cards</p>
                  </div>
                </label>

                {!formData.hasNoId && (
                  <>
                    <div>
                      <label className={lc}>PhilSys ID Number</label>
                      <input type="text" name="philsysId" value={formData.philsysId} onChange={handleChange} className={ic} placeholder="Philippine Identification System No." />
                    </div>
                  </>
                )}

                <div>
                  <label className={lc}>Are you a Pensioner?</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    {['no', 'yes'].map((val) => (
                      <label key={val} className={`flex items-center justify-center gap-3 py-4 px-5 rounded-xl border-2 cursor-pointer text-xl font-semibold transition ${formData.pensioner === val ? 'border-green-700 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        <input type="radio" name="pensioner" value={val} checked={formData.pensioner === val} onChange={handleChange} className="sr-only" />
                        {val === 'yes' ? '✅ Yes' : '❌ No'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — ID Photos */}
            {step === 3 && (
              <div className="space-y-5">
                <p className="text-lg text-gray-500">Upload photos of your IDs. This is optional but recommended.</p>

                {/* Uploaded list */}
                {idDocuments.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-bold text-gray-700 text-base">Uploaded ({idDocuments.length}):</p>
                    {idDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                        <img src={doc.url} alt={doc.label} className="w-20 h-14 object-cover rounded-xl border border-gray-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">{doc.label}</p>
                        </div>
                        <button type="button" onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-700 text-2xl font-bold shrink-0">&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload widget */}
                <div className="border-2 border-green-200 rounded-2xl p-4 bg-green-50/30 space-y-4">

                  {/* 1. ID type */}
                  <div>
                    <label className="block text-base font-semibold text-gray-600 mb-1">Step 1 — ID Type</label>
                    <select
                      value={uploadingLabel}
                      onChange={e => setUploadingLabel(e.target.value)}
                      className={sc}
                    >
                      <option>Senior Citizen ID</option>
                      <option>PhilSys ID</option>
                    </select>
                  </div>

                  {/* 2. Photo picker */}
                  <div>
                    <label className="block text-base font-semibold text-gray-600 mb-1">Step 2 — Take or Choose Photo</label>

                    {uploadPreview ? (
                      <div className="relative border-2 border-green-500 rounded-2xl overflow-hidden bg-green-50">
                        <img src={uploadPreview} alt="Preview" className="w-full object-contain max-h-52" />
                        <button
                          type="button"
                          onClick={clearPending}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-lg"
                        >✕ Remove</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/50 rounded-2xl transition"
                        >
                          <span className="text-4xl">📸</span>
                          <span className="text-base font-semibold text-gray-600">Use Camera</span>
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/50 rounded-2xl transition cursor-pointer">
                          <span className="text-4xl">🖼️</span>
                          <span className="text-base font-semibold text-gray-600">Choose File</span>
                          <span className="text-xs text-gray-400">JPG / PNG / WEBP</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePickFile} disabled={uploading} className="sr-only" />
                        </label>
                      </div>
                    )}
                  </div>

                  {showCamera && (
                    <CameraCapture
                      onCapture={(file, preview) => {
                        setPendingFile(file);
                        setUploadPreview(preview);
                        setShowCamera(false);
                      }}
                      onClose={() => setShowCamera(false)}
                    />
                  )}

                  {/* Upload button */}
                  {pendingFile && (
                    <button
                      type="button"
                      onClick={handleUploadDoc}
                      disabled={uploading}
                      className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white text-xl font-bold py-4 rounded-2xl transition"
                    >
                      {uploading ? '⏳ Uploading...' : '📤 Save ID Photo'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className={`flex gap-4 mt-8 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
              {step > 0 && (
                <button type="button" onClick={prevStep} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold py-4 rounded-2xl transition">← Back</button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xl font-bold py-4 rounded-2xl transition shadow-md">Next →</button>
              ) : (
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xl font-bold py-4 rounded-2xl transition shadow-md">
                  {loading ? '⏳ Creating Account...' : '✅ Create Account'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
            <p className="text-xl text-gray-600">Already have an account?</p>
            <Link href="/login" className="inline-block mt-3 bg-green-700 hover:bg-green-800 text-white text-xl font-bold py-4 px-10 rounded-2xl transition">🔑 Sign In Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
