'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  actorName: string | null;
  targetName: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_ICON: Record<string, string> = {
  LOGIN: '🔑',
  LOGIN_FAILED: '🚫',
  EDIT_RECORD: '✏️',
  DELETE_RECORD: '🗑️',
  CHANGE_PASSWORD: '🔒',
};

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'bg-green-50 text-green-700 border-green-200',
  LOGIN_FAILED: 'bg-red-50 text-red-700 border-red-200',
  EDIT_RECORD: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE_RECORD: 'bg-red-50 text-red-700 border-red-200',
  CHANGE_PASSWORD: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('user_role');
    if (role !== 'SUPERADMIN') { router.push('/login'); return; }
    const res = await fetch('/api/audit', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
    setLogs(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 4000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch =
      log.action.toLowerCase().includes(q) ||
      (log.actorName?.toLowerCase().includes(q) ?? false) ||
      (log.targetName?.toLowerCase().includes(q) ?? false) ||
      (log.details?.toLowerCase().includes(q) ?? false);
    const matchFilter = filter === 'all' || log.action === filter;
    return matchSearch && matchFilter;
  });

  const fmt = (d: string) => new Date(d).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-green-700 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-green-800 leading-tight">OSCA Records</h1>
            <p className="text-xs text-gray-400">Audit Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <a
            href="/admin"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            ← Admin
          </a>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: logs.length, color: 'bg-gray-700' },
            { label: 'Logins', value: logs.filter(l => l.action === 'LOGIN').length, color: 'bg-green-600' },
            { label: 'Failed', value: logs.filter(l => l.action === 'LOGIN_FAILED').length, color: 'bg-red-500' },
            { label: 'Edits', value: logs.filter(l => l.action === 'EDIT_RECORD').length, color: 'bg-blue-500' },
            { label: 'Deletes', value: logs.filter(l => l.action === 'DELETE_RECORD').length, color: 'bg-orange-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0`}>
                {s.value}
              </div>
              <span className="text-sm font-semibold text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-green-600 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">🔑 Login</option>
            <option value="LOGIN_FAILED">🚫 Login Failed</option>
            <option value="EDIT_RECORD">✏️ Edit Record</option>
            <option value="DELETE_RECORD">🗑️ Delete Record</option>
            <option value="CHANGE_PASSWORD">🔒 Change Password</option>
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actor, target, details..."
              className="pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 text-sm w-full"
            />
          </div>
          <p className="text-sm text-gray-400 self-center shrink-0">{filtered.length} entries</p>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-base font-medium">Loading logs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-base font-medium">No logs found</p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="block sm:hidden divide-y divide-gray-50">
                {filtered.map(log => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{ACTION_ICON[log.action] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-lg border mb-1 ${ACTION_COLOR[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.actorName && <p className="text-sm text-gray-700">By: <span className="font-semibold">{log.actorName}</span></p>}
                        {log.targetName && <p className="text-sm text-green-700 font-medium">{log.targetName}</p>}
                        {log.details && <p className="text-xs text-gray-400">{log.details}</p>}
                        <p className="text-xs text-gray-300 mt-1">{fmt(log.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Actor</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Target</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log, i) => (
                      <tr key={log.id} className={`border-b border-gray-50 hover:bg-green-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${ACTION_COLOR[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {ACTION_ICON[log.action] || '📌'} {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{log.actorName || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{log.targetName || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{log.details || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
