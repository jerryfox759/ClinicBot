import prisma from '@/lib/prisma';
import RegisterForm from './RegisterForm';
import { HeartPulse } from 'lucide-react';

export default async function RegisterPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { price: 'asc' },
  });

  const serializedPlans = plans.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));

  return (
    <div className="flex min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Left Pane - Brand Pitch */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-slate-900 via-teal-950 to-indigo-950 p-12 flex-col justify-between text-white relative overflow-hidden border-r border-white/5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-teal-400">
            <HeartPulse size={28} />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight block">ClinicSuite</span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Multi-Tenant Doctor Chamber SaaS</span>
          </div>
        </div>

        <div className="space-y-6 max-w-md my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Streamline Your Clinic Roster & Patient Bookings
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            ClinicSuite offers premium features to run your chamber. Setup reception, manage doctor shifts, print walk-in tokens, and write digital prescriptions in minutes.
          </p>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Self-Serve Setup</h4>
                <p className="text-xs text-slate-400 mt-0.5">Register, choose a subscription, and configure your clinic in 2 minutes.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Billing</h4>
                <p className="text-xs text-slate-400 mt-0.5">Upgrade or cancel subscriptions anytime directly inside the portal.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          ClinicSuite SaaS Chamber Platform — Ready to License.
        </div>
      </div>

      {/* Right Pane - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 z-10">
        <RegisterForm plans={serializedPlans} />
      </div>
    </div>
  );
}
