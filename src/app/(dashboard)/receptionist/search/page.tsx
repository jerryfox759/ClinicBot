'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Phone, Clock, User, XCircle, Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  appointmentNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  reasonForVisit: string;
  tokenNumber: number;
  patient: {
    name: string;
    phone: string;
    age: number;
    gender: string;
  };
  doctor: {
    user: {
      name: string;
    };
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/receptionist/appointments?query=${query}`);
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      // Update local state
      setAppointments(
        appointments.map((app) =>
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Search Bookings</h1>
        <p className="text-muted-foreground mt-1">Lookup active, historic, or cancelled appointment details by name, phone, or ID.</p>
      </div>

      <div className="p-6 rounded-3xl border border-border bg-card">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-xl">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              required
              placeholder="Enter patient name, phone number, or CB ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-border rounded-xl bg-secondary/35 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            <span>Search</span>
          </button>
        </form>

        {/* Results List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : !searched ? (
          <p className="text-xs text-muted-foreground italic text-center py-10 bg-secondary/10 border border-dashed border-border rounded-2xl">Enter patient search criteria to look up visit files.</p>
        ) : appointments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-10 bg-secondary/10 border border-dashed border-border rounded-2xl">No appointment records match search criteria.</p>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Search Results ({appointments.length})</h3>
            {appointments.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl border border-border hover:border-teal-500/20 bg-secondary/20 hover:bg-secondary/40 hover-card-trigger transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-secondary rounded-xl text-muted-foreground flex flex-col items-center justify-center min-w-[56px] h-14">
                    <Clock size={16} />
                    <span className="text-xs font-bold mt-1">{app.timeSlot}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-foreground">{app.patient.name}</span>
                      <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground text-[9px] font-bold rounded">
                        ID: {app.appointmentNumber}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center"><User size={10} className="mr-1" />{app.patient.gender} ({app.patient.age}y)</span>
                      <span>•</span>
                      <span>Phone: {app.patient.phone}</span>
                      <span>•</span>
                      <span className="flex items-center"><Calendar size={10} className="mr-1" />{new Date(app.date).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-xs text-foreground/80 mt-2 font-medium">Doctor: <span className="text-muted-foreground font-normal">{app.doctor.user.name}</span></p>
                    <p className="text-xs text-foreground/80 mt-1 font-medium">Reason: <span className="text-muted-foreground font-normal">{app.reasonForVisit}</span></p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                    app.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                    app.status === 'CHECKED_IN' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                    app.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {app.status}
                  </span>

                  {/* Cancel Button */}
                  {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                      title="Cancel Appointment"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
