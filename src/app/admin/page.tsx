'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface IdDocument {
  id: string;
  label: string;
  url: string;
  createdAt: string;
}

interface UserRecord {
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
}

type SortField = 'fullName' | 'username' | 'age' | 'gender' | 'pensioner' | 'createdAt';

const emptyForm = {
  fullName: '', address: '', birthday: '', age: '',
  gender: '', relationshipStatus: '', seniorIdNumber: '',
  nationalIdNumber: '', pensioner: 'no',
  birthplace: '', philsysId: '', hasNoId: false,
};

const ID_LABELS = [
  'Senior Citizen ID', 'PhilSys ID', 'SSS ID', 'GSIS ID',
  'Postal ID', 'Passport', "Driver's License", "Voter's ID",
  'TIN ID', 'PRC ID', 'Other ID',
];

const inputClass = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white';
const labelClass = 'block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide';

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-PH') : '—';
const cap = (s: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [pensionerFilter, setPensionerFilter] = useState<'all' | 'yes' | 'no'>('all');

  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [editDocs, setEditDocs] = useState<IdDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState(ID_LABELS[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pwUser, setPwUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const router = useRouter();

  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }
    const res = await fetch(`/api/admin/users?sortBy=${sortBy}&order=${order}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
    setUsers(await res.json());
    setLoading(false);
  }, [sortBy, order, router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`ml-1 ${sortBy === field ? 'text-blue-600' : 'text-gray-300'}`}>
      {sortBy === field ? (order === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.fullName?.toLowerCase().includes(q) ?? false) ||
      u.username.toLowerCase().includes(q) ||
      (u.seniorIdNumber?.includes(q) ?? false) ||
      (u.nationalIdNumber?.includes(q) ?? false) ||
      (u.address?.toLowerCase().includes(q) ?? false);
    const matchPensioner =
      pensionerFilter === 'all' ||
      (pensionerFilter === 'yes' ? u.pensioner === true : u.pensioner !== true);
    return matchSearch && matchPensioner;
  });

  const totalPensioners = users.filter(u => u.pensioner === true).length;
  const totalNonPensioners = users.length - totalPensioners;

  const filterLabel =
    pensionerFilter === 'yes' ? 'Pensioners Only' :
    pensionerFilter === 'no' ? 'Non-Pensioners Only' :
    'All Members';

  // ── Edit ─────────────────────────────────────────────────────────
  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setEditError(''); setEditSuccess('');
    setEditForm({
      fullName: user.fullName || '', address: user.address || '',
      birthday: user.birthday ? user.birthday.split('T')[0] : '',
      age: user.age?.toString() || '', gender: user.gender || '',
      relationshipStatus: user.relationshipStatus || '',
      seniorIdNumber: user.seniorIdNumber || '',
      nationalIdNumber: user.nationalIdNumber || '',
      pensioner: user.pensioner ? 'yes' : 'no',
      birthplace: user.birthplace || '',
      philsysId: user.philsysId || '',
      hasNoId: user.hasNoId || false,
    });
    setUploadFile(null); setUploadPreview(null); setUploadError('');
    fetchDocs(user.id);
  };

  const fetchDocs = async (userId: string) => {
    setDocsLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/ids`, { headers: getAuthHeader() });
    if (res.ok) setEditDocs(await res.json());
    setDocsLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true); setEditError('');
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(data.error || 'Failed to update'); return; }
    setEditSuccess('Record updated successfully!');
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...data } : u));
    setTimeout(() => setEditUser(null), 1200);
  };

  const handleUploadDoc = async () => {
    if (!uploadFile || !editUser) return;
    setUploadLoading(true); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', headers: getAuthHeader(), body: fd });
      if (!uploadRes.ok) { const d = await uploadRes.json(); setUploadError(d.error || 'Upload failed'); setUploadLoading(false); return; }
      const { url } = await uploadRes.json();
      const saveRes = await fetch(`/api/admin/users/${editUser.id}/ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ label: uploadLabel, url }),
      });
      if (!saveRes.ok) { const d = await saveRes.json(); setUploadError(d.error || 'Failed to save'); setUploadLoading(false); return; }
      const newDoc: IdDocument = await saveRes.json();
      setEditDocs(prev => [...prev, newDoc]);
      setUploadFile(null); setUploadPreview(null);
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!editUser || !confirm('Remove this ID photo?')) return;
    const res = await fetch(`/api/admin/users/${editUser.id}/ids?docId=${docId}`, { method: 'DELETE', headers: getAuthHeader() });
    if (res.ok) setEditDocs(prev => prev.filter(d => d.id !== docId));
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE', headers: getAuthHeader() });
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    setDeleteLoading(false); setDeleteUser(null);
  };

  // ── Password ──────────────────────────────────────────────────────
  const openPassword = (user: UserRecord) => {
    setPwUser(user); setNewPassword(''); setConfirmPassword('');
    setPwError(''); setPwSuccess('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwLoading(true); setPwError('');
    const res = await fetch(`/api/admin/users/${pwUser.id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(data.error || 'Failed to update password'); return; }
    setPwSuccess('Password updated!');
    setTimeout(() => setPwUser(null), 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token'); localStorage.removeItem('user_role');
    router.push('/login');
  };

  const thClass = 'px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-blue-50 select-none whitespace-nowrap';
  const thPlain = 'px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ══ PRINT-ONLY LAYOUT ══ */}
      <div className="hidden print:block p-8 font-sans">
        {/* Print header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold">🏛️ OSCA Records</h1>
          <p className="text-sm text-gray-600">Office for Senior Citizens Affairs</p>
          <p className="text-base font-semibold mt-1">
            {filterLabel} — {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Printed on {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Print table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">#</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Full Name</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Age</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Gender</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Address</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Birthplace</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Birthday</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Relationship</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Senior ID</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">National ID</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Pensioner</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                <td className="border border-gray-200 px-2 py-1.5 font-medium">{u.fullName || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{u.age ?? '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{cap(u.gender)}</td>
                <td className="border border-gray-200 px-2 py-1.5">{u.address || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{u.birthplace || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{fmt(u.birthday)}</td>
                <td className="border border-gray-200 px-2 py-1.5">{cap(u.relationshipStatus)}</td>
                <td className="border border-gray-200 px-2 py-1.5 font-mono">{u.seniorIdNumber || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5 font-mono">{u.nationalIdNumber || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{u.pensioner ? 'Yes' : 'No'}</td>
                <td className="border border-gray-200 px-2 py-1.5">{fmt(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-gray-400 mt-6 text-center">— End of Report —</p>
      </div>

      {/* ══ SCREEN LAYOUT ══ */}
      <div className="print:hidden flex flex-col min-h-screen">

        {/* ── Header ── */}
        <header className="bg-white border-b-4 border-blue-600 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-blue-700 leading-tight">OSCA Records</h1>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            🚪 <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <div className="flex-1 px-4 sm:px-6 py-6 space-y-6">

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Total Members', value: users.length, icon: '👥', color: 'bg-blue-600' },
              { label: 'Pensioners', value: totalPensioners, icon: '✅', color: 'bg-green-600' },
              { label: 'Non-Pensioners', value: totalNonPensioners, icon: '📋', color: 'bg-orange-500' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5 flex items-center gap-3 sm:gap-5">
                <div className={`${color} w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shrink-0`}>
                  {icon}
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">{label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{loading ? '—' : value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

            {/* Toolbar */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Member Records</h2>
                  <p className="text-sm text-gray-400">
                    Showing {filtered.length} of {users.length} members
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm shrink-0"
                  title={`Print ${filterLabel}`}
                >
                  🖨️ <span className="hidden sm:inline">Print</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={pensionerFilter}
                  onChange={(e) => setPensionerFilter(e.target.value as 'all' | 'yes' | 'no')}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-white font-medium"
                >
                  <option value="all">👥 All Members</option>
                  <option value="yes">✅ Pensioners Only</option>
                  <option value="no">📋 Non-Pensioners Only</option>
                </select>
                <div className="relative flex-1 sm:flex-none">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, username, ID..."
                    className="pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm w-full sm:w-72"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-3 animate-pulse">⏳</div>
                <p className="text-lg font-medium">Loading records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-lg font-medium">No records found</p>
                <p className="text-sm mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <>
                {/* ── Mobile: Card list ── */}
                <div className="block lg:hidden divide-y divide-gray-100">
                  {filtered.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-blue-50/50 transition">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-base truncate">{user.fullName || <span className="text-gray-400 font-normal italic">No name</span>}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.age && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{user.age} yrs</span>}
                            {user.gender && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user.gender}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.pensioner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {user.pensioner ? '✅ Pensioner' : 'Non-Pensioner'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => openEdit(user)} title="Edit" className="w-9 h-9 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm">✏️</button>
                          <button onClick={() => openPassword(user)} title="Change password" className="w-9 h-9 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition text-sm">🔑</button>
                          <button onClick={() => setDeleteUser(user)} title="Delete" className="w-9 h-9 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm">🗑️</button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                        {user.address && <div><span className="font-semibold text-gray-400">Address: </span>{user.address}</div>}
                        {user.seniorIdNumber && <div><span className="font-semibold text-gray-400">Senior ID: </span><span className="font-mono">{user.seniorIdNumber}</span></div>}
                        {user.birthday && <div><span className="font-semibold text-gray-400">Birthday: </span>{fmt(user.birthday)}</div>}
                        {user.nationalIdNumber && <div><span className="font-semibold text-gray-400">National ID: </span><span className="font-mono">{user.nationalIdNumber}</span></div>}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Registered {fmt(user.createdAt)}</p>
                    </div>
                  ))}
                </div>

                {/* ── Desktop: Table ── */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[4%]" />
                      <col className="w-[6%]" /><col className="w-[12%]" /><col className="w-[7%]" />
                      <col className="w-[8%]" /><col className="w-[9%]" /><col className="w-[9%]" />
                      <col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[9%]" />
                    </colgroup>
                    <thead className="bg-gray-50 border-y border-gray-100">
                      <tr>
                        <th className={thClass} onClick={() => handleSort('fullName')}>Full Name <SortIcon field="fullName" /></th>
                        <th className={thClass} onClick={() => handleSort('username')}>Username <SortIcon field="username" /></th>
                        <th className={thClass} onClick={() => handleSort('age')}>Age <SortIcon field="age" /></th>
                        <th className={thClass} onClick={() => handleSort('gender')}>Gender <SortIcon field="gender" /></th>
                        <th className={thPlain}>Address</th>
                        <th className={thPlain}>Birthday</th>
                        <th className={thPlain}>Relationship</th>
                        <th className={thPlain}>Senior ID</th>
                        <th className={thPlain}>National ID</th>
                        <th className={thClass} onClick={() => handleSort('pensioner')}>Pensioner <SortIcon field="pensioner" /></th>
                        <th className={thClass} onClick={() => handleSort('createdAt')}>Registered <SortIcon field="createdAt" /></th>
                        <th className={thPlain}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user, i) => (
                        <tr key={user.id} className={`border-b border-gray-50 hover:bg-blue-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                          <td className="px-3 py-3 font-semibold text-gray-800 truncate">{user.fullName || <span className="text-gray-300 font-normal italic">—</span>}</td>
                          <td className="px-3 py-3 text-gray-500 truncate text-xs">@{user.username}</td>
                          <td className="px-3 py-3 text-gray-700 font-medium">{user.age ?? <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 capitalize text-gray-600 truncate">{user.gender || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 text-gray-600 truncate text-xs">{user.address || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 text-gray-600 text-xs">{user.birthday ? fmt(user.birthday) : <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 capitalize text-gray-600 truncate text-xs">{user.relationshipStatus || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 text-gray-600 truncate text-xs font-mono">{user.seniorIdNumber || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3 text-gray-600 truncate text-xs font-mono">{user.nationalIdNumber || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${user.pensioner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {user.pensioner ? '✅ Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs">{fmt(user.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(user)} title="Edit record" className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm">✏️</button>
                              <button onClick={() => openPassword(user)} title="Change password" className="w-8 h-8 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition text-sm">🔑</button>
                              <button onClick={() => setDeleteUser(user)} title="Delete record" className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Edit Modal ── */}
        {editUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">✏️ Edit Record</h3>
                  <p className="text-sm text-gray-400 mt-0.5">@{editUser.username}</p>
                </div>
                <button onClick={() => setEditUser(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl transition">&times;</button>
              </div>
              <form onSubmit={handleEditSubmit} className="px-6 py-6 space-y-5">
                {editError && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">⚠️ {editError}</div>}
                {editSuccess && <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">✅ {editSuccess}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" value={editForm.age} onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Birthday</label>
                    <input type="date" value={editForm.birthday} onChange={e => setEditForm(p => ({ ...p, birthday: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Birthplace</label>
                    <input type="text" value={editForm.birthplace} onChange={e => setEditForm(p => ({ ...p, birthplace: e.target.value }))} className={inputClass} placeholder="City / Municipality" />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className={inputClass}>
                      <option value="">— Select —</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Relationship Status</label>
                    <select value={editForm.relationshipStatus} onChange={e => setEditForm(p => ({ ...p, relationshipStatus: e.target.value }))} className={inputClass}>
                      <option value="">— Select —</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Address</label>
                    <input type="text" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pensioner</label>
                    <select value={editForm.pensioner} onChange={e => setEditForm(p => ({ ...p, pensioner: e.target.value }))} className={inputClass}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Senior ID (16 digits)</label>
                    <input type="text" value={editForm.seniorIdNumber} onChange={e => setEditForm(p => ({ ...p, seniorIdNumber: e.target.value }))} className={`${inputClass} font-mono`} maxLength={16} pattern="\d{16}" title="Must be exactly 16 digits" placeholder="0000000000000000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editForm.hasNoId} onChange={e => setEditForm(p => ({ ...p, hasNoId: e.target.checked }))} className="w-5 h-5 rounded accent-blue-600" />
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">I have no other IDs</span>
                    </label>
                  </div>
                  {!editForm.hasNoId && (
                    <>
                      <div>
                        <label className={labelClass}>PhilSys ID</label>
                        <input type="text" value={editForm.philsysId} onChange={e => setEditForm(p => ({ ...p, philsysId: e.target.value }))} className={`${inputClass} font-mono`} placeholder="Philippine ID System number" />
                      </div>
                      <div>
                        <label className={labelClass}>National ID</label>
                        <input type="text" value={editForm.nationalIdNumber} onChange={e => setEditForm(p => ({ ...p, nationalIdNumber: e.target.value }))} className={`${inputClass} font-mono`} placeholder="SSS / GSIS / Others" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={editLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
                    {editLoading ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                    Cancel
                  </button>
                </div>
              </form>

              {/* ID Documents */}
              <div className="px-6 pb-7">
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-base font-bold text-gray-700 mb-4">🪪 ID Photos</h4>
                  {docsLoading ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                  ) : editDocs.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No ID photos uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {editDocs.map(doc => (
                        <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <img src={doc.url} alt={doc.label} className="w-full h-28 object-cover" />
                          <div className="flex justify-between items-center px-3 py-2 bg-gray-50">
                            <span className="text-sm font-medium text-gray-700 truncate">{doc.label}</span>
                            <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2 shrink-0">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                    {uploadError && <p className="text-red-600 text-sm font-medium">⚠️ {uploadError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>ID Type</label>
                        <select value={uploadLabel} onChange={e => setUploadLabel(e.target.value)} className={inputClass}>
                          {ID_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Photo</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setUploadError('JPG, PNG, or WEBP only'); return; }
                            if (file.size > 5 * 1024 * 1024) { setUploadError('Max 5 MB'); return; }
                            setUploadError(''); setUploadFile(file);
                            setUploadPreview(URL.createObjectURL(file));
                          }}
                          className="w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                        />
                      </div>
                    </div>
                    {uploadPreview && (
                      <div className="flex items-start gap-3">
                        <img src={uploadPreview} alt="Preview" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
                        <button onClick={() => { setUploadFile(null); setUploadPreview(null); }} className="text-red-500 text-xs font-semibold hover:text-red-700">✕ Remove</button>
                      </div>
                    )}
                    <button
                      onClick={handleUploadDoc}
                      disabled={!uploadFile || uploadLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
                    >
                      {uploadLoading ? '⏳ Uploading...' : '📤 Upload ID'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Modal ── */}
        {deleteUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">⚠️</div>
                <h3 className="text-xl font-bold text-gray-800">Delete Record?</h3>
                <p className="text-gray-500 text-sm mt-2">
                  You are about to permanently delete the record of{' '}
                  <span className="font-bold text-gray-800">{deleteUser.fullName || deleteUser.username}</span>.
                  This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
                  {deleteLoading ? '⏳ Deleting...' : '🗑️ Yes, Delete'}
                </button>
                <button onClick={() => setDeleteUser(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Change Password Modal ── */}
        {pwUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">🔑 Change Password</h3>
                  <p className="text-sm text-gray-400 mt-0.5">@{pwUser.username}</p>
                </div>
                <button onClick={() => setPwUser(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl">&times;</button>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {pwError && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">⚠️ {pwError}</div>}
                {pwSuccess && <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">✅ {pwSuccess}</div>}
                <div>
                  <label className={labelClass}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 6 characters" required />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Re-enter new password" required />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={pwLoading} className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
                    {pwLoading ? '⏳ Updating...' : '🔑 Update Password'}
                  </button>
                  <button type="button" onClick={() => setPwUser(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
