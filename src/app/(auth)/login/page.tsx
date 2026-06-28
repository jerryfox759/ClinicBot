'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Stethoscope, UserCog, Mail, Lock, HeartPulse, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success - cookie is set by server
      // Redirect to correct page based on role
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: string) => {
    let targetEmail = '';
    let targetPassword = '';

    if (role === 'SUPER_ADMIN') {
      targetEmail = 'admin@clinicbot.ai';
      targetPassword = 'AdminPass123';
    } else if (role === 'DOCTOR') {
      targetEmail = 'doctor@clinicbot.ai';
      targetPassword = 'DoctorPass123';
    } else if (role === 'RECEPTIONIST') {
      targetEmail = 'receptionist@clinicbot.ai';
      targetPassword = 'ReceptionistPass123';
    }

    setEmail(targetEmail);
    setPassword(targetPassword);
    setError('');
    setLoading(true);

    // Call submit directly
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password: targetPassword }),
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Login failed');
        
        // Remove override role selection cookie on fresh login
        document.cookie = 'mock_role=; path=/; max-age=0';
        
        router.push('/');
        router.refresh();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Pane - Brand Pitch */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-slate-900 via-teal-950 to-indigo-950 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />

        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-primary">
            <HeartPulse size={28} className="text-teal-400" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight block">ClinicBot AI</span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Multi-Tenant Doctor Chamber SaaS</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="space-y-6 max-w-md my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Automate Appointments via WhatsApp & Gemini AI
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            ClinicBot AI enables doctors to manage schedules and let patients book, reschedule, or cancel consultations effortlessly through WhatsApp.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gemini 2.5 Flash Engine</h4>
                <p className="text-xs text-slate-400 mt-0.5">Understands multilingual patient conversations naturally.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Token & Queue Control</h4>
                <p className="text-xs text-slate-400 mt-0.5">Direct reception console to print tokens and handle check-ins.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-slate-400">
          ClinicBot AI Chamber Platform © {new Date().getFullYear()} — Production Ready.
        </div>
      </div>

      {/* Right Pane - Form & Demo Personas */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-2">Enter credentials or choose a quick-access demo persona.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinicbot.ai"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Login Grid */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick-access Demo Personas</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('SUPER_ADMIN')}
                className="p-3.5 border border-border bg-card hover:bg-secondary rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer hover:border-teal-500/30"
              >
                <Shield size={18} className="text-amber-500" />
                <span className="text-[10px] font-bold text-foreground leading-none">Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('DOCTOR')}
                className="p-3.5 border border-border bg-card hover:bg-secondary rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer hover:border-teal-500/30"
              >
                <Stethoscope size={18} className="text-teal-500" />
                <span className="text-[10px] font-bold text-foreground leading-none">Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('RECEPTIONIST')}
                className="p-3.5 border border-border bg-card hover:bg-secondary rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer hover:border-teal-500/30"
              >
                <UserCog size={18} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-foreground leading-none">Receptionist</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
