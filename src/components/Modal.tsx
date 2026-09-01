import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-[#C4BDB3]/60 bg-[#FAF8F5]/95 shadow-2xl shadow-stone-700/10 backdrop-blur-xl sm:max-w-md sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D6D0C8]/80 bg-[#FAF8F5]/95 px-5 py-4 backdrop-blur-xl">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-stone-500">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-[#D6D0C8] hover:text-stone-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
