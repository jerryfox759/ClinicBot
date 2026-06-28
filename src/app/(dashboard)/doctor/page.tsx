import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DoctorCharts from '@/components/dashboard/DoctorCharts';
import { Calendar, Users, DollarSign, Clock, ArrowRight, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'DOCTOR') {
    redirect('/login');
  }

  // Fetch Doctor Profile
  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.userId },
    include: {
      clinic: true,
      appointments: {
        include: {
          patient: true,
        },
      },
    },
  });

  if (!doctor) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/10 text-destructive rounded-3xl">
        Doctor Profile not found. Please contact Administrator.
      </div>
    );
  }

  // Calculations
  const today = new Date();
  today.setHours(0,0,0,0);
  const endOfToday = new Date();
  endOfToday.setHours(23,59,59,999);

  const todayAppointments = doctor.appointments.filter(
    (app) => app.date >= today && app.date <= endOfToday
  );
  
  const completedToday = todayAppointments.filter((app) => app.status === 'COMPLETED');
  const uniquePatients = new Set(doctor.appointments.map((app) => app.patientId)).size;

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome, {user.name}</h1>
          <p className="text-muted-foreground mt-1">Chamber Console — {doctor.clinic.name}</p>
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-xl border border-border flex items-center space-x-1.5 self-start">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>WhatsApp Bot Active</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Appointments</span>
              <h2 className="text-3xl font-extrabold mt-2">{todayAppointments.length}</h2>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Slots duration: {doctor.slotDuration} mins</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Today</span>
              <h2 className="text-3xl font-extrabold mt-2">{completedToday.length}</h2>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Rate: {todayAppointments.length ? Math.round((completedToday.length / todayAppointments.length) * 100) : 0}% completion</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Fee</span>
              <h2 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">₹{doctor.consultationFee}</h2>
            </div>
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Base checkup fee tier</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients Registered</span>
              <h2 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{uniquePatients}</h2>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Unique Patient profiles in EHR</p>
        </div>
      </div>

      {/* Recharts Analytics */}
      <DoctorCharts />

      {/* Upcoming Table */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
          <div>
            <h3 className="text-base font-bold">Upcoming Appointments (Today)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time schedule queue</p>
          </div>
          <Link href="/doctor/calendar" className="flex items-center space-x-1 text-xs font-semibold text-primary hover:underline">
            <span>View Full Calendar</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <HeartPulse size={20} />
            </div>
            <p className="text-sm font-semibold">No appointments scheduled for today.</p>
            <p className="text-xs text-muted-foreground mt-0.5">WhatsApp receptionist bot is listening for incoming patient requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Patient Name</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Gender / Age</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {todayAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-secondary/30 transition-all">
                    <td className="py-3.5 font-bold">#{app.tokenNumber}</td>
                    <td className="py-3.5 font-semibold text-foreground">{app.patient.name}</td>
                    <td className="py-3.5 text-muted-foreground">{app.timeSlot}</td>
                    <td className="py-3.5 text-muted-foreground">{app.patient.gender} ({app.patient.age}y)</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                        app.status === 'CHECKED_IN' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                        app.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-muted-foreground truncate max-w-xs">{app.reasonForVisit}</td>
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
