'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface IdDocument {
  id: string;
  label: string;
  url: string;
  createdAt: string;
}

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
  birthplace: string | null;
  philsysId: string | null;
  hasNoId: boolean;
  createdAt: string;
  updatedAt: string;
  idDocuments: IdDocument[];
}

const ID_LABELS = [
  'Senior Citizen ID',
  'PhilSys ID',
  'SSS ID',
  'GSIS ID',
  'Postal ID',
  'Passport',
  'Driver\'s License',
  'Voter\'s ID',
  'TIN ID',
  'PRC ID',
  'Other ID',
];

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
    birthplace: '', philsysId: '', hasNoId: false,
  });

  // ID upload state
  const [uploadLabel, setUploadLabel] = useState(ID_LABELS[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        birthplace: data.birthplace || '',
        philsysId: data.philsysId || '',
        hasNoId: data.hasNoId || false,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }
    setUploadError('');
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleUploadId = async () => {
    if (!uploadFile) return;
    setUploadLoading(true); setUploadError('');
    const token = localStorage.getItem('auth_token');
    try {
      // 1. Upload file to blob
      const fd = new FormData();
      fd.append('file', uploadFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!uploadRes.ok) { const d = await uploadRes.json(); setUploadError(d.error || 'Upload failed'); setUploadLoading(false); return; }
      const { url } = await uploadRes.json();

      // 2. Save document record
      const saveRes = await fetch('/api/profile/ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: uploadLabel, url }),
      });
      if (!saveRes.ok) { const d = await saveRes.json(); setUploadError(d.error || 'Failed to save'); setUploadLoading(false); return; }
      const newDoc: IdDocument = await saveRes.json();

      setProfile(prev => prev ? { ...prev, idDocuments: [...prev.idDocuments, newDoc] } : prev);
      setUploadFile(null); setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError('Something went wrong during upload.');
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteId = async (docId: string) => {
    if (!confirm('Remove this ID photo?')) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/profile/ids?id=${docId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, idDocuments: prev.idDocuments.filter(d => d.id !== docId) } : prev);
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

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | boolean | undefined }) => (
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
        <div className="flex gap-3 print:hidden">
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
                {profile.hasNoId && (
                  <span className="bg-yellow-100 text-yellow-700 text-base font-semibold px-4 py-1 rounded-full">📋 No Other ID</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="print:hidden bg-green-50 border-2 border-green-400 text-green-800 px-6 py-4 rounded-2xl text-xl font-medium text-center">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="print:hidden bg-red-50 border-2 border-red-400 text-red-800 px-6 py-4 rounded-2xl text-xl font-medium text-center">
            ⚠️ {error}
          </div>
        )}

        {/* View or Edit */}
        {isEditing ? (
          <div className="print:hidden bg-white rounded-3xl shadow-lg p-8">
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
                  <label className={labelClass}>Birthplace</label>
                  <input type="text" name="birthplace" value={formData.birthplace} onChange={handleChange} className={inputClass} placeholder="City / Municipality" />
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

                {/* hasNoId checkbox */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasNoId"
                      checked={formData.hasNoId}
                      onChange={handleChange}
                      className="w-7 h-7 rounded border-2 border-gray-300 accent-blue-600"
                    />
                    <span className="text-xl font-semibold text-gray-700">I have no other IDs</span>
                  </label>
                </div>

                {!formData.hasNoId && (
                  <>
                    <div>
                      <label className={labelClass}>PhilSys ID Number</label>
                      <input type="text" name="philsysId" value={formData.philsysId} onChange={handleChange} className={inputClass} placeholder="Philippine Identification System" />
                    </div>
                    <div>
                      <label className={labelClass}>National ID Number</label>
                      <input type="text" name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className={inputClass} placeholder="SSS / GSIS / Others" />
                    </div>
                  </>
                )}
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
                className="print:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl transition"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="py-3">
                <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-2">Personal Details</p>
                <InfoRow label="Full Name" value={profile.fullName} />
                <InfoRow label="Birthday" value={profile.birthday ? new Date(profile.birthday).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Birthplace" value={profile.birthplace} />
                <InfoRow label="Age" value={profile.age} />
                <InfoRow label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                <InfoRow label="Address" value={profile.address} />
                <InfoRow label="Relationship Status" value={profile.relationshipStatus ? profile.relationshipStatus.charAt(0).toUpperCase() + profile.relationshipStatus.slice(1) : null} />
              </div>
              <div className="py-3 mt-2">
                <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-2 mt-2">ID Information</p>
                <InfoRow label="Senior ID Number" value={profile.seniorIdNumber} />
                {!profile.hasNoId && (
                  <>
                    <InfoRow label="PhilSys ID" value={profile.philsysId} />
                    <InfoRow label="National ID Number" value={profile.nationalIdNumber} />
                  </>
                )}
                {profile.hasNoId && (
                  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-1">
                    <span className="text-gray-500 text-lg sm:w-52 shrink-0">Other IDs</span>
                    <span className="text-xl font-semibold text-yellow-600">No other IDs declared</span>
                  </div>
                )}
                <InfoRow label="Pensioner" value={profile.pensioner ? 'Yes ✅' : 'No'} />
              </div>
            </div>
          </div>
        )}

        {/* ID Photos Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 print:shadow-none print:border print:border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🪪 My ID Photos</h3>

          {/* Existing photos */}
          {profile.idDocuments.length === 0 ? (
            <p className="text-gray-400 text-lg italic text-center py-4">No ID photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {profile.idDocuments.map((doc) => (
                <div key={doc.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                  <img src={doc.url} alt={doc.label} className="w-full h-44 object-cover" />
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                    <span className="text-lg font-semibold text-gray-700">{doc.label}</span>
                    <button
                      onClick={() => handleDeleteId(doc.id)}
                      className="print:hidden text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload new */}
          <div className="print:hidden border-2 border-dashed border-blue-200 rounded-2xl p-6 space-y-4 bg-blue-50/40">
            <p className="text-lg font-semibold text-gray-700">📎 Upload ID Photo</p>
            {uploadError && (
              <div className="text-red-600 text-base font-medium bg-red-50 px-4 py-2 rounded-xl">⚠️ {uploadError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-2">ID Type</label>
                <select
                  value={uploadLabel}
                  onChange={e => setUploadLabel(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500"
                >
                  {ID_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-2">Photo File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-base text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-base file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
              </div>
            </div>
            {uploadPreview && (
              <div className="flex items-start gap-4">
                <img src={uploadPreview} alt="Preview" className="h-32 w-48 object-cover rounded-xl border-2 border-gray-200" />
                <button
                  onClick={() => { setUploadFile(null); setUploadPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-red-500 text-sm font-semibold hover:text-red-700"
                >
                  ✕ Remove
                </button>
              </div>
            )}
            <button
              onClick={handleUploadId}
              disabled={!uploadFile || uploadLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xl font-bold px-8 py-4 rounded-2xl transition"
            >
              {uploadLoading ? '⏳ Uploading...' : '📤 Upload ID'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-base pb-6">
          Member since {new Date(profile.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
