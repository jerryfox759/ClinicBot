'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, LogOut, ChevronDown, Shield, Stethoscope, UserCog } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface TopbarProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };
  activeRole: string;
}

export default function Topbar({ user, activeRole }: TopbarProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        // Clear client side local storage if any
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleRoleSwitch = (targetRole: string) => {
    // Set cookie
    document.cookie = `mock_role=${targetRole}; path=/; max-age=604800`;
    setShowRoleMenu(false);
    
    // Redirect to correct dashboard
    if (targetRole === 'SUPER_ADMIN') router.push('/admin');
    else if (targetRole === 'DOCTOR') router.push('/doctor');
    else if (targetRole === 'RECEPTIONIST') router.push('/receptionist');
    
    router.refresh();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Shield size={16} className="text-amber-500" />;
      case 'DOCTOR':
        return <Stethoscope size={16} className="text-teal-500" />;
      case 'RECEPTIONIST':
        return <UserCog size={16} className="text-indigo-500" />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'DOCTOR': return 'Doctor';
      case 'RECEPTIONIST': return 'Receptionist';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Search Bar */}
      <div className="relative w-64 max-w-xs md:max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Quick search patients or slots..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* DEV Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 border border-border rounded-xl hover:bg-secondary transition-all text-xs font-semibold text-foreground cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              {getRoleIcon(activeRole)}
              <span>View: {getRoleLabel(activeRole)}</span>
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          
          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Select Demo Persona
                </div>
                <button
                  onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                  className={`w-full flex items-center space-x-2 px-2 py-2 text-xs rounded-xl hover:bg-secondary cursor-pointer ${
                    activeRole === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <Shield size={14} className="text-amber-500" />
                  <span>Super Admin</span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('DOCTOR')}
                  className={`w-full flex items-center space-x-2 px-2 py-2 text-xs rounded-xl hover:bg-secondary cursor-pointer ${
                    activeRole === 'DOCTOR' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <Stethoscope size={14} className="text-teal-500" />
                  <span>Doctor</span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('RECEPTIONIST')}
                  className={`w-full flex items-center space-x-2 px-2 py-2 text-xs rounded-xl hover:bg-secondary cursor-pointer ${
                    activeRole === 'RECEPTIONIST' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <UserCog size={14} className="text-indigo-500" />
                  <span>Receptionist</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-secondary hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer relative"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">1 New</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <div className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-all">
                    <p className="text-xs font-semibold text-foreground">Welcome to ClinicBot AI!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Your multi-tenant chamber management console is initialized.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-secondary transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-border mb-2">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer transition-all"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
