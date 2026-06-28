'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, Calendar, Clock, DollarSign, FileText, Settings, Users,
  Home, UserPlus, Search, Ticket, CheckSquare, LayoutDashboard,
  Award, Key, HeartPulse
} from 'lucide-react';

interface SidebarProps {
  activeRole: string;
}

export default function Sidebar({ activeRole }: SidebarProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (activeRole) {
      case 'SUPER_ADMIN':
        return [
          { href: '/admin', label: 'Dashboard', icon: Home },
          { href: '/admin/doctors', label: 'Manage Doctors', icon: Users },
          { href: '/admin/subscriptions', label: 'Subscriptions', icon: Award },
          { href: '/admin/revenue', label: 'Revenue Analytics', icon: DollarSign },
          { href: '/admin/system-health', label: 'System Health', icon: Activity },
          { href: '/admin/audit-logs', label: 'Audit Logs', icon: Key },
        ];
      case 'DOCTOR':
        return [
          { href: '/doctor', label: 'Dashboard', icon: Home },
          { href: '/doctor/calendar', label: 'Calendar View', icon: Calendar },
          { href: '/doctor/working-hours', label: 'Working Hours', icon: Clock },
          { href: '/doctor/fees', label: 'Consultation Fees', icon: DollarSign },
          { href: '/doctor/patients', label: 'Patient History', icon: Users },
          { href: '/doctor/medical-notes', label: 'Medical Notes', icon: FileText },
          { href: '/doctor/settings', label: 'Chamber Settings', icon: Settings },
        ];
      case 'RECEPTIONIST':
        return [
          { href: '/receptionist', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/receptionist/walk-in', label: 'Walk-in Booking', icon: UserPlus },
          { href: '/receptionist/queue', label: 'Today\'s Queue', icon: Ticket },
          { href: '/receptionist/search', label: 'Search Patients', icon: Search },
          { href: '/receptionist/check-in', label: 'Token & Check-in', icon: CheckSquare },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3 px-6 py-5 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <HeartPulse size={22} />
        </div>
        <div>
          <span className="font-extrabold text-lg text-foreground tracking-tight block">ClinicBot AI</span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Chamber Platform</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-2 py-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border bg-secondary/30">
        <div className="p-3 rounded-2xl bg-card border border-border flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
            AI
          </div>
          <span className="text-xs font-semibold text-foreground">Gemini 2.5 Flash</span>
          <span className="text-[10px] text-muted-foreground">WhatsApp Bot Active</span>
        </div>
      </div>
    </aside>
  );
}
