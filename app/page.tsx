'use client';

import dynamic from 'next/dynamic';

// Dynamically load the main client app with SSR disabled for optimal WASM/SQLite/Client state hydration
const App = dynamic(() => import('@/src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-xs font-bold font-sans">
        بارکردنی سیستەمی بەڕێوەبردنی ستۆرج...
      </p>
    </div>
  ),
});

export default function HomePage() {
  return <App />;
}
