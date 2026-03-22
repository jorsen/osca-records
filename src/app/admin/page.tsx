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

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }

    const res = await fetch(`/api/admin/users?sortBy=${sortBy}&order=${order}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      router.push('/login');
      return;
    }

    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }, [sortBy, order, router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="text-gray-400 ml-1">↕</span>;
    return <span className="text-indigo-600 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">OSCA Records — Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              All Records
              <span className="ml-2 text-sm font-normal text-gray-500">({users.length} members)</span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-indigo-50 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('fullName')}>
                      Full Name <SortIcon field="fullName" />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('username')}>
                      Username <SortIcon field="username" />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('age')}>
                      Age <SortIcon field="age" />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('gender')}>
                      Gender <SortIcon field="gender" />
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">Address</th>
                    <th className="px-4 py-3 whitespace-nowrap">Birthday</th>
                    <th className="px-4 py-3 whitespace-nowrap">Relationship</th>
                    <th className="px-4 py-3 whitespace-nowrap">Senior ID</th>
                    <th className="px-4 py-3 whitespace-nowrap">National ID</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('pensioner')}>
                      Pensioner <SortIcon field="pensioner" />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-indigo-100 whitespace-nowrap" onClick={() => handleSort('createdAt')}>
                      Registered <SortIcon field="createdAt" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{user.fullName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">@{user.username}</td>
                      <td className="px-4 py-3 text-gray-600">{user.age ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{user.gender || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.address || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {user.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{user.relationshipStatus || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.seniorIdNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.nationalIdNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.pensioner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.pensioner ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
