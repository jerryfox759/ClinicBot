'use client';

import { useState, useEffect } from 'react';
import { Key, Search, Loader2, Calendar, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [query]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit-logs?query=${query}`);
      const data = await res.json();
      if (res.ok && data.auditLogs) {
        setLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Review system transaction records, login trails, and security updates history.</p>
        </div>

        {/* Search */}
        <div className="relative w-64 max-w-xs self-start">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by action, email, details..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-border bg-card">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ShieldAlert size={20} />
            </div>
            <p className="text-sm font-semibold">No audit logs found.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Audit trails populate automatically when actions occur in the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 w-48">Timestamp</th>
                  <th className="pb-3">Action Event</th>
                  <th className="pb-3">User Node</th>
                  <th className="pb-3 w-80">Details</th>
                  <th className="pb-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5 text-muted-foreground font-semibold flex items-center">
                      <Calendar size={12} className="mr-1.5" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {log.user ? (
                        <div>
                          <p className="font-extrabold text-foreground">{log.user.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">System Core</span>
                      )}
                    </td>
                    <td className="py-3.5 text-muted-foreground truncate max-w-xs">{log.details}</td>
                    <td className="py-3.5 text-right text-slate-400 font-medium">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
