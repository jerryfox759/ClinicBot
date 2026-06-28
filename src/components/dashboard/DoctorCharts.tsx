'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { day: 'Mon', appointments: 4, revenue: 2000 },
  { day: 'Tue', appointments: 6, revenue: 3000 },
  { day: 'Wed', appointments: 8, revenue: 4000 },
  { day: 'Thu', appointments: 5, revenue: 2500 },
  { day: 'Fri', appointments: 7, revenue: 3500 },
  { day: 'Sat', appointments: 9, revenue: 4500 },
  { day: 'Sun', appointments: 2, revenue: 1000 },
];

export default function DoctorCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenue Area Chart */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-4">Revenue Trend (Last 7 Days)</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/10" vertical={false} />
              <XAxis dataKey="day" className="text-[10px] fill-muted-foreground" tickLine={false} />
              <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue (₹)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Appointments Bar Chart */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-4">Visits Analysis</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/10" vertical={false} />
              <XAxis dataKey="day" className="text-[10px] fill-muted-foreground" tickLine={false} />
              <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', fontSize: '12px' }} />
              <Bar dataKey="appointments" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={24} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
