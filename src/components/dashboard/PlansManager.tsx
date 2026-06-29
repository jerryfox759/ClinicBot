'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Award, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  maxAppointments: number;
  maxDoctors: number;
  features: string[];
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('1');
  const [maxApps, setMaxApps] = useState('1000');
  const [maxDocs, setMaxDocs] = useState('3');
  const [featureStr, setFeatureStr] = useState(''); // comma separated

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (res.ok && data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setAdding(true);
    setError('');
    setSuccess('');

    const featuresList = featureStr
      ? featureStr.split(',').map((f) => f.trim()).filter(Boolean)
      : ['Basic Scheduler'];

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          durationMonths: duration,
          maxAppointments: maxApps,
          maxDoctors: maxDocs,
          features: featuresList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create plan');

      setPlans([...plans, data.plan].sort((a, b) => a.price - b.price));
      setName('');
      setPrice('');
      setFeatureStr('');
      setSuccess('Pricing plan created successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete plan');
      }
      setPlans(plans.filter((p) => p.id !== id));
      setSuccess('Pricing plan removed successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Plans List */}
      <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card flex flex-col">
        <div className="flex items-center space-x-2 pb-4 border-b border-border mb-4">
          <Award className="text-primary" size={20} />
          <h2 className="text-lg font-bold">Subscription Tiers</h2>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold mb-3 border border-teal-500/10 flex items-center space-x-1.5">
            <CheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold mb-3 border border-destructive/10 flex items-center space-x-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center my-auto">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-10 text-center my-auto">No plans defined yet.</p>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 rounded-2xl border border-border bg-secondary/20 hover:bg-secondary/45 transition-all hover-card-trigger flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-foreground">{plan.name}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                      {plan.durationMonths}m
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>Limit: {plan.maxAppointments} Appointments</span>
                    <span>•</span>
                    <span>Max Doctors: {plan.maxDoctors}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-sm mt-1">
                    Features: <span className="font-normal text-muted-foreground">{(plan.features || []).join(', ')}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-base font-extrabold text-indigo-500">₹{plan.price}</span>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deletingId === plan.id}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Plan"
                  >
                    {deletingId === plan.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Plan Form */}
      <div className="p-6 rounded-3xl border border-border bg-card flex flex-col h-fit">
        <div className="flex items-center space-x-2 pb-4 border-b border-border mb-4">
          <Plus className="text-primary" size={20} />
          <h2 className="text-lg font-bold">Create Pricing Tier</h2>
        </div>

        <form onSubmit={handleAddPlan} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Growth Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Price (₹)</label>
            <input
              type="number"
              required
              placeholder="49"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Appointments Cap</label>
              <input
                type="number"
                value={maxApps}
                onChange={(e) => setMaxApps(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Max Doctors</label>
              <input
                type="number"
                value={maxDocs}
                onChange={(e) => setMaxDocs(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Features (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. WhatsApp Bot, Recharts analytics"
              value={featureStr}
              onChange={(e) => setFeatureStr(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={adding || !name || !price}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
            <span>Create Plan</span>
          </button>
        </form>
      </div>
    </div>
  );
}
