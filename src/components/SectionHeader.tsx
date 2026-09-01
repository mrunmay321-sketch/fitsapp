import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/30 bg-stone-700/10 text-stone-600">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-stone-800">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-stone-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
