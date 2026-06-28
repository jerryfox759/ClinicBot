'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Search, Loader2 } from 'lucide-react';

interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  plan: {
    name: string;
    price: number;
  };
  doctor: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (res.ok && data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update state
      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === id ? { ...sub, status: data.subscription.status } : sub
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingId('');
    }
  };

  const filteredSubs = subscriptions.filter(
    (sub) =>
      sub.doctor.user.name.toLowerCase().includes(query.toLowerCase()) ||
      sub.doctor.user.email.toLowerCase().includes(query.toLowerCase()) ||
      sub.plan.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Subscriptions Logs</h1>
          <p className="text-muted-foreground mt-1">Review active, expired, or cancelled doctor subscriptions and manage SaaS access tokens.</p>
        </div>

        {/* Search */}
        <div className="relative w-64 max-w-xs self-start">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search subscriptions..."
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
        ) : filteredSubs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CreditCard size={20} />
            </div>
            <p className="text-sm font-semibold">No subscriptions logged.</p>
            <p className="text-xs text-muted-foreground mt-0.5">SaaS subscriptions register automatically when doctors sign up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Doctor / Clinic</th>
                  <th className="pb-3">SaaS Tier Plan</th>
                  <th className="pb-3">Expiry Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5">
                      <p className="font-extrabold text-foreground">{sub.doctor.user.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.doctor.user.email}</p>
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-muted-foreground">{sub.plan.name}</p>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">${sub.plan.price}/month</p>
                    </td>
                    <td className="py-3.5 text-muted-foreground font-semibold">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        sub.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                        sub.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      {sub.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(sub.id, 'ACTIVE')}
                          disabled={updatingId === sub.id}
                          className="px-2 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold rounded hover:bg-teal-500/20 cursor-pointer disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      {sub.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleUpdateStatus(sub.id, 'CANCELLED')}
                          disabled={updatingId === sub.id}
                          className="px-2 py-1 bg-destructive/10 text-destructive text-[10px] font-bold rounded hover:bg-destructive/20 cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {sub.status !== 'EXPIRED' && (
                        <button
                          onClick={() => handleUpdateStatus(sub.id, 'EXPIRED')}
                          disabled={updatingId === sub.id}
                          className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded hover:bg-amber-500/20 cursor-pointer disabled:opacity-50"
                        >
                          Expire
                        </button>
                      )}
                    </td>
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
