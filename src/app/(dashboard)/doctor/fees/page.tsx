'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Clock, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Fee {
  id: string;
  appointmentType: string;
  amount: number;
  currency: string;
}

export default function FeesPage() {
  // Base Profile state
  const [baseFee, setBaseFee] = useState(0);
  const [slotDuration, setSlotDuration] = useState(15);
  const [specialty, setSpecialty] = useState('');
  
  // Custom Fees state
  const [customFees, setCustomFees] = useState<Fee[]>([]);
  
  // Loaders & Alerts
  const [loading, setLoading] = useState(true);
  const [savingBase, setSavingBase] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Custom Fee State
  const [newType, setNewType] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Profile
      const profileRes = await fetch('/api/doctor/profile');
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.doctor) {
        setBaseFee(profileData.doctor.consultationFee);
        setSlotDuration(profileData.doctor.slotDuration);
        setSpecialty(profileData.doctor.specialty);
      }

      // 2. Fetch Custom Fees
      const feesRes = await fetch('/api/doctor/fees');
      const feesData = await feesRes.json();
      if (feesRes.ok && feesData.fees) {
        setCustomFees(feesData.fees);
      }
    } catch (err) {
      console.error('Error fetching fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBase(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationFee: baseFee,
          slotDuration: slotDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update base settings');

      setBaseFee(data.doctor.consultationFee);
      setSlotDuration(data.doctor.slotDuration);
      setSuccessMsg('Base fees and slot settings saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSavingBase(false);
    }
  };

  const handleAddCustomFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType || !newAmount) return;
    setAddingCustom(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentType: newType,
          amount: newAmount,
          currency: 'INR',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create fee tier');

      setCustomFees([...customFees, data.fee].sort((a, b) => a.amount - b.amount));
      setNewType('');
      setNewAmount('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setAddingCustom(false);
    }
  };

  const handleDeleteCustomFee = async (id: string) => {
    try {
      const res = await fetch(`/api/doctor/fees?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete fee tier');
      }
      setCustomFees(customFees.filter((f) => f.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Fees & Slot Duration</h1>
        <p className="text-muted-foreground mt-1">Manage consultation fee structures, session slot intervals, and custom procedure rates.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Base settings */}
          <div className="p-6 rounded-3xl border border-border bg-card h-fit">
            <div className="flex items-center space-x-2 pb-4 border-b border-border mb-6">
              <Clock className="text-primary" size={20} />
              <h2 className="text-lg font-bold">Base Consultation Settings</h2>
            </div>

            <form onSubmit={handleSaveBase} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Specialty</label>
                <input
                  type="text"
                  disabled
                  value={specialty}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/30 text-muted-foreground focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">Specialty is configured in profile settings.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Regular Consultation Fee (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                    <IndianRupee size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    value={baseFee}
                    onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)}
                    placeholder="500"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Appointment Slot Duration (minutes)</label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes (Standard)</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <p className="text-[10px] text-muted-foreground">Changes to slot duration affect how new time slots are generated.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingBase}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {savingBase && <Loader2 size={16} className="animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Custom Tiers */}
          <div className="p-6 rounded-3xl border border-border bg-card flex flex-col h-fit">
            <div className="flex items-center space-x-2 pb-4 border-b border-border mb-6">
              <IndianRupee className="text-primary" size={20} />
              <h2 className="text-lg font-bold">Custom Fee Tiers</h2>
            </div>

            {/* Custom Fee Form */}
            <form onSubmit={handleAddCustomFee} className="space-y-3 mb-6 p-4 rounded-2xl bg-secondary/40 border border-border">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Appointment Type / Procedure</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regular Follow-up, Report Review"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="200"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={addingCustom}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {addingCustom ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                <span>Add Fee Tier</span>
              </button>
            </form>

            {/* Tiers List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Custom Rates</h3>
              {customFees.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-6">No custom rates configured. Using base consultation fee.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {customFees.map((fee) => (
                    <div key={fee.id} className="p-3.5 rounded-2xl border border-border bg-secondary/30 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{fee.appointmentType}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Currency: {fee.currency}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">₹{fee.amount}</span>
                        <button
                          onClick={() => handleDeleteCustomFee(fee.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Rate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
