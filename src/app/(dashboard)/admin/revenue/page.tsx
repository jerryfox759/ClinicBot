import AdminCharts from '@/components/dashboard/AdminCharts';
import { DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function AdminRevenuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Revenue Analytics</h1>
        <p className="text-muted-foreground mt-1">Detailed review of SaaS recurring billing streams and invoice growth metrics.</p>
      </div>

      {/* Recharts Financials */}
      <AdminCharts />

      {/* Transaction History */}
      <div className="p-6 rounded-3xl border border-border bg-card">
        <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
          <div>
            <h3 className="text-base font-bold">Transaction History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">SaaS subscription renewals logs</p>
          </div>
          <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold flex items-center">
            <TrendingUp size={10} className="mr-1" /> Up 15% this month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3">Transaction ID</th>
                <th className="pb-3">Details</th>
                <th className="pb-3">Billing Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr className="hover:bg-secondary/20 transition-all">
                <td className="py-3.5 font-bold">#TXN-9843210-98</td>
                <td className="py-3.5">
                  <p className="font-extrabold text-foreground">Metro Care Clinic Renewal</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Doctor: Dr. Meraj Khan (Growth Plan)</p>
                </td>
                <td className="py-3.5 text-muted-foreground font-semibold">2026-06-28</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-bold rounded-full">
                    PAID
                  </span>
                </td>
                <td className="py-3.5 text-right font-extrabold text-teal-600 dark:text-teal-400">₹49.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
