'use client';

import { useState, useEffect } from 'react';
import { Ticket, CheckSquare, XCircle, Clock, Calendar, Search, Loader2, Printer, RefreshCw } from 'lucide-react';

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
    id: string;
    user: {
      name: string;
    };
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function ReceptionistQueuePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  
  // Date parameter (Default today)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Reschedule Modal State
  const [rescheduleApp, setRescheduleApp] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Print Token Modal State
  const [printApp, setPrintApp] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, query]);

  useEffect(() => {
    if (rescheduleApp && rescheduleDate) {
      loadRescheduleSlots();
    }
  }, [rescheduleApp, rescheduleDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/appointments?date=${selectedDate}&query=${query}`);
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

  const loadRescheduleSlots = async () => {
    if (!rescheduleApp) return;
    setLoadingSlots(true);
    setSelectedRescheduleSlot('');
    try {
      const res = await fetch(`/api/receptionist/slots?doctorId=${rescheduleApp.doctor.id}&date=${rescheduleDate}`);
      const data = await res.json();
      if (res.ok && data.slots) {
        setRescheduleSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh Queue
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApp || !rescheduleDate || !selectedRescheduleSlot) return;
    setSavingReschedule(true);

    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: rescheduleApp.id,
          date: rescheduleDate,
          timeSlot: selectedRescheduleSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRescheduleApp(null);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Error rescheduling');
    } finally {
      setSavingReschedule(false);
    }
  };

  // Stats calculations
  const totalCount = appointments.length;
  const checkedInCount = appointments.filter((a) => a.status === 'CHECKED_IN').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
  const pendingCount = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      {/* Print Slip Style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-token-area, #print-token-area * {
            visibility: visible;
          }
          #print-token-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Receptionist Console</h1>
          <p className="text-muted-foreground mt-1">Book patients, print token tickets, check-in, and manage daily queue schedules.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
          />
          <button
            onClick={fetchAppointments}
            className="p-2 rounded-xl bg-secondary hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-5">
        <div className="p-4 rounded-2xl border border-border bg-card">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Today's Queue</span>
          <h3 className="text-2xl font-extrabold mt-1">{totalCount}</h3>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
          <h3 className="text-2xl font-extrabold text-indigo-500 mt-1">{checkedInCount}</h3>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Queue</span>
          <h3 className="text-2xl font-extrabold text-amber-500 mt-1">{pendingCount}</h3>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <h3 className="text-2xl font-extrabold text-teal-500 mt-1">{completedCount}</h3>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled</span>
          <h3 className="text-2xl font-extrabold text-destructive mt-1">{cancelledCount}</h3>
        </div>
      </div>

      {/* Queue Listing & Filters */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search patients by name, phone, or appointment number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
              <Ticket size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold">No appointments scheduled for this date.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Click 'Walk-in Booking' in the sidebar to book a walk-in patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 w-16">Token</th>
                  <th className="pb-3">Patient Details</th>
                  <th className="pb-3 w-28">Doctor</th>
                  <th className="pb-3 w-24">Slot Time</th>
                  <th className="pb-3 w-28">Status</th>
                  <th className="pb-3 w-64 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5 font-bold">#{app.tokenNumber}</td>
                    <td className="py-3.5">
                      <p className="font-extrabold text-foreground">{app.patient.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {app.patient.gender} ({app.patient.age}y) • {app.patient.phone}
                      </p>
                    </td>
                    <td className="py-3.5 text-muted-foreground font-medium">{app.doctor.user.name}</td>
                    <td className="py-3.5 text-muted-foreground font-semibold">{app.timeSlot}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        app.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                        app.status === 'CHECKED_IN' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                        app.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1.5">
                      {/* Check In Action */}
                      {app.status === 'BOOKED' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CHECKED_IN')}
                          className="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                      )}

                      {/* Complete action (only if checked in) */}
                      {app.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="px-2 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {/* Reschedule trigger */}
                      {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setRescheduleApp(app);
                            setRescheduleDate(selectedDate);
                          }}
                          className="px-2 py-1 bg-secondary text-muted-foreground hover:text-foreground text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Reschedule
                        </button>
                      )}

                      {/* Print Slip */}
                      <button
                        onClick={() => setPrintApp(app)}
                        className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Printer size={10} />
                        <span>Print</span>
                      </button>

                      {/* Cancel action */}
                      {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer inline-block align-middle"
                          title="Cancel Appointment"
                        >
                          <XCircle size={14} />
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

      {/* Reschedule Modal Overlay */}
      {rescheduleApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold pb-2 border-b border-border">Reschedule Appointment</h3>
            <p className="text-xs text-muted-foreground mt-1">Patient: {rescheduleApp.patient.name} (Current: {rescheduleApp.timeSlot})</p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Available Slots</label>
                {loadingSlots ? (
                  <div className="py-6 flex justify-center"><Loader2 size={16} className="animate-spin text-primary" /></div>
                ) : rescheduleSlots.filter(s => s.available).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No free slots on selected date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
                    {rescheduleSlots.filter(s => s.available).map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedRescheduleSlot(slot.time)}
                        className={`py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedRescheduleSlot === slot.time
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-secondary/35 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRescheduleApp(null)}
                  className="w-1/2 py-2 border border-border hover:bg-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReschedule || !selectedRescheduleSlot}
                  className="w-1/2 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingReschedule && <Loader2 size={12} className="animate-spin" />}
                  <span>Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Token Modal Overlay */}
      {printApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Printable Receipt Card */}
            <div id="print-token-area" className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-secondary/10 flex flex-col items-center text-center space-y-4">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Appointment Slip</h4>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight mt-1">CB-CLINIC CHAMBER</h2>
              </div>

              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-primary leading-none uppercase">Token</span>
                <span className="text-3xl font-black text-primary mt-1">#{printApp.tokenNumber}</span>
              </div>

              <div className="w-full text-xs space-y-1.5 border-t border-b border-border/80 py-3 text-left">
                <div className="flex justify-between"><span className="text-slate-400">Appointment No:</span><span className="font-semibold">{printApp.appointmentNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Patient:</span><span className="font-semibold">{printApp.patient.name} ({printApp.patient.age}y / {printApp.patient.gender.substring(0,1)})</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-semibold">{printApp.patient.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Doctor:</span><span className="font-semibold">{printApp.doctor.user.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Slot Time:</span><span className="font-semibold">{printApp.timeSlot}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="font-semibold">{new Date(printApp.date).toLocaleDateString()}</span></div>
              </div>

              <p className="text-[10px] text-muted-foreground italic">Please present this slip at the chamber desk.</p>
            </div>

            <div className="flex space-x-3 mt-5">
              <button
                onClick={() => setPrintApp(null)}
                className="w-1/2 py-2 border border-border hover:bg-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Token</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
