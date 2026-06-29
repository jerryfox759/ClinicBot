import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminCharts from '@/components/dashboard/AdminCharts';
import PlansManager from '@/components/dashboard/PlansManager';
import { Building, Users, CreditCard, IndianRupee, Activity } from 'lucide-react';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // Fetch Stats from DB
  const clinicsCount = await prisma.clinic.count();
  const doctorsCount = await prisma.doctor.count();
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true },
  });

  const activeBillingMRR = activeSubs.reduce((sum, sub) => sum + sub.plan.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">SaaS Operations</h1>
        <p className="text-muted-foreground mt-1">Manage global subscriptions, pricing tiers, audit logs, and monitor system health metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Clinics</span>
              <h2 className="text-3xl font-extrabold mt-2">{clinicsCount}</h2>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Building size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Active multi-tenant chambers</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Registered Doctors</span>
              <h2 className="text-3xl font-extrabold mt-2">{doctorsCount}</h2>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Users size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Unique doctor profile nodes</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Active Subs</span>
              <h2 className="text-3xl font-extrabold mt-2">{activeSubs.length}</h2>
            </div>
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
              <CreditCard size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Paid tenant instances</p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card hover-card-trigger">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">MRR Billing</span>
              <h2 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">₹{activeBillingMRR.toFixed(2)}</h2>
            </div>
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Recurring monthly recurring revenue</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <AdminCharts />

      {/* Subscription Pricing Plans Manager */}
      <PlansManager />
    </div>
  );
}
