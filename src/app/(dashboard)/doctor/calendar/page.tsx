'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Filter, HeartPulse, Loader2, Phone } from 'lucide-react';

interface Appointment {
  id: string;
  appointmentNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  reasonForVisit: string;
  tokenNumber: number;
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
  };
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/appointments?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Error fetching calendar appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredAppointments = appointments.filter(
    (app) => statusFilter === 'ALL' || app.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Calendar Agenda</h1>
          <p className="text-muted-foreground mt-1">Review appointment slots, timing streams, and patient queues.</p>
        </div>

        {/* Date controls */}
        <div className="flex items-center space-x-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm self-start">
          <button
            onClick={() => handleNavigateDate(-1)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="relative flex items-center px-2">
            <CalendarIcon size={14} className="text-muted-foreground mr-2 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleNavigateDate(1)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
          >
            TODAY
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="p-5 rounded-3xl border border-border bg-card h-fit space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <Filter size={16} className="text-primary" />
            <h3 className="text-sm font-bold">Agenda Filters</h3>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status Type</span>
            {['ALL', 'BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Appointment Agenda Stream */}
        <div className="lg:col-span-3 p-6 rounded-3xl border border-border bg-card min-h-[400px] flex flex-col">
          <div className="pb-4 border-b border-border mb-6">
            <h3 className="text-base font-bold">
              Schedule for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>

          {loading ? (
            <div className="my-auto py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="my-auto py-16 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <HeartPulse size={20} />
              </div>
              <p className="text-sm font-semibold">No appointments match selected filter.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Change filters or date navigation to inspect slots.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-border hover:border-teal-500/20 bg-secondary/20 hover:bg-secondary/40 hover-card-trigger transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary flex flex-col items-center justify-center min-w-[56px] h-14">
                      <Clock size={16} />
                      <span className="text-xs font-bold mt-1">{app.timeSlot}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-foreground">{app.patient.name}</span>
                        <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground text-[9px] font-bold rounded">
                          Token #{app.tokenNumber}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                        <span>Age: {app.patient.age} y</span>
                        <span>•</span>
                        <span>Gender: {app.patient.gender}</span>
                        <span>•</span>
                        <span className="flex items-center text-[10px]">
                          <Phone size={10} className="mr-1" />
                          {app.patient.phone}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/80 mt-2 font-medium">Reason: <span className="text-muted-foreground font-normal">{app.reasonForVisit}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                      app.status === 'CHECKED_IN' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                      app.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
