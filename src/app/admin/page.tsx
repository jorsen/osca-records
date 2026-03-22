'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  createdAt: string;
}

type SortField = 'fullName' | 'username' | 'age' | 'gender' | 'pensioner' | 'createdAt';

const emptyForm = {
  fullName: '', address: '', birthday: '', age: '',
  gender: '', relationshipStatus: '', seniorIdNumber: '',
  nationalIdNumber: '', pensioner: 'no',
};

const inputClass = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white';
const labelClass = 'block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide';

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
    });
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
    setUsers(prev => prev.map(u => u.id === editUser.id ? data : u));
    setTimeout(() => setEditUser(null), 1200);
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

  const thClass = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-blue-50 select-none whitespace-nowrap';
  const thPlain = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b-4 border-blue-600 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <h1 className="text-xl font-bold text-blue-700 leading-tight">OSCA Records</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          🚪 Logout
        </button>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Members', value: users.length, icon: '👥', color: 'bg-blue-600' },
            { label: 'Pensioners', value: totalPensioners, icon: '✅', color: 'bg-green-600' },
            { label: 'Non-Pensioners', value: totalNonPensioners, icon: '📋', color: 'bg-orange-500' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5">
              <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Member Records</h2>
              <p className="text-sm text-gray-400">
                Showing {filtered.length} of {users.length} members
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                value={pensionerFilter}
                onChange={(e) => setPensionerFilter(e.target.value as 'all' | 'yes' | 'no')}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-white font-medium"
              >
                <option value="all">👥 All Members</option>
                <option value="yes">✅ Pensioners Only</option>
                <option value="no">📋 Non-Pensioners Only</option>
              </select>
              <div className="relative">
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

          {/* Table */}
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
            <div className="overflow-x-auto">
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
                      <td className="px-4 py-3 font-semibold text-gray-800 truncate">{user.fullName || <span className="text-gray-300 font-normal italic">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500 truncate text-xs">@{user.username}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{user.age ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 capitalize text-gray-600 truncate">{user.gender || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600 truncate text-xs">{user.address || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{user.birthday ? new Date(user.birthday).toLocaleDateString() : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 capitalize text-gray-600 truncate text-xs">{user.relationshipStatus || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600 truncate text-xs font-mono">{user.seniorIdNumber || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600 truncate text-xs font-mono">{user.nationalIdNumber || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${user.pensioner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.pensioner ? '✅ Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(user)}
                            title="Edit record"
                            className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
                          >✏️</button>
                          <button
                            onClick={() => openPassword(user)}
                            title="Change password"
                            className="w-8 h-8 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition text-sm"
                          >🔑</button>
                          <button
                            onClick={() => setDeleteUser(user)}
                            title="Delete record"
                            className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">✏️ Edit Record</h3>
                <p className="text-sm text-gray-400 mt-0.5">@{editUser.username}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl transition">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-7 py-6 space-y-5">
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
                  <label className={labelClass}>Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className={inputClass}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input type="text" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
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
                <div>
                  <label className={labelClass}>Pensioner</label>
                  <select value={editForm.pensioner} onChange={e => setEditForm(p => ({ ...p, pensioner: e.target.value }))} className={inputClass}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Senior ID (16 digits)</label>
                  <input type="text" value={editForm.seniorIdNumber} onChange={e => setEditForm(p => ({ ...p, seniorIdNumber: e.target.value }))} className={`${inputClass} font-mono`} maxLength={16} minLength={16} pattern="\d{16}" title="Must be exactly 16 digits" placeholder="0000000000000000" />
                </div>
                <div>
                  <label className={labelClass}>National ID</label>
                  <input type="text" value={editForm.nationalIdNumber} onChange={e => setEditForm(p => ({ ...p, nationalIdNumber: e.target.value }))} className={`${inputClass} font-mono`} placeholder="SSS / GSIS / PhilSys" />
                </div>
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
  );
}
