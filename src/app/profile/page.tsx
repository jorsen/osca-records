'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  username: string;
  fullName: string | null;
  address: string | null;
  birthday: string | null;
  age: number | null;
  gender: string | null;
  relationshipStatus: string | null;
  seniorIdNumber: string | null;
  nationalIdNumber: string | null;
  pensioner: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '', address: '', birthday: '', age: '',
    gender: '', relationshipStatus: '', seniorIdNumber: '',
    nationalIdNumber: '', pensioner: 'no',
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }

    const role = localStorage.getItem('user_role');
    if (role === 'SUPERADMIN') { router.push('/admin'); return; }

    try {
      const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('auth_token'); router.push('/login'); }
        return;
      }
      const data = await res.json();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        address: data.address || '',
        birthday: data.birthday ? data.birthday.split('T')[0] : '',
        age: data.age?.toString() || '',
        gender: data.gender || '',
        relationshipStatus: data.relationshipStatus || '',
        seniorIdNumber: data.seniorIdNumber || '',
        nationalIdNumber: data.nationalIdNumber || '',
        pensioner: data.pensioner ? 'yes' : 'no',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update profile.'); return; }
      setProfile(data.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-2xl text-gray-600 font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
  const labelClass = 'block text-lg font-semibold text-gray-700 mb-2';

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | boolean }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 last:border-0 gap-1">
      <span className="text-gray-500 text-lg sm:w-52 shrink-0">{label}</span>
      <span className="text-xl font-semibold text-gray-800">
        {value !== null && value !== undefined && value !== '' ? String(value) : <span className="text-gray-400 font-normal italic">Not provided</span>}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-blue-600 px-6 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏛️</span>
          <div>
            <h1 className="text-2xl font-bold text-blue-700">OSCA Records</h1>
            <p className="text-sm text-gray-500">Office for Senior Citizens Affairs</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-semibold px-5 py-3 rounded-xl transition"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-5 py-3 rounded-xl transition"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl shrink-0">
              {profile.gender === 'female' ? '👵' : '👴'}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-gray-800">{profile.fullName || 'Senior Citizen'}</h2>
              <p className="text-xl text-gray-500 mt-1">@{profile.username}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.pensioner && (
                  <span className="bg-green-100 text-green-700 text-base font-semibold px-4 py-1 rounded-full">✅ Pensioner</span>
                )}
                {profile.age && (
                  <span className="bg-blue-100 text-blue-700 text-base font-semibold px-4 py-1 rounded-full">🎂 {profile.age} years old</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border-2 border-green-400 text-green-800 px-6 py-4 rounded-2xl text-xl font-medium text-center">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 text-red-800 px-6 py-4 rounded-2xl text-xl font-medium text-center">
            ⚠️ {error}
          </div>
        )}

        {/* View or Edit */}
        {isEditing ? (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Your Information</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputClass} bg-white`}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Birthday</label>
                  <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass} min="60" max="120" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Home Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Relationship Status</label>
                  <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleChange} className={`${inputClass} bg-white`}>
                    <option value="">— Select —</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pensioner?</label>
                  <select name="pensioner" value={formData.pensioner} onChange={handleChange} className={`${inputClass} bg-white`}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
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
                </div>
                <div>
                  <label className={labelClass}>National ID Number</label>
                  <input type="text" name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className={inputClass} placeholder="SSS / GSIS / PhilSys" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xl font-bold py-5 rounded-2xl transition shadow-md">
                  {loading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={() => { setIsEditing(false); setError(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold py-5 rounded-2xl transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">My Information</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl transition"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="py-3">
                <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-2">Personal Details</p>
                <InfoRow label="Full Name" value={profile.fullName} />
                <InfoRow label="Birthday" value={profile.birthday ? new Date(profile.birthday).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Age" value={profile.age} />
                <InfoRow label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                <InfoRow label="Address" value={profile.address} />
                <InfoRow label="Relationship Status" value={profile.relationshipStatus ? profile.relationshipStatus.charAt(0).toUpperCase() + profile.relationshipStatus.slice(1) : null} />
              </div>
              <div className="py-3 mt-2">
                <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-2 mt-2">ID Information</p>
                <InfoRow label="Senior ID Number" value={profile.seniorIdNumber} />
                <InfoRow label="National ID Number" value={profile.nationalIdNumber} />
                <InfoRow label="Pensioner" value={profile.pensioner ? 'Yes ✅' : 'No'} />
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-base pb-6">
          Member since {new Date(profile.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
