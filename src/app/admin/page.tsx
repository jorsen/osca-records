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

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [pensionerFilter, setPensionerFilter] = useState<'all' | 'yes' | 'no'>('all');

  // Edit modal
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Password modal
  const [pwUser, setPwUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const router = useRouter();

  const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  };

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
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="text-gray-400 ml-1">↕</span>;
    return <span className="text-indigo-600 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.fullName?.toLowerCase().includes(q) ?? false) ||
      u.username.toLowerCase().includes(q) ||
      (u.seniorIdNumber?.includes(q) ?? false) ||
      (u.nationalIdNumber?.includes(q) ?? false) ||
      (u.address?.toLowerCase().includes(q) ?? false);
    const matchesPensioner =
      pensionerFilter === 'all' ||
      (pensionerFilter === 'yes' ? u.pensioner === true : u.pensioner !== true);
    return matchesSearch && matchesPensioner;
  });

  // ── Edit ────────────────────────────────────────────
  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setEditError('');
    setEditSuccess('');
    setEditForm({
      fullName: user.fullName || '',
      address: user.address || '',
      birthday: user.birthday ? user.birthday.split('T')[0] : '',
      age: user.age?.toString() || '',
      gender: user.gender || '',
      relationshipStatus: user.relationshipStatus || '',
      seniorIdNumber: user.seniorIdNumber || '',
      nationalIdNumber: user.nationalIdNumber || '',
      pensioner: user.pensioner ? 'yes' : 'no',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');

    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(editForm),
    });

    const data = await res.json();
    setEditLoading(false);

    if (!res.ok) { setEditError(data.error || 'Failed to update'); return; }

    setEditSuccess('Record updated successfully!');
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? data : u)));
    setTimeout(() => setEditUser(null), 1200);
  };

  // ── Delete ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);

    await fetch(`/api/admin/users/${deleteUser.id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setDeleteLoading(false);
    setDeleteUser(null);
  };

  // ── Change Password ──────────────────────────────────
  const openPassword = (user: UserRecord) => {
    setPwUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPwError('');
    setPwSuccess('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }

    setPwLoading(true);
    setPwError('');

    const res = await fetch(`/api/admin/users/${pwUser.id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ password: newPassword }),
    });

    const data = await res.json();
    setPwLoading(false);

    if (!res.ok) { setPwError(data.error || 'Failed to update password'); return; }

    setPwSuccess('Password updated successfully!');
    setTimeout(() => setPwUser(null), 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">OSCA Records — Admin</h1>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition">
          Logout
        </button>
      </nav>

      <div className="px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              All Records
              <span className="ml-2 text-sm font-normal text-gray-500">({filtered.length} of {users.length})</span>
            </h2>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <select
                value={pensionerFilter}
                onChange={(e) => setPensionerFilter(e.target.value as 'all' | 'yes' | 'no')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="all">All Members</option>
                <option value="yes">Pensioners Only</option>
                <option value="no">Non-Pensioners Only</option>
              </select>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, ID..."
                className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No records found.</div>
          ) : (
            <table className="w-full table-fixed text-xs text-left">
              <colgroup>
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[4%]" />
                <col className="w-[6%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead className="bg-indigo-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('fullName')}>Full Name <SortIcon field="fullName" /></th>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('username')}>Username <SortIcon field="username" /></th>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('age')}>Age <SortIcon field="age" /></th>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('gender')}>Gender <SortIcon field="gender" /></th>
                  <th className="px-2 py-2">Address</th>
                  <th className="px-2 py-2">Birthday</th>
                  <th className="px-2 py-2">Relationship</th>
                  <th className="px-2 py-2">Senior ID</th>
                  <th className="px-2 py-2">National ID</th>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('pensioner')}>Pensioner <SortIcon field="pensioner" /></th>
                  <th className="px-2 py-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('createdAt')}>Registered <SortIcon field="createdAt" /></th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-2 py-2 font-medium text-gray-800 truncate">{user.fullName || '—'}</td>
                    <td className="px-2 py-2 text-gray-600 truncate">@{user.username}</td>
                    <td className="px-2 py-2 text-gray-600">{user.age ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-600 capitalize truncate">{user.gender || '—'}</td>
                    <td className="px-2 py-2 text-gray-600 truncate">{user.address || '—'}</td>
                    <td className="px-2 py-2 text-gray-600">{user.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}</td>
                    <td className="px-2 py-2 text-gray-600 capitalize truncate">{user.relationshipStatus || '—'}</td>
                    <td className="px-2 py-2 text-gray-600 truncate">{user.seniorIdNumber || '—'}</td>
                    <td className="px-2 py-2 text-gray-600 truncate">{user.nationalIdNumber || '—'}</td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${user.pensioner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.pensioner ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(user)} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-1.5 py-1 rounded text-xs font-medium transition">Edit</button>
                        <button onClick={() => openPassword(user)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-1.5 py-1 rounded text-xs font-medium transition">Pwd</button>
                        <button onClick={() => setDeleteUser(user)} className="bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-1 rounded text-xs font-medium transition">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">Edit — @{editUser.username}</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{editError}</div>}
              {editSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{editSuccess}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Address', key: 'address', type: 'text' },
                  { label: 'Birthday', key: 'birthday', type: 'date' },
                  { label: 'Age', key: 'age', type: 'number' },
                  { label: 'Senior ID (16 digits)', key: 'seniorIdNumber', type: 'text', maxLength: 16, minLength: 16, pattern: '\\d{16}' },
                  { label: 'National ID', key: 'nationalIdNumber', type: 'text' },
                ].map(({ label, key, type, maxLength, minLength, pattern }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type}
                      value={editForm[key as keyof typeof editForm]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      maxLength={maxLength}
                      minLength={minLength}
                      pattern={pattern}
                      title={pattern ? 'Must be exactly 16 digits' : undefined}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
                  <select value={editForm.relationshipStatus} onChange={(e) => setEditForm((p) => ({ ...p, relationshipStatus: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pensioner</label>
                  <select value={editForm.pensioner} onChange={(e) => setEditForm((p) => ({ ...p, pensioner: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition disabled:bg-gray-400 text-sm">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Record</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteUser.fullName || deleteUser.username}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition disabled:bg-gray-400 text-sm">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteUser(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {pwUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
              <button onClick={() => setPwUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Setting new password for <span className="font-semibold">@{pwUser.username}</span></p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              {pwError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{pwError}</div>}
              {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">{pwSuccess}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={pwLoading} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded-lg transition disabled:bg-gray-400 text-sm">
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => setPwUser(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition text-sm">
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
