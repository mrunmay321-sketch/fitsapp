import type { ClothingItem, MainCategory } from '../types';
import { HelpCircle } from 'lucide-react';

export interface FlatLayMissingSlot {
  category: MainCategory;
  label: string;
}

interface FlatLayCanvasProps {
  items: ClothingItem[];
  missingSlots?: FlatLayMissingSlot[];
  height?: number;
}

const DROP_SHADOW = 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))';

export default function FlatLayCanvas({ items, missingSlots = [], height = 280 }: FlatLayCanvasProps) {
  const tops = items.filter((i) => i.mainCategory === 'Tops');
  const jackets = items.filter((i) => i.mainCategory === 'Jackets');
  const bottoms = items.filter((i) => i.mainCategory === 'Bottoms');
  const footwear = items.filter((i) => i.mainCategory === 'Footwear');
  const accessories = items.filter((i) => i.mainCategory === 'Accessories');

  const missingTops = missingSlots.filter((s) => s.category === 'Tops' || s.category === 'Jackets');
  const missingBottoms = missingSlots.filter((s) => s.category === 'Bottoms');
  const missingFootwear = missingSlots.filter((s) => s.category === 'Footwear');
  const missingAccessories = missingSlots.filter((s) => s.category === 'Accessories');

  const upperItems = [...jackets, ...tops];
  const hasContent = items.length > 0 || missingSlots.length > 0;

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl border border-stone-200/80 bg-[#F9F8F6]"
      style={{ height: `${height}px` }}
    >
      <div className="flex h-full w-full flex-col">
        {/* ── ZONE 1: Upper Body (tops + jackets) ── */}
        <div className="flex h-[42%] items-end justify-center gap-1 px-[6%] pt-[3%]">
          {upperItems.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex h-full items-end justify-center"
              style={{ filter: DROP_SHADOW, maxWidth: '40%' }}
            >
              <FlatLayItem item={item} />
            </div>
          ))}
          {missingTops.map((slot, idx) => (
            <MissingSlot key={`missing-top-${idx}`} label={slot.label} />
          ))}
        </div>

        {/* ── ZONE 2: Lower Body (bottoms) ── */}
        <div className="flex h-[38%] items-center justify-center gap-1 px-[10%]">
          {bottoms.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="flex h-full items-center justify-center"
              style={{ filter: DROP_SHADOW, maxWidth: '42%' }}
            >
              <FlatLayItem item={item} />
            </div>
          ))}
          {missingBottoms.map((slot, idx) => (
            <MissingSlot key={`missing-bot-${idx}`} label={slot.label} />
          ))}
        </div>

        {/* ── ZONE 3: Bottom corners (footwear right, accessories left) ── */}
        <div className="flex h-[20%] items-end justify-between px-[4%] pb-[3%]">
          {/* Accessories — bottom-left */}
          <div className="flex h-full items-end gap-1" style={{ maxWidth: '35%' }}>
            {accessories.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="flex h-full items-end justify-center"
                style={{ filter: DROP_SHADOW, maxWidth: '50%' }}
              >
                <FlatLayItem item={item} />
              </div>
            ))}
            {missingAccessories.map((slot, idx) => (
              <MissingSlot key={`missing-acc-${idx}`} label={slot.label} />
            ))}
          </div>

          {/* Footwear — bottom-right */}
          <div className="flex h-full items-end gap-1" style={{ maxWidth: '35%' }}>
            {missingFootwear.map((slot, idx) => (
              <MissingSlot key={`missing-shoe-${idx}`} label={slot.label} />
            ))}
            {footwear.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="flex h-full items-end justify-center"
                style={{ filter: DROP_SHADOW, maxWidth: '50%' }}
              >
                <FlatLayItem item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {!hasContent && (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-300">
              No items
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function FlatLayItem({ item }: { item: ClothingItem }) {
  if (!item.imageData) return null;
  return (
    <img
      src={item.imageData}
      alt={item.subcategory}
      className="max-h-full max-w-full object-contain"
      loading="lazy"
    />
  );
}

function MissingSlot({ label }: { label: string }) {
  return (
    <div
      className="flex h-full max-h-[60px] min-w-[50px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-stone-100/40 px-1"
    >
      <HelpCircle className="h-4 w-4 text-stone-300" strokeWidth={1.2} />
      <span className="text-center font-mono text-[7px] uppercase leading-tight tracking-wider text-stone-400">
        {label}
      </span>
    </div>
  );
}
