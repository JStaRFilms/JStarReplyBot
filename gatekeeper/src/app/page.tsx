'use client';

import { useState, useEffect } from 'react';
import type { Stats, LogEntry } from '@/lib/logger';

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/logs?t=' + Date.now());
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };

    // Initial fetch
    fetchStats();

    // Poll every 2 seconds
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="z-10 w-full max-w-4xl space-y-12 mt-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold tracking-widest uppercase animate-pulse">
            System Operational
          </div>
          <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-br from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
            JStar Gatekeeper
          </h1>
          <p className="text-zinc-500 text-sm">Secure API Proxy & Licensing Engine</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Success Rate */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Success Rate</div>
            <div className="text-5xl font-light tracking-tight text-white">
              {stats ? `${stats.successRate}%` : '--%'}
            </div>
            <div className="text-emerald-500 text-xs font-medium">Build v1.2.0</div>
          </div>

          {/* Total Requests */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Total Requests</div>
            <div className="text-5xl font-light tracking-tight text-white">
              {stats ? stats.totalRequests : '--'}
            </div>
            <div className="text-zinc-500 text-xs font-medium">Since Last Restart</div>
          </div>

          {/* Failures */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Failures</div>
            <div className={`text-5xl font-light tracking-tight ${stats && stats.failCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {stats ? stats.failCount : '--'}
            </div>
            <div className="text-zinc-500 text-xs font-medium">Global Errors</div>
          </div>
        </div>

        {/* Live Logs Table */}
        <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Live Request Feed</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-zinc-500">Real-time</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/5 text-zinc-300 font-medium">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3 text-right">Model / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-zinc-500 text-xs font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.type === 'chat' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {log.status === 'ok' ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 text-xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">
                      {log.latencyMs}ms
                    </td>
                    <td className="px-6 py-3 text-right">
                      {log.error ? (
                        <span
                          title={log.error}
                          className="text-rose-400 text-xs truncate max-w-[150px] block ml-auto cursor-help decoration-dotted underline underline-offset-2 decoration-rose-400/30"
                        >
                          {log.error}
                        </span>
                      ) : (
                        <span
                          title={log.model || ''}
                          className="text-zinc-500 text-xs truncate max-w-[150px] block ml-auto cursor-default"
                        >
                          {log.model || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats || stats.logs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-600 italic">
                      Waiting for requests...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-700 pb-8">
          <p>Protected by JStar Security Systems</p>
        </div>
      </div>
    </div>
  );
}
