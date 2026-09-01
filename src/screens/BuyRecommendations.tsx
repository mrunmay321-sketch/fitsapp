import { useMemo, useState } from 'react';
import { ShoppingBag, TrendingUp, Sparkles, Heart, Unlock, Check } from 'lucide-react';
import type { BuyRecommendation, WishlistItem } from '../types';
import { useWardrobe } from '../context/WardrobeContext';
import { generateBuyRecommendations, computeBodyProfile } from '../lib/outfitEngine';
import { MAIN_CATEGORIES, UNDERTONE_LABELS, UNDERTONE_COLORS } from '../constants';
import SectionHeader from '../components/SectionHeader';
import { uid } from '../lib/utils';

export default function BuyRecommendations() {
  const { items, body, wishlist, addToWishlist, removeFromWishlist } = useWardrobe();
  const profile = computeBodyProfile(body);

  const recommendations = useMemo(
    () => generateBuyRecommendations(items, body),
    [items, body]
  );

  const wishlistedIds = useMemo(() => new Set(wishlist.map((w) => w.id)), [wishlist]);

  const handleWishlist = (rec: BuyRecommendation) => {
    if (wishlistedIds.has(rec.id)) {
      removeFromWishlist(rec.id);
    } else {
      const wItem: WishlistItem = {
        id: rec.id,
        name: rec.name,
        category: rec.category,
        fit: rec.fit,
        color: rec.color,
        layerTag: rec.layerTag,
        source: 'buy',
        addedAt: Date.now(),
      };
      addToWishlist(wItem);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of MAIN_CATEGORIES) counts[cat] = 0;
    for (const item of items) counts[item.mainCategory]++;
    return counts;
  }, [items]);

  const layerCounts = useMemo(() => {
    let base = 0, mid = 0, outer = 0;
    for (const item of items) {
      if (item.layerTag === 'Base') base++;
      else if (item.layerTag === 'Mid') mid++;
      else if (item.layerTag === 'Outer' || item.mainCategory === 'Jackets') outer++;
    }
    return { base, mid, outer };
  }, [items]);

  const fitCounts = useMemo(() => {
    let fitted = 0, regular = 0, baggy = 0;
    for (const item of items) {
      if (item.fit === 'Fitted') fitted++;
      else if (item.fit === 'Regular') regular++;
      else if (item.fit === 'Baggy/Oversized') baggy++;
    }
    return { fitted, regular, baggy };
  }, [items]);

  const undertone = body?.undertone ?? 'Neutral';

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Buy Recommendations"
        subtitle="Wardrobe gap analysis · smart picks"
        icon={<ShoppingBag className="h-5 w-5" strokeWidth={1.5} />}
      />

      {/* Wardrobe audit summary */}
      <div className="mb-4 rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60 p-4">
        <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
          <TrendingUp className="h-3.5 w-3.5" />
          Wardrobe Audit
        </p>
        <div className="grid grid-cols-5 gap-2">
          {MAIN_CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-lg border border-[#D6D0C8]/60 bg-[#FAF8F5]/40 p-2 text-center">
              <p className="font-mono text-lg font-bold text-stone-800">{categoryCounts[cat]}</p>
              <p className="font-mono text-[7px] uppercase tracking-wider text-stone-400">{cat.slice(0, 5)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <AuditStat label="Base Layers" value={layerCounts.base} />
          <AuditStat label="Mid Layers" value={layerCounts.mid} />
          <AuditStat label="Outer" value={layerCounts.outer} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <AuditStat label="Fitted" value={fitCounts.fitted} />
          <AuditStat label="Regular" value={fitCounts.regular} />
          <AuditStat label="Baggy" value={fitCounts.baggy} />
        </div>
      </div>

      {/* Undertone color guide */}
      {undertone !== 'Neutral' && (
        <div className="mb-4 rounded-2xl border border-stone-700/20 bg-stone-700/5 p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-stone-600">
            Your Undertone Palette
          </p>
          <p className="mb-2 text-xs text-stone-600">{UNDERTONE_LABELS[undertone]}</p>
          <div className="flex flex-wrap gap-1.5">
            {(UNDERTONE_COLORS[undertone] ?? []).map((c) => (
              <span
                key={c}
                className="rounded-md border border-[#C4BDB3] bg-[#FAF8F5]/60 px-2 py-1 font-mono text-[9px] tracking-wider text-stone-500"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist preview */}
      {wishlist.length > 0 && (
        <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rose-400">
            <Heart className="h-3.5 w-3.5" />
            Wishlist ({wishlist.length})
          </p>
          <div className="space-y-1.5">
            {wishlist.slice(0, 4).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-[#D6D0C8]/60 bg-[#FAF8F5]/40 px-3 py-2">
                <span className="text-xs text-stone-600">{w.name}</span>
                <button
                  onClick={() => removeFromWishlist(w.id)}
                  className="font-mono text-[9px] uppercase tracking-wider text-rose-400/70 hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state: not enough items */}
      {items.length < 3 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#D6D0C8] bg-[#EDE9E3]/30 px-6 py-14 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60">
            <Sparkles className="h-8 w-8 text-stone-400" strokeWidth={1} />
          </div>
          <p className="text-sm font-medium text-stone-600">Not enough items yet.</p>
          <p className="mt-1 text-xs text-stone-400">
            Upload at least 3 items to your closet to unlock intelligent buy recommendations and gap analysis.
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#D6D0C8] bg-[#EDE9E3]/30 px-6 py-14 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60">
            <Sparkles className="h-8 w-8 text-stone-400" strokeWidth={1} />
          </div>
          <p className="text-sm font-medium text-stone-600">Your wardrobe is well-balanced.</p>
          <p className="mt-1 text-xs text-stone-400">
            Add more items or set your Body Matrix for deeper analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              wishlisted={wishlistedIds.has(rec.id)}
              onWishlist={() => handleWishlist(rec)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#D6D0C8]/60 bg-[#FAF8F5]/40 px-3 py-2">
      <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">{label}</span>
      <span className={`font-mono text-sm font-bold ${value === 0 ? 'text-rose-400' : value < 2 ? 'text-amber-400' : 'text-stone-600'}`}>
        {value}
      </span>
    </div>
  );
}

function RecommendationCard({
  rec,
  wishlisted,
  onWishlist,
}: {
  rec: BuyRecommendation;
  wishlisted: boolean;
  onWishlist: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-700/20 bg-[#EDE9E3]/70 p-4 shadow-lg shadow-stone-700/5 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-800">{rec.name}</h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-stone-700/70">
            {rec.category} · {rec.fit}
            {rec.layerTag && ` · ${rec.layerTag} Layer`}
          </p>
        </div>
        <span className="rounded-md border border-stone-700/30 bg-stone-700/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-stone-500">
          {rec.color}
        </span>
      </div>

      {/* Unlock score */}
      {rec.unlockScore !== undefined && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            Unlocks {rec.unlockCount ?? 0} new outfits
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#D6D0C8]">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${rec.unlockScore}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-400">{rec.unlockScore}%</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="rounded-lg border border-[#D6D0C8]/60 bg-[#FAF8F5]/40 p-2.5">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400/70">
            Why You Need It
          </p>
          <p className="text-xs leading-relaxed text-stone-600">{rec.reasonWhy}</p>
        </div>
        <div className="rounded-lg border border-[#D6D0C8]/60 bg-[#FAF8F5]/40 p-2.5">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-stone-600/70">
            Fit & Color Logic
          </p>
          <p className="text-xs leading-relaxed text-stone-600">{rec.reasonFit}</p>
        </div>
      </div>

      {/* Wishlist button */}
      <button
        onClick={onWishlist}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 font-mono text-[10px] uppercase tracking-wider transition ${
          wishlisted
            ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
            : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-rose-500/30 hover:text-rose-400'
        }`}
      >
        {wishlisted ? (
          <>
            <Check className="h-3.5 w-3.5" />
            In Wishlist
          </>
        ) : (
          <>
            <Heart className="h-3.5 w-3.5" />
            Add to Wishlist
          </>
        )}
      </button>
    </div>
  );
}
