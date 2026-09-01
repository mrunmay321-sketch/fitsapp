import { useState, useRef } from 'react';
import {
  ScanLine,
  Upload,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Link2,
} from 'lucide-react';
import type { ScanResult } from '../types';
import { useWardrobe } from '../context/WardrobeContext';
import { buyOrPass } from '../lib/outfitEngine';
import { fileToDataURL, compressImage } from '../lib/utils';
import SectionHeader from '../components/SectionHeader';

export default function StoreScanner() {
  const { items, body } = useWardrobe();
  const [imageData, setImageData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const raw = await fileToDataURL(file);
    const compressed = await compressImage(raw);
    setImageData(compressed);
    setResult(null);
  };

  const handleScan = () => {
    if (!imageData) return;
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const res = buyOrPass(imageData, items, body);
      setResult(res);
      setScanning(false);
    }, 1400);
  };

  const reset = () => {
    setImageData(null);
    setResult(null);
  };

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Store Scanner"
        subtitle="Buy or Pass · AI verdict"
        icon={<ScanLine className="h-5 w-5" strokeWidth={1.5} />}
      />

      {/* Upload zone */}
      {!imageData ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
            dragOver
              ? 'border-stone-700/60 bg-stone-700/10'
              : 'border-[#C4BDB3] bg-[#EDE9E3]/40 hover:border-stone-700/40'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-700/30 bg-stone-700/10">
            <Upload className="h-6 w-6 text-stone-600" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Scan an item
          </p>
          <p className="mt-1 text-[10px] text-stone-400">
            Upload a photo of something you're considering buying
          </p>
        </div>
      ) : (
        <div>
          {/* Preview */}
          <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#D6D0C8]">
            <img src={imageData} alt="scan" className="h-56 w-full object-cover" />
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/70 backdrop-blur-sm">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-stone-600 border-r-stone-500" />
                  <ScanLine className="absolute inset-0 m-auto h-7 w-7 text-stone-600" />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
                  Analyzing...
                </p>
              </div>
            )}
            {!scanning && !result && (
              <button
                onClick={reset}
                className="absolute right-2 top-2 rounded-full bg-stone-900/70 p-1.5 text-stone-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Scan button */}
          {!result && !scanning && (
            <button
              onClick={handleScan}
              className="group relative mb-5 w-full overflow-hidden rounded-xl border border-stone-700/40 bg-gradient-to-r from-stone-700/20 to-stone-500/20 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-stone-500 shadow-lg shadow-stone-700/20 transition hover:shadow-stone-700/40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ScanLine className="h-4 w-4" />
                Run Buy/Pass Analysis
              </span>
            </button>
          )}

          {/* Result */}
          {result && (
            <div className="animate-fade-in space-y-4">
              {/* Verdict card */}
              <div
                className={`relative overflow-hidden rounded-2xl border p-5 text-center ${
                  result.verdict === 'BUY'
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10 shadow-lg shadow-rose-500/10'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  {result.verdict === 'BUY' ? (
                    <CheckCircle2 className="h-12 w-12 text-emerald-400" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="h-12 w-12 text-rose-400" strokeWidth={1.5} />
                  )}
                </div>
                <p
                  className={`font-mono text-3xl font-bold tracking-tight ${
                    result.verdict === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {result.verdict}
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-stone-400">
                    <span>Wardrobe Match</span>
                    <span className={result.verdict === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                      {result.matchScore}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#D6D0C8]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.verdict === 'BUY'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                          : 'bg-gradient-to-r from-rose-500 to-rose-400'
                      }`}
                      style={{ width: `${result.matchScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Style breakdown */}
              <div className="rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60 p-4">
                <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                  <Sparkles className="h-3 w-3" />
                  AI Style Breakdown
                </p>
                <ul className="space-y-2">
                  {result.breakdown.map((b, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-stone-500">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-stone-700" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pairs well with */}
              {result.pairsWellWith.length > 0 && (
                <div className="rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60 p-4">
                  <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                    <Link2 className="h-3 w-3" />
                    Pairs Well With
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {result.pairsWellWith.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-lg border border-[#D6D0C8] bg-[#FAF8F5]/60">
                        <div className="aspect-square overflow-hidden">
                          <img src={item.imageData} alt={item.subcategory} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-1.5">
                          <p className="truncate font-mono text-[8px] uppercase tracking-wider text-stone-400">
                            {item.subcategory.split(' ')[0]}
                          </p>
                          <p className="truncate text-[9px] text-stone-400">{item.color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rescan */}
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6D0C8] bg-[#FAF8F5]/40 py-3 font-mono text-[10px] uppercase tracking-wider text-stone-400 transition hover:text-stone-500"
              >
                <Upload className="h-3 w-3" />
                Scan Another Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty hint */}
      {!imageData && items.length === 0 && (
        <p className="mt-4 text-center font-mono text-[10px] text-stone-400">
          Add closet items first for more accurate pairing suggestions.
        </p>
      )}
    </div>
  );
}
