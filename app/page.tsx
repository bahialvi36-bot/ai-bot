import RestaurantChat from './components/restaurant-chat';

const highlights = [
  'Open daily from 11:00 AM to 10:00 PM',
  'Signature pasta, grilled seafood, and hand-crafted desserts',
  'Reservations recommended for weekend dinners',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.15),_transparent_32%),linear-gradient(135deg,_#020617,_#111827)] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-14">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-300">
                Aurora Bistro • Fine Dining, Cozy Atmosphere
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Welcome to Aurora Bistro, where every meal feels like a celebration.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Enjoy fresh seasonal plates, intimate dinner service, and a support assistant ready to help with hours, menu details, reservations, and delivery options.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:hello@aurorabistro.com" className="rounded-full bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400">
                  Contact us
                </a>
                <a href="tel:+12065550148" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-100 transition hover:bg-white/10">
                  Call now
                </a>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">What you can ask</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 rounded-2xl bg-white/5 px-3 py-3">
                    <span className="mt-1 text-amber-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <RestaurantChat />
    </div>
  );
}
