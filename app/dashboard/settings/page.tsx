'use client';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Workspace settings</h1>
        <p className="mt-3 text-slate-400">You can expand this area later with notification preferences and branding controls.</p>
      </div>
    </div>
  );
}
