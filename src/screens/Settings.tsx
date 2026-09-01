import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2, AlertTriangle, Shield, Database, Info, Download, Check } from 'lucide-react';
import { useWardrobe } from '../context/WardrobeContext';
import SectionHeader from '../components/SectionHeader';
import Modal from '../components/Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Settings() {
  const { resetAll, items, body } = useWardrobe();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleReset = async () => {
    await resetAll();
    setConfirmOpen(false);
  };

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Settings"
        subtitle="System · offline storage"
        icon={<SettingsIcon className="h-5 w-5" strokeWidth={1.5} />}
      />

      {/* PWA Install */}
      <div className="mb-4 rounded-2xl border border-stone-700/20 bg-stone-700/5 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-600">
          <Download className="h-3.5 w-3.5" />
          Install App
        </p>
        {installed ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Check className="h-4 w-4" />
            <span>App installed — running in standalone mode.</span>
          </div>
        ) : deferredPrompt ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-stone-500">
              Install CyberWardrobe on your device for full-screen, offline access — works on iOS, Android, macOS, and Windows.
            </p>
            <button
              onClick={handleInstall}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700/40 bg-stone-700/10 py-3 font-mono text-xs uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/20"
            >
              <Download className="h-4 w-4" />
              Install Now
            </button>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-stone-400">
            Use your browser's "Add to Home Screen" or "Install App" option to install. On iOS, tap the Share button and select "Add to Home Screen".
          </p>
        )}
      </div>

      {/* Storage info */}
      <div className="mb-4 rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60 p-4">
        <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-600">
          <Database className="h-3.5 w-3.5" />
          Storage Status
        </p>
        <div className="space-y-2">
          <InfoRow label="Clothing Items" value={`${items.length}`} />
          <InfoRow label="Body Matrix" value={body && body.height > 0 ? 'Set' : 'Not set'} />
          <InfoRow label="Skin Undertone" value={body?.undertone ?? 'Not set'} />
          <InfoRow label="Storage Type" value="IndexedDB (Local)" />
          <InfoRow label="Cloud Sync" value="Disabled" />
          <InfoRow label="Offline Mode" value="Active" />
        </div>
      </div>

      {/* Privacy */}
      <div className="mb-4 rounded-2xl border border-stone-700/20 bg-stone-700/5 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-600">
          <Shield className="h-3.5 w-3.5" />
          Privacy
        </p>
        <p className="text-xs leading-relaxed text-stone-500">
          All your data — clothing photos, body measurements, and feedback — is stored
          exclusively on this device. Background removal runs entirely in your browser.
          Nothing is uploaded to any server. Clearing your browser data will permanently erase your wardrobe.
        </p>
      </div>

      {/* About */}
      <div className="mb-6 rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-400">
          <Info className="h-3.5 w-3.5" />
          About
        </p>
        <p className="text-xs leading-relaxed text-stone-500">
          CyberWardrobe is a digital wardrobe and personal styling OS. The AI outfit engine
          uses a multi-variable matchmaking algorithm — body proportions, color harmony,
          layer logic, skin undertone, and learned preferences — to generate outfits.
        </p>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
        <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Danger Zone
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 py-3 font-mono text-xs uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Reset Wardrobe Storage
        </button>
        <p className="mt-2 text-center text-[10px] text-stone-400">
          This will permanently delete all items, measurements, and feedback.
        </p>
      </div>

      {/* Confirm modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Reset">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10">
            <AlertTriangle className="h-7 w-7 text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="mb-2 text-sm font-medium text-stone-700">
            Reset all wardrobe data?
          </p>
          <p className="mb-6 text-xs leading-relaxed text-stone-400">
            This permanently deletes all clothing items, body measurements, and
            feedback history. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-xl border border-[#D6D0C8] bg-[#FAF8F5]/60 py-3 font-mono text-xs uppercase tracking-wider text-stone-500 transition hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/20 py-3 font-mono text-xs uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <span className="font-mono text-xs text-stone-600">{value}</span>
    </div>
  );
}
