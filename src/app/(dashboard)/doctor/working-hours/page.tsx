'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';

interface WorkingDay {
  id: string;
  dayOfWeek: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export default function WorkingHoursPage() {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Holiday Form State
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');

  useEffect(() => {
    fetchWorkingDays();
    fetchHolidays();
  }, []);

  const fetchWorkingDays = async () => {
    try {
      const res = await fetch('/api/doctor/working-hours');
      const data = await res.ok ? await res.json() : null;
      if (data && data.workingDays) {
        setWorkingDays(data.workingDays);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/doctor/holidays');
      const data = await res.ok ? await res.json() : null;
      if (data && data.holidays) {
        setHolidays(data.holidays);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleDayToggle = (id: string) => {
    setWorkingDays(
      workingDays.map((day) =>
        day.id === id ? { ...day, isWorking: !day.isWorking } : day
      )
    );
  };

  const handleTimeChange = (id: string, field: keyof WorkingDay, value: string) => {
    setWorkingDays(
      workingDays.map((day) =>
        day.id === id ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/working-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule');

      setWorkingDays(data.workingDays);
      setSuccessMsg('Chamber working hours updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate) return;
    setAddingHoliday(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: holidayDate, reason: holidayReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add holiday');

      setHolidays([...holidays, data.holiday].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setHolidayDate('');
      setHolidayReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/doctor/holidays?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete holiday');
      }
      setHolidays(holidays.filter((h) => h.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Availability & Scheduling</h1>
        <p className="text-muted-foreground mt-1">Configure your weekly consulting hours, break periods, and calendar holidays.</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Working Days */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card">
          <div className="flex items-center space-x-2 pb-4 border-b border-border mb-4">
            <Clock className="text-primary" size={20} />
            <h2 className="text-lg font-bold">Weekly Consultation Hours</h2>
          </div>

          {loadingSchedule ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="divide-y divide-border/40">
                {workingDays.map((day) => (
                  <div key={day.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3 w-32">
                      <input
                        type="checkbox"
                        checked={day.isWorking}
                        onChange={() => handleDayToggle(day.id)}
                        className="w-4 h-4 text-primary bg-secondary border-border rounded focus:ring-primary focus:ring-2 cursor-pointer"
                        id={`check-${day.id}`}
                      />
                      <label htmlFor={`check-${day.id}`} className="text-sm font-semibold capitalize cursor-pointer">
                        {day.dayOfWeek.toLowerCase()}
                      </label>
                    </div>

                    {day.isWorking ? (
                      <div className="flex flex-wrap items-center gap-4 sm:flex-1 sm:justify-end">
                        {/* Hours */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Consulting:</span>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded-lg bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded-lg bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Break */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Break:</span>
                          <input
                            type="time"
                            value={day.breakStart || ''}
                            onChange={(e) => handleTimeChange(day.id, 'breakStart', e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded-lg bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={day.breakEnd || ''}
                            onChange={(e) => handleTimeChange(day.id, 'breakEnd', e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded-lg bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic sm:flex-1 sm:text-right py-1">Closed (Holiday)</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {savingSchedule && <Loader2 size={16} className="animate-spin" />}
                  <span>Save Weekly Schedule</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Holidays Section */}
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col h-fit">
          <div className="flex items-center space-x-2 pb-4 border-b border-border mb-4">
            <Calendar className="text-primary" size={20} />
            <h2 className="text-lg font-bold">Holidays Calendar</h2>
          </div>

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="space-y-3 mb-6 p-4 rounded-2xl bg-secondary/40 border border-border">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Holiday Date</label>
              <input
                type="date"
                required
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reason (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Annual Conference"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={addingHoliday}
              className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {addingHoliday ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
              <span>Add Exception Date</span>
            </button>
          </form>

          {/* Holidays List */}
          <div className="space-y-2 flex-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Upcoming Exceptions</h3>
            {loadingHolidays ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No holidays declared.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="p-3 rounded-2xl border border-border bg-secondary/30 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {new Date(holiday.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {holiday.reason && <p className="text-[10px] text-muted-foreground mt-0.5">{holiday.reason}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                      title="Delete Holiday"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
