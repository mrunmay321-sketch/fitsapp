import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Shirt,
  Plus,
  Trash2,
  X,
  Upload,
  Check,
  Loader2,
  Filter,
  Sparkles,
  Search,
} from 'lucide-react';
import type { ClothingItem, MainCategory, FitStyle } from '../types';
import { MAIN_CATEGORIES, SUBCATEGORIES, FIT_STYLES, getLayerTag } from '../constants';
import { useWardrobe } from '../context/WardrobeContext';
import { uid, fileToDataURL, compressImage, dataURLToBlob, blobToDataURL } from '../lib/utils';
import { analyzeImage, type ImageAnalysis } from '../lib/imageAnalysis';
import { removeBackground } from '../lib/backgroundRemoval';
import SectionHeader from '../components/SectionHeader';
import Modal from '../components/Modal';

export default function DigitalCloset() {
  const { items, addItem, updateItem, removeItem } = useWardrobe();
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ClothingItem | null>(null);
  const [filter, setFilter] = useState<MainCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    let result = filter === 'All' ? items : items.filter((i) => i.mainCategory === filter);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (i) =>
          i.subcategory.toLowerCase().includes(q) ||
          i.color.toLowerCase().includes(q) ||
          i.mainCategory.toLowerCase().includes(q) ||
          (i.styleVibe ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, filter, debouncedSearch]);

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Digital Closet"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} · offline`}
        icon={<Shirt className="h-5 w-5" strokeWidth={1.5} />}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700/40 bg-stone-700/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        }
      />

      {/* Search bar */}
      {items.length > 0 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, colors, styles..."
            className="w-full rounded-xl border border-[#D6D0C8] bg-[#EDE9E3]/50 py-2.5 pl-9 pr-9 font-mono text-xs text-stone-600 placeholder:text-stone-400 focus:border-stone-700/40 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      {items.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === 'All'} onClick={() => setFilter('All')} label="All" />
          {MAIN_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={cat}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#D6D0C8] bg-[#EDE9E3]/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60">
            <Shirt className="h-8 w-8 text-stone-400" strokeWidth={1} />
          </div>
          <p className="text-sm font-medium text-stone-600">Your closet is empty.</p>
          <p className="mt-1 text-xs text-stone-400">Tap '+' to upload your first piece of clothing.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl border border-stone-700/40 bg-stone-700/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/20"
          >
            <Plus className="h-4 w-4" />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetailItem(item)}
              className="group relative overflow-hidden rounded-xl border border-[#D6D0C8] bg-[#EDE9E3]/60 transition hover:border-stone-700/40"
            >
              <div className="relative aspect-square overflow-hidden">
                {item.imageData ? (
                  <img
                    src={item.imageData}
                    alt={item.subcategory}
                    loading="lazy"
                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[#D6D0C8]/60" />
                )}
                {item.inLaundry && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
                    <span className="rounded-md bg-[#D6D0C8] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-stone-500">
                      In Laundry
                    </span>
                  </div>
                )}
                {item.colorHex && (
                  <div
                    className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
              </div>
              <div className="p-2">
                <p className="truncate font-mono text-[9px] uppercase tracking-wider text-stone-400">
                  {item.subcategory.split(' ')[0]}
                </p>
                <p className="truncate text-[10px] text-stone-500">{item.color}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add modal */}
      <AddClothingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (item) => {
          await addItem(item);
          setAddOpen(false);
        }}
      />

      {/* Detail modal */}
      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Item Details"
      >
        {detailItem && (
          <ItemDetail
            item={detailItem}
            onUpdate={updateItem}
            onDelete={async (id) => {
              await removeItem(id);
              setDetailItem(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
        active
          ? 'border-stone-700/50 bg-stone-700/10 text-stone-500'
          : 'border-[#D6D0C8] bg-[#EDE9E3]/50 text-stone-400 hover:border-[#C4BDB3]'
      }`}
    >
      {label}
    </button>
  );
}

function ItemDetail({
  item,
  onUpdate,
  onDelete,
}: {
  item: ClothingItem;
  onUpdate: (item: ClothingItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <div className="relative mb-4 overflow-hidden rounded-xl border border-[#D6D0C8]">
        {item.imageData ? (
          <img src={item.imageData} alt={item.subcategory} className="h-56 w-full object-cover" />
        ) : (
          <div className="h-56 w-full animate-pulse bg-[#D6D0C8]/60" />
        )}
      </div>

      <div className="space-y-3">
        <DetailRow label="Category" value={item.mainCategory} />
        <DetailRow label="Subcategory" value={item.subcategory} />
        <DetailRow label="Fit" value={item.fit} />
        <DetailRow label="Color" value={item.color} />
        {item.layerTag && <DetailRow label="Layer" value={item.layerTag} />}
        {item.styleVibe && <DetailRow label="Style Vibe" value={item.styleVibe} />}
      </div>

      {/* Laundry toggle */}
      <button
        onClick={() => onUpdate({ ...item, inLaundry: !item.inLaundry })}
        className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
          item.inLaundry
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-[#D6D0C8] bg-[#FAF8F5]/60'
        }`}
      >
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-stone-600">
          <Loader2 className="h-3.5 w-3.5" />
          In Laundry
        </span>
        <span
          className={`relative h-5 w-9 rounded-full transition ${
            item.inLaundry ? 'bg-amber-500/60' : 'bg-stone-400'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
              item.inLaundry ? 'left-4' : 'left-0.5'
            }`}
          />
        </span>
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 font-mono text-xs uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20"
      >
        <Trash2 className="h-4 w-4" />
        Delete Item
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#D6D0C8]/60 pb-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <span className="text-sm text-stone-700">{value}</span>
    </div>
  );
}

function AddClothingModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<string | null>(null);
  const [mainCat, setMainCat] = useState<MainCategory | ''>('');
  const [subcat, setSubcat] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [fit, setFit] = useState<FitStyle | ''>('');
  const [styleVibe, setStyleVibe] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'cutout' | 'original'>('cutout');
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setImageData(null);
    setOriginalData(null);
    setMainCat('');
    setSubcat('');
    setColor('');
    setColorHex('');
    setFit('');
    setStyleVibe('');
    setAnalysis(null);
    setRemovingBg(false);
    setBgProgress(0);
    setViewMode('cutout');
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const raw = await fileToDataURL(file);
    const compressed = await compressImage(raw);
    setOriginalData(compressed);
    setUploading(false);

    // AI background removal — mandatory, no raw photos saved
    // Pipeline: pre-inference downscale → quint8 model + GPU + worker → PNG cutout
    setRemovingBg(true);
    setBgProgress(0);
    let cutoutDataUrl = '';
    try {
      const blob = dataURLToBlob(compressed);
      const cutoutBlob = await removeBackground(blob, (p) => setBgProgress(p));
      const rawCutout = await blobToDataURL(cutoutBlob);
      cutoutDataUrl = await compressImage(rawCutout);
      setImageData(cutoutDataUrl);
    } catch {
      setRemovingBg(false);
      return;
    }
    setRemovingBg(false);

    // Analyze the cutout image
    setAnalyzing(true);
    const result = await analyzeImage(cutoutDataUrl, file.name);
    setAnalysis(result);
    setColor(result.dominantColor);
    setColorHex(result.colorHex);
    setFit(result.fit);
    setStyleVibe(result.styleVibe);
    setAnalyzing(false);
  };

  const handleSubmit = () => {
    if (!imageData || !mainCat || !subcat || !color || !fit) return;
    onAdd({
      id: uid(),
      mainCategory: mainCat as MainCategory,
      subcategory: subcat,
      color,
      colorHex: colorHex || undefined,
      fit: fit as FitStyle,
      layerTag: getLayerTag(subcat),
      styleVibe,
      inLaundry: false,
      imageData,
      createdAt: Date.now(),
    });
    reset();
  };

  const subOptions = mainCat ? SUBCATEGORIES[mainCat] : [];

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Add Clothing">
      <div className="space-y-4">
        {/* Dropzone */}
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
          className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
            dragOver
              ? 'border-stone-700/60 bg-stone-700/10'
              : imageData
              ? 'border-[#C4BDB3] bg-[#FAF8F5]/60'
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
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
          ) : removingBg ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                AI Erasing Background...
              </p>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-[#D6D0C8]">
                <div
                  className="h-full rounded-full bg-stone-600 transition-all duration-300"
                  style={{ width: `${Math.max(bgProgress, 5)}%` }}
                />
              </div>
              <p className="font-mono text-[9px] text-stone-400">{bgProgress}%</p>
            </div>
          ) : imageData ? (
            <div className="relative w-full">
              <img
                src={viewMode === 'original' && originalData ? originalData : imageData}
                alt="preview"
                className="h-32 w-full object-cover"
              />
              {originalData && (
                <div className="absolute left-2 top-2 flex overflow-hidden rounded-lg border border-stone-600/40 bg-stone-900/70">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewMode('cutout'); }}
                    className={`px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition ${
                      viewMode === 'cutout' ? 'bg-stone-700/30 text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    Cutout
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewMode('original'); }}
                    className={`px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition ${
                      viewMode === 'original' ? 'bg-stone-700/30 text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 opacity-0 transition hover:opacity-100">
                <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white">
                  <Upload className="h-3 w-3" /> Change
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setImageData(null); setOriginalData(null); }}
                className="absolute right-2 top-2 rounded-full bg-stone-900/70 p-1 text-stone-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-stone-400" strokeWidth={1.5} />
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                Drop or tap to upload
              </p>
              <p className="mt-0.5 text-[10px] text-stone-400">From your device only</p>
            </>
          )}
        </div>

        {/* Visual AI Analysis badge */}
        {analysis && (
          <div className="animate-fade-in rounded-xl border border-stone-700/30 bg-gradient-to-br from-stone-700/10 to-stone-500/5 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-stone-600" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                Visual AI Analysis
              </span>
              {analysis.confidence > 0 && (
                <span className="ml-auto font-mono text-[9px] text-stone-700/60">
                  {Math.round(analysis.confidence * 100)}% conf.
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <AnalysisTag label="Color" value={analysis.dominantColor} />
              {analysis.colorHex && (
                <span
                  className="h-4 w-4 rounded-full border border-white/30"
                  style={{ backgroundColor: analysis.colorHex }}
                />
              )}
              <AnalysisTag label="Fit" value={analysis.fit} />
              <AnalysisTag label="Vibe" value={analysis.styleVibe} />
            </div>
            <p className="mt-2 text-[10px] text-stone-400">
              Auto-detected — adjust below if needed.
            </p>
          </div>
        )}

        {analyzing && (
          <div className="flex items-center gap-2 rounded-xl border border-stone-700/20 bg-stone-700/5 p-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-600" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
              Analyzing image…
            </span>
          </div>
        )}

        {/* Main category */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
            Main Category
          </label>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setMainCat(cat); setSubcat(''); }}
                className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                  mainCat === cat
                    ? 'border-stone-700/50 bg-stone-700/10 text-stone-500'
                    : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-[#C4BDB3]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory (dependent) */}
        {mainCat && (
          <div className="animate-fade-in">
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
              Subcategory
            </label>
            <div className="flex flex-wrap gap-2">
              {subOptions.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubcat(sub)}
                  className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                    subcat === sub
                      ? 'border-stone-700/50 bg-stone-700/10 text-stone-500'
                      : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-[#C4BDB3]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color — dynamic input with hex swatch */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
            Color
          </label>
          <div className="flex items-center gap-2">
            {colorHex && (
              <div
                className="h-8 w-8 flex-shrink-0 rounded-lg border border-[#C4BDB3]"
                style={{ backgroundColor: colorHex }}
              />
            )}
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Auto-detected color name"
              className="flex-1 rounded-lg border border-[#D6D0C8] bg-[#FAF8F5]/80 px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-700/60"
            />
          </div>
          <p className="mt-1 text-[10px] text-stone-400">
            Auto-extracted from image — edit freely for custom naming.
          </p>
        </div>

        {/* Fit */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
            Fit Style
          </label>
          <div className="flex gap-2">
            {FIT_STYLES.map((f) => (
              <button
                key={f}
                onClick={() => setFit(f)}
                className={`flex-1 rounded-lg border py-2.5 font-mono text-[10px] uppercase tracking-wider transition ${
                  fit === f
                    ? 'border-stone-700/50 bg-stone-700/10 text-stone-500'
                    : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-[#C4BDB3]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!imageData || !mainCat || !subcat || !color || !fit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700/40 bg-gradient-to-r from-stone-700/20 to-stone-500/20 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-stone-500 shadow-lg shadow-stone-700/20 transition hover:shadow-stone-700/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Save Item
        </button>
      </div>
    </Modal>
  );
}

function AnalysisTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-stone-700/20 bg-stone-700/5 px-2 py-1 font-mono text-[9px] tracking-wider text-stone-500">
      <span className="text-stone-700/60">{label}: </span>
      {value}
    </span>
  );
}
