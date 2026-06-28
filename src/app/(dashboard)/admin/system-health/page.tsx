'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Brain, PhoneCall, Cpu, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

interface HealthStats {
  dbStatus: string;
  dbLatencyMs: number;
  geminiStatus: string;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  whatsappApiStatus: string;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/health');
      const data = await res.json();
      if (res.ok && data.health) {
        setHealth(data.health);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch health analytics');
      }
    } catch (err) {
      setError('Connection to health API lost.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-1">Real-time status tracking of Postgres DB, Gemini AI, memory heaps, and Meta webhook APIs.</p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="px-4 py-2 bg-secondary hover:bg-muted/20 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 self-start"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>Force Refresh Check</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center space-x-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : health ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Database Health */}
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4 hover-card-trigger">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Database Status</span>
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Database size={16} /></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-lg font-extrabold">{health.dbStatus}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Postgres query speed: <span className="font-bold text-teal-600 dark:text-teal-400">{health.dbLatencyMs} ms</span></p>
            </div>
          </div>

          {/* Gemini AI Status */}
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4 hover-card-trigger">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gemini 2.5 Flash</span>
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Brain size={16} /></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-lg font-extrabold">{health.geminiStatus}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Structured JSON parses active</p>
            </div>
          </div>

          {/* Meta Webhook Status */}
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4 hover-card-trigger">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Meta Cloud API</span>
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><PhoneCall size={16} /></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-lg font-extrabold">{health.whatsappApiStatus}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Webhook subscription active</p>
            </div>
          </div>

          {/* Memory Heap Status */}
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4 hover-card-trigger">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Server Memory</span>
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Cpu size={16} /></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-lg font-extrabold">{health.memoryUsageMB} MB / {health.memoryLimitMB}MB</span>
              </div>
              <div className="w-full bg-secondary/50 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all" 
                  style={{ width: `${Math.round((health.memoryUsageMB / health.memoryLimitMB) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-6 rounded-3xl border border-border bg-card glass-panel">
        <h3 className="text-base font-bold mb-1">System Audit Metrics</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The health checker probes local Postgres latency, server node memory heaps, and WhatsApp Meta Cloud Webhook handshake statuses every 30 seconds.
        </p>
      </div>
    </div>
  );
}
