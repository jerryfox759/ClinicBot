'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { month: 'Jan', clinics: 1, revenue: 49 },
  { month: 'Feb', clinics: 2, revenue: 98 },
  { month: 'Mar', clinics: 4, revenue: 196 },
  { month: 'Apr', clinics: 8, revenue: 392 },
  { month: 'May', clinics: 12, revenue: 588 },
  { month: 'Jun', clinics: 15, revenue: 735 },
];

export default function AdminCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* SaaS MRR Area Chart */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Monthly Recurring Revenue (MRR)</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/10" vertical={false} />
              <XAxis dataKey="month" className="text-[10px] fill-muted-foreground" tickLine={false} />
              <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorMRR)" strokeWidth={2} name="SaaS Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinics Signup Growth Bar Chart */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Clinic Registrations Trend</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/10" vertical={false} />
              <XAxis dataKey="month" className="text-[10px] fill-muted-foreground" tickLine={false} />
              <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', fontSize: '12px' }} />
              <Bar dataKey="clinics" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} name="Active Clinics" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
