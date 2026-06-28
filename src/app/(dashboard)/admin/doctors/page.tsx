'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader2 } from 'lucide-react';

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

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchDoctors();
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

        {/* Search */}
        <div className="relative w-64 max-w-xs self-start">
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
    </div>
  );
}
