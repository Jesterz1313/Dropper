import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-blue-500 uppercase leading-none drop-shadow-2xl">
          DROPPER
        </h1>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mt-4 mb-8">
          Drop Your Music To Everyone
        </h2>

        <Link
          href="/admin"
          className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/40 transition-all cursor-pointer"
        >
          Artist Portal →
        </Link>
      </div>

      {/* Footer Signature */}
      <div className="absolute bottom-6 right-8 text-xs font-semibold tracking-wider text-slate-500/80 uppercase z-10">
        By: Andrew Jester
      </div>
    </main>
  );
}