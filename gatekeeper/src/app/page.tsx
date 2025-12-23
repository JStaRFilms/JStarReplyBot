export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
            System Operational
          </div>
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            JStar Gatekeeper
          </h1>
          <p className="text-zinc-500 text-sm">Secure API Proxy & Licensing Engine</p>
        </div>

        {/* Status Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-zinc-400 text-sm">Status</span>
            <span className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              Online
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Region</span>
              <span className="text-zinc-300">Global (Edge)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Latency</span>
              <span className="text-zinc-300">~45ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Uptime</span>
              <span className="text-zinc-300">99.9%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-700">
          <p>Protected by JStar Security Systems</p>
          <p className="mt-1">v1.2.0 • build_2025-12-21</p>
        </div>
      </div>
    </div>
  );
}
