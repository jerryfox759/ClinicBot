'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader2, Plus, X, KeyRound } from 'lucide-react';

interface Doctor {
  id: string;
  specialty: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    createdAt: string;
  };
  clinic: {
    name: string;
  };
  subscriptions: {
    plan: {
      name: string;
    };
  }[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Add Doctor Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formClinicName, setFormClinicName] = useState('');
  const [formPlanId, setFormPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchPlans();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors');
      const data = await res.json();
      if (res.ok && data.doctors) {
        setDoctors(data.doctors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (res.ok && data.plans) {
        setPlans(data.plans);
        if (data.plans.length > 0) {
          setFormPlanId(data.plans[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pass);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          specialty: formSpecialty,
          clinicName: formClinicName,
          planId: formPlanId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add doctor');
      }

      setFormSuccess('Doctor registered successfully!');
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormSpecialty('');
      setFormClinicName('');
      if (plans.length > 0) {
        setFormPlanId(plans[0].id);
      }

      fetchDoctors();

      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.user.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.user.email.toLowerCase().includes(query.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(query.toLowerCase()) ||
      doc.clinic.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Doctors Directory</h1>
          <p className="text-muted-foreground mt-1">Directory of all registered multi-tenant doctors, chambers, and subscription settings.</p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-64 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search doctors or chambers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/15 cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-border bg-card">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users size={20} />
            </div>
            <p className="text-sm font-semibold">No doctors found.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Invite new doctors to create a chamber on the platform onboarding console.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Doctor Details</th>
                  <th className="pb-3">Specialty</th>
                  <th className="pb-3">Chamber Clinic</th>
                  <th className="pb-3">Pricing Tier</th>
                  <th className="pb-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDoctors.map((doc) => {
                  const activeSub = doc.subscriptions?.[0];
                  return (
                    <tr key={doc.id} className="hover:bg-secondary/20 transition-all">
                      <td className="py-3.5">
                        <p className="font-extrabold text-foreground">{doc.user.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{doc.user.email}</p>
                      </td>
                      <td className="py-3.5 text-muted-foreground">{doc.specialty}</td>
                      <td className="py-3.5 text-muted-foreground font-semibold">{doc.clinic.name}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg">
                          {activeSub?.plan?.name || 'No Plan'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-muted-foreground font-medium">
                        {new Date(doc.user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative w-full max-w-lg p-6 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">Register New Doctor</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Create a doctor profile, initialize their chamber, and assign a pricing subscription.</p>
              </div>

              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-medium text-destructive animate-pulse">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-medium text-teal-600 dark:text-teal-400">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleAddDoctor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Dr. John Doe"
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="john.doe@clinicbot.ai"
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full pl-3 pr-8 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        title="Generate secure password"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                      >
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Specialty</label>
                    <input
                      type="text"
                      required
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="e.g. Cardiologist, Dermatologist"
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chamber/Clinic Name</label>
                    <input
                      type="text"
                      required
                      value={formClinicName}
                      onChange={(e) => setFormClinicName(e.target.value)}
                      placeholder="e.g. Metro Care Heart Clinic"
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subscription Plan</label>
                    <select
                      required
                      value={formPlanId}
                      onChange={(e) => setFormPlanId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                    >
                      <option value="" disabled>Select a plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price}/mo)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-secondary text-xs font-bold rounded-xl transition-all cursor-pointer text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/15 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Register Doctor</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

