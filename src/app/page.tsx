import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import Link from 'next/link';
import {
  HeartPulse,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  ChevronRight,
  Sparkles,
  ArrowRight,
  IndianRupee
} from 'lucide-react';

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let user = null;

  if (token) {
    user = await verifyJWT(token);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500 selection:text-slate-950 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
              <HeartPulse size={24} />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block">ClinicSuite</span>
              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">Multi-Tenant Chamber SaaS</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-all">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-all">Pricing</Link>
            {user ? (
              <Link
                href={user.role === 'SUPER_ADMIN' ? '/admin' : user.role === 'DOCTOR' ? '/doctor' : '/receptionist'}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/15 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer">Sign In</Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/15 cursor-pointer"
                >
                  Start Free Trial
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center space-y-8 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 backdrop-blur-md">
          <Sparkles size={12} className="text-amber-400" />
          <span>Next-Generation Chamber Management Platform</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Modernize Your Clinic Operations & Manage <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">Chambers Smarter</span>
        </h1>

        <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one multi-tenant SaaS for private practitioners and polyclinics. Handle doctor rosters, receptionist walk-ins, digital prescriptions, and bills securely in one integrated platform.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 flex items-center space-x-2 cursor-pointer"
          >
            <span>Get Started For Free</span>
            <ChevronRight size={16} />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>Sign In to Chamber</span>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Complete Chamber Administration</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Everything your doctors and receptionists need to manage schedules, patients, and billing workflows.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Calendar */}
          <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all hover:border-teal-500/20">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl w-fit text-teal-400 mb-5">
              <Calendar size={22} />
            </div>
            <h3 className="text-lg font-bold mb-2">Doctor Schedules & Roster</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan custom appointment intervals, manage shifts, select active days, and schedule holidays seamlessly.
            </p>
          </div>

          {/* Reception Console */}
          <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all hover:border-teal-500/20">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-fit text-indigo-400 mb-5">
              <Users size={22} />
            </div>
            <h3 className="text-lg font-bold mb-2">Receptionist Desk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Book walk-in clinics, print patient queue tokens, check patient details, and manage billing statuses dynamically.
            </p>
          </div>

          {/* Prescriptions */}
          <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all hover:border-teal-500/20">
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl w-fit text-pink-400 mb-5">
              <FileText size={22} />
            </div>
            <h3 className="text-lg font-bold mb-2">Prescription & Medical Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Write electronic prescriptions during patient check-ups. Keep structured diagnosis records, advice, and medication details.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Flexible SaaS Pricing Plans</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Simple monthly subscriptions with no hidden fees. Start with a free tier or upgrade for advanced multi-doctor polyclinics.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/40 relative flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-wider">Free Starter</span>
              <h3 className="text-xl font-extrabold mt-4">Solo Chamber</h3>
              <p className="text-xs text-slate-400 mt-1">Perfect for independent private chambers.</p>

              <div className="my-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-slate-400 ml-1">/ month</span>
              </div>

              <ul className="space-y-3 border-t border-white/5 pt-6 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>1 Doctor Profile / Clinic</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Up to 100 Appointments / month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Receptionist Console & Token Print</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Electronic Prescriptions</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl text-center transition-all block cursor-pointer"
            >
              Onboard Chamber
            </Link>
          </div>

          {/* Paid Growth Plan */}
          <div className="p-8 rounded-3xl border border-teal-500/25 bg-gradient-to-b from-teal-950/20 to-slate-900/40 relative flex flex-col justify-between shadow-xl shadow-teal-500/5">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-teal-500 text-slate-950 rounded-full text-[9px] font-bold uppercase tracking-wider">
              Popular
            </div>
            <div>
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[10px] font-bold text-teal-400 uppercase tracking-wider">Growth Plan</span>
              <h3 className="text-xl font-extrabold mt-4">Polyclinic Chamber</h3>
              <p className="text-xs text-slate-400 mt-1">Designed for busy multi-doctor chambers and small hospitals.</p>

              <div className="my-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-teal-400">₹49</span>
                <span className="text-xs text-slate-400 ml-1">/ month</span>
              </div>

              <ul className="space-y-3 border-t border-teal-500/10 pt-6 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Up to 3 Doctors per Chamber</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Up to 1,000 Appointments / month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Premium Assistant Module</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-teal-400" />
                  <span>Analytics Reports & MRR logs</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl text-center transition-all block cursor-pointer"
            >
              Start 30-Day Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6">
          <p className="mb-2">ClinicSuite SaaS Chamber platform — Ready to sell and license globally.</p>
          <p>© {new Date().getFullYear()} ClinicSuite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
