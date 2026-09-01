import { useEffect, useState } from 'react';
import { Home, Shirt, ScanLine, ShoppingBag, User, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

export type Tab = 'home' | 'closet' | 'buy' | 'scanner' | 'body' | 'settings';

interface MobileFrameProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'buy', label: 'Buy', icon: ShoppingBag },
  { id: 'scanner', label: 'Scanner', icon: ScanLine },
  { id: 'body', label: 'Body', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileFrame({ active, onNavigate, children }: MobileFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F2EE] p-0 sm:p-6">
      {/* Desktop ambient background */}
      <div className="pointer-events-none fixed inset-0 hidden sm:block">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-stone-700/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-stone-600/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(120,113,108,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Phone frame */}
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#FAF8F5] shadow-2xl shadow-stone-700/10 sm:h-[860px] sm:max-h-[90vh] sm:w-[420px] sm:rounded-[2.5rem] sm:border sm:border-[#C4BDB3]/50 sm:ring-1 sm:ring-stone-700/20">
        {/* Notch (desktop only) */}
        <div className="absolute left-1/2 top-0 z-50 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#FAF8F5] sm:block" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pb-1 pt-3 font-mono text-[10px] text-stone-400 sm:pt-5">
          <span>{time || '--:--'}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-600" />
            <span className="tracking-widest">NEFITTY</span>
            <span className="h-1.5 w-1.5 rounded-full bg-stone-600" />
          </span>
        </div>

        {/* Content area */}
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden pb-20">
          {children}
        </div>

        {/* Bottom dock */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 border-t border-[#D6D0C8]/80 bg-[#FAF8F5]/90 backdrop-blur-xl">
          <div className="flex items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="group relative flex flex-1 flex-col items-center gap-1 py-1.5"
                >
                  {isActive && (
                    <span className="absolute -top-2 h-0.5 w-8 rounded-full bg-stone-600 shadow-[0_0_8px_rgba(120,113,108,0.8)]" />
                  )}
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive
                        ? 'text-stone-600'
                        : 'text-stone-400 group-hover:text-stone-500'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`font-mono text-[9px] uppercase tracking-wider transition-colors ${
                      isActive ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
