'use client';

import { useState } from 'react';
import { CheckSquare, Search, Printer, CheckCircle, Loader2, AlertCircle, Calendar, Clock, User } from 'lucide-react';

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

export default function CheckInPage() {
  const [query, setQuery] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setAppointment(null);

    try {
      const res = await fetch(`/api/receptionist/appointments?query=${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.appointments && data.appointments.length > 0) {
        // Grab the closest match (e.g. first match)
        setAppointment(data.appointments[0]);
      } else {
        setErrorMsg('No matching appointment found for today. Please double check the ID or Phone.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during lookup');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!appointment) return;
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          status: 'CHECKED_IN',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAppointment(data.appointment);
      setSuccessMsg('Patient checked in successfully! Token marked as active.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update check-in status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Slip Style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-terminal-slip, #print-terminal-slip * {
            visibility: visible;
          }
          #print-terminal-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Check-in Terminal</h1>
        <p className="text-muted-foreground mt-1">Scan tokens, lookup appointment IDs, confirm patient arrivals, and print lobby tickets.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Scan & Lookup Form */}
        <div className="p-6 rounded-3xl border border-border bg-card h-fit space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <Search size={18} className="text-primary" />
            <h2 className="text-base font-bold">Lobby Scanner</h2>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scan or Type ID / Phone</label>
              <input
                type="text"
                required
                placeholder="e.g. CB-20260628-001 or +919876543210"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              <span>Find Appointment</span>
            </button>
          </form>
        </div>

        {/* Scan Result Ticket */}
        <div className="md:col-span-2 p-6 rounded-3xl border border-border bg-card flex flex-col items-center justify-center min-h-[300px]">
          {appointment ? (
            <div className="w-full max-w-sm space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              {/* Slip Card */}
              <div id="print-terminal-slip" className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-secondary/15 text-left space-y-4">
                <div className="text-center pb-2 border-b border-border mb-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arrival Token</h4>
                  <h2 className="text-4xl font-black text-primary mt-1">#{appointment.tokenNumber}</h2>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Appointment ID:</span><span className="font-semibold">{appointment.appointmentNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Patient:</span><span className="font-semibold">{appointment.patient.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Age / Gender:</span><span className="font-semibold">{appointment.patient.age}y / {appointment.patient.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-semibold">{appointment.patient.phone}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Consultant:</span><span className="font-semibold">{appointment.doctor.user.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Scheduled Time:</span><span className="font-semibold flex items-center"><Clock size={10} className="mr-1" /> {appointment.timeSlot}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="font-semibold flex items-center"><Calendar size={10} className="mr-1" /> {new Date(appointment.date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Lobby Status:</span><span className="font-bold text-teal-600 dark:text-teal-400">{appointment.status}</span></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 w-full">
                {appointment.status === 'BOOKED' && (
                  <button
                    onClick={handleCheckIn}
                    disabled={updating}
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-650 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckSquare size={14} />
                    <span>Check In</span>
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className={`py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    appointment.status === 'BOOKED' ? 'w-1/2' : 'w-full'
                  }`}
                >
                  <Printer size={12} />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                <CheckSquare size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold">Waiting for scanner input...</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scan a ticket QR or search by phone/ID to initialize lobby entry check-in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
