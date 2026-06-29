'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Building, Stethoscope, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface RegisterFormProps {
  plans: Plan[];
}

export default function RegisterForm({ plans }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !clinicName || !specialty || !planId) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'DOCTOR',
          clinicName,
          specialty,
          planId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Chamber registered successfully! Onboarding...');

      // Auto login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        document.cookie = 'mock_role=; path=/; max-age=0';
        router.push('/doctor');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Create Chamber</h2>
        <p className="text-sm text-slate-400 mt-2">Sign up as a Doctor to launch your digital clinic portal.</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/10 text-xs font-medium text-teal-400 animate-pulse">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@clinicsuite.ai"
                className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Specialty */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Specialty</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Stethoscope size={14} />
              </span>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiologist"
                className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Chamber Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chamber Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Building size={14} />
              </span>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Metro Heart Care"
                className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Subscription Tier */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Subscription Tier</label>
            <select
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-white/10 rounded-xl bg-slate-900 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer h-[34px]"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id} className="bg-slate-900">
                  {plan.name} (₹{plan.price}/mo)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-teal-500/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-4 animate-pulse-once"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Provisioning Chamber...</span>
            </>
          ) : (
            <span>Register & Start Trial</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5">
        Already have a chamber?{' '}
        <Link href="/login" className="font-bold text-teal-400 hover:underline cursor-pointer">
          Sign In
        </Link>
      </div>
    </div>
  );
}
