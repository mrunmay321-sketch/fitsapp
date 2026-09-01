import { useState, useCallback } from 'react';
import {
  Sparkles,
  Cloud,
  CloudRain,
  Sun,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shirt as Hanger,
  Globe,
  Loader2,
  GraduationCap,
  Building2,
  Moon,
  Coffee,
  ChevronDown,
  Heart,
  Copy,
  Check,
} from 'lucide-react';
import type { Weather, Occasion, GeneratedOutfit, MatchBreakdown, WishlistItem } from '../types';
import { WEATHERS, OCCASIONS } from '../constants';
import { useWardrobe } from '../context/WardrobeContext';
import { generateOutfit, computeBodyProfile, replicateFromCloset, buildReplicateOutfitItems } from '../lib/outfitEngine';
import SectionHeader from '../components/SectionHeader';
import FlatLayCanvas from '../components/FlatLayCanvas';
import { Ruler, Brain } from 'lucide-react';
import { uid } from '../lib/utils';

const WEATHER_ICONS: Record<Weather, typeof Sun> = {
  'Cold/Layering': Cloud,
  Warm: Sun,
  Rainy: CloudRain,
};

const OCCASION_ICONS: Record<Occasion, typeof Sun> = {
  College: GraduationCap,
  'Street Outdoors': Building2,
  'Night Outs': Moon,
  Hangouts: Coffee,
};

export default function HomeDashboard() {
  const { items, body, feedback, prefScores, recordFeedback, wishlist, addToWishlist, removeFromWishlist } = useWardrobe();
  const bodyProfile = computeBodyProfile(body);
  const [weather, setWeather] = useState<Weather>('Cold/Layering');
  const [occasion, setOccasion] = useState<Occasion>('College');
  const [tab, setTab] = useState<'closet' | 'inspo'>('closet');
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(null);
  const [generating, setGenerating] = useState(false);
  const [includeWishlist, setIncludeWishlist] = useState(false);
  const [showReplicate, setShowReplicate] = useState(false);
  const [replicateResults, setReplicateResults] = useState<ReturnType<typeof replicateFromCloset> | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setOutfit(null);
    setReplicateResults(null);
    setShowReplicate(false);
    setTimeout(() => {
      const result = generateOutfit(items, occasion, weather, tab, body, prefScores);
      setOutfit(result);
      setGenerating(false);
    }, 900);
  }, [items, occasion, weather, tab, body, prefScores]);

  const handleFeedback = (fb: 'love' | 'dislike') => {
    if (!outfit) return;
    setOutfit({ ...outfit, feedback: fb });
    recordFeedback({ outfitId: outfit.id, feedback: fb, timestamp: Date.now() }, outfit);
  };

  const handleReplicate = () => {
    if (!outfit || tab !== 'inspo') return;
    const inspoItems = outfit.items.map((i) => ({
      category: i.mainCategory,
      color: i.color,
      colorHex: i.colorHex,
      fit: i.fit,
    }));
    const results = replicateFromCloset(inspoItems, items);
    setReplicateResults(results);
    setShowReplicate(true);
  };

  const handleWishlistOutfit = () => {
    if (!outfit) return;
    const key = outfit.id;
    if (wishlisted.has(key)) {
      const wItem = wishlist.find((w) => w.id === key);
      if (wItem) removeFromWishlist(key);
      setWishlisted((prev) => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      const wItem: WishlistItem = {
        id: key,
        name: outfit.title,
        category: 'Tops',
        fit: 'Regular',
        color: '',
        source: 'inspo',
        addedAt: Date.now(),
      };
      addToWishlist(wItem);
      setWishlisted((prev) => new Set(prev).add(key));
    }
  };

  const closetCount = items.length;
  const hasClothes = closetCount > 0;
  const wishlistCount = wishlist.length;

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Outfit Engine"
        subtitle="AI styling · offline mode"
        icon={<Sparkles className="h-5 w-5" strokeWidth={1.5} />}
      />

      {/* Wishlist simulation toggle */}
      {wishlistCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rose-400">
            <Heart className="h-3.5 w-3.5" />
            Include Wishlist ({wishlistCount})
          </span>
          <button
            onClick={() => setIncludeWishlist(!includeWishlist)}
            className={`relative h-6 w-11 rounded-full transition ${includeWishlist ? 'bg-rose-500/40' : 'bg-[#D6D0C8]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${includeWishlist ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {/* Weather selector */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-stone-400">
          Weather
        </p>
        <div className="grid grid-cols-3 gap-2">
          {WEATHERS.map((w) => {
            const Icon = WEATHER_ICONS[w];
            const isActive = weather === w;
            return (
              <button
                key={w}
                onClick={() => setWeather(w)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 transition ${
                  isActive
                    ? 'border-stone-700/50 bg-stone-700/10 text-stone-500 shadow-[0_0_12px_rgba(120,113,108,0.15)]'
                    : 'border-[#D6D0C8] bg-[#EDE9E3]/50 text-stone-400 hover:border-[#C4BDB3]'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider">{w.split('/')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Occasion selector */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-stone-400">
          Occasion
        </p>
        <div className="grid grid-cols-2 gap-2">
          {OCCASIONS.map((o) => {
            const Icon = OCCASION_ICONS[o];
            const isActive = occasion === o;
            return (
              <button
                key={o}
                onClick={() => setOccasion(o)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                  isActive
                    ? 'border-stone-700/50 bg-stone-700/10 text-stone-500 shadow-[0_0_12px_rgba(120,113,108,0.15)]'
                    : 'border-[#D6D0C8] bg-[#EDE9E3]/50 text-stone-400 hover:border-[#C4BDB3]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source tabs */}
      <div className="mb-4 flex rounded-xl border border-[#D6D0C8] bg-[#EDE9E3]/50 p-1">
        <button
          onClick={() => setTab('closet')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 font-mono text-xs uppercase tracking-wider transition ${
            tab === 'closet' ? 'bg-stone-700/15 text-stone-500' : 'text-stone-400'
          }`}
        >
          <Hanger className="h-3.5 w-3.5" />
          My Closet Fits
        </button>
        <button
          onClick={() => setTab('inspo')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 font-mono text-xs uppercase tracking-wider transition ${
            tab === 'inspo' ? 'bg-stone-700/15 text-stone-500' : 'text-stone-400'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Internet Inspo
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || (tab === 'closet' && !hasClothes)}
        className="group relative mb-5 w-full overflow-hidden rounded-xl border border-stone-700/40 bg-gradient-to-r from-stone-700/20 to-stone-500/20 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-stone-500 shadow-lg shadow-stone-700/20 transition hover:shadow-stone-700/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Fit
            </>
          )}
        </span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-stone-600/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Empty closet hint */}
      {tab === 'closet' && !hasClothes && !outfit && (
        <div className="rounded-2xl border border-dashed border-[#D6D0C8] bg-[#EDE9E3]/30 px-5 py-10 text-center">
          <Hanger className="mx-auto mb-3 h-10 w-10 text-stone-300" strokeWidth={1} />
          <p className="text-sm text-stone-500">Your closet is empty.</p>
          <p className="mt-1 text-xs text-stone-400">
            Tap '+' in the Closet tab to upload your first piece of clothing.
          </p>
        </div>
      )}

      {/* Generating skeleton */}
      {generating && (
        <div className="animate-pulse rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/50 p-5">
          <div className="mb-4 h-4 w-2/3 rounded bg-[#D6D0C8]" />
          <div className="mb-3 h-3 w-full rounded bg-[#D6D0C8]/60" />
          <div className="mb-6 h-3 w-4/5 rounded bg-[#D6D0C8]/60" />
          <div className="flex gap-3">
            <div className="h-20 w-20 rounded-xl bg-[#D6D0C8]/60" />
            <div className="h-20 w-20 rounded-xl bg-[#D6D0C8]/60" />
            <div className="h-20 w-20 rounded-xl bg-[#D6D0C8]/60" />
          </div>
        </div>
      )}

      {/* Outfit result */}
      {outfit && !generating && (
        <div className="animate-fade-in rounded-2xl border border-stone-700/20 bg-[#EDE9E3]/70 p-5 shadow-lg shadow-stone-700/5 backdrop-blur-md">
          {/* Title + score */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-stone-800">{outfit.title}</h3>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-stone-700/70">
                {outfit.aesthetic} · {outfit.weather} · {outfit.occasion}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-2xl font-bold text-stone-600">
                {outfit.matchScore}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">
                Match
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 text-xs leading-relaxed text-stone-500">{outfit.description}</p>

          {/* Flat-lay canvas — only for closet items with real images */}
          {outfit.source === 'closet' && <FlatLayCanvas items={outfit.items} />}

          {/* Inspo style template — text-based, no canvas */}
          {outfit.source === 'inspo' && !showReplicate && (
            <div className="mb-4 rounded-2xl border border-stone-200/80 bg-[#F9F8F6] p-4">
              <div className="space-y-2">
                {outfit.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 flex-shrink-0 rounded-lg border border-stone-300"
                      style={{ backgroundColor: item.colorHex || '#d6d3d1' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{item.color} {item.subcategory}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                        {item.mainCategory} · {item.fit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replicated flat-lay — user's owned clothes on canvas */}
          {outfit.source === 'inspo' && showReplicate && replicateResults && (() => {
            const replicated = buildReplicateOutfitItems(replicateResults);
            return (
              <FlatLayCanvas
                items={replicated.items}
                missingSlots={replicated.missingSlots}
              />
            );
          })()}

          {/* Item chips */}
          {outfit.items.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-stone-400">
                {outfit.source === 'closet' ? 'Your Items' : 'Pairs With'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {outfit.items.slice(0, 4).map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center gap-1 rounded-lg border border-[#D6D0C8] bg-[#FAF8F5]/60 p-2"
                    >
                      <div className="relative h-14 w-full overflow-hidden rounded-md bg-[#EDE9E3]">
                        {item.imageData ? (
                          <img src={item.imageData} alt={item.subcategory} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-[#D6D0C8]/60" />
                        )}
                      </div>
                      <span className="text-center font-mono text-[8px] uppercase leading-tight text-stone-400">
                        {item.subcategory.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Replicate button (inspo only) */}
          {tab === 'inspo' && (
            <div className="mb-4">
              <button
                onClick={handleReplicate}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700/30 bg-stone-700/5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/15"
              >
                <Copy className="h-3.5 w-3.5" />
                Replicate From My Closet
              </button>

              {showReplicate && replicateResults && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {replicateResults.map((match, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                        match.missing
                          ? 'border-rose-500/30 bg-rose-500/5'
                          : 'border-emerald-500/30 bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                          {match.inspoItem.category}
                        </p>
                        {match.closetItem && !match.missing ? (
                          <p className="text-xs text-emerald-300">
                            {match.closetItem.color} {match.closetItem.subcategory}
                          </p>
                        ) : (
                          <p className="text-xs text-rose-300">
                            Missing — check Buy tab
                          </p>
                        )}
                      </div>
                      <span className={`font-mono text-xs font-bold ${match.missing ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {match.missing ? 'GAP' : `${match.similarity}%`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Body match explanation */}
          {outfit.bodyMatch && (
            <div className="mb-4 rounded-xl border border-stone-700/20 bg-stone-700/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                <Ruler className="h-3 w-3" />
                Why This Works For Your Frame
              </p>
              <p className="text-xs leading-relaxed text-stone-600">
                {outfit.bodyMatch}
              </p>
              {bodyProfile && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-700/10 pt-3">
                  <MetricChip label="SW Ratio" value={bodyProfile.shoulderToWaist.toFixed(2)} />
                  <MetricChip label="WH Ratio" value={bodyProfile.waistToHip.toFixed(2)} />
                  <MetricChip label="Profile" value={bodyProfile.isVTaper ? 'V-Taper' : 'Straight'} />
                  <MetricChip label="Height" value={`${Math.round(bodyProfile.height)}cm`} />
                  {bodyProfile.undertone !== 'Neutral' && (
                    <MetricChip label="Undertone" value={bodyProfile.undertone} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Adaptive learning indicator */}
          {outfit.preferenceScore !== undefined && outfit.preferenceScore !== 0 && (
            <div className="mb-4 rounded-xl border border-stone-500/20 bg-stone-500/5 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                <Brain className="h-3 w-3" />
                Learned Preference: {outfit.preferenceScore > 0 ? '+' : ''}{outfit.preferenceScore} pts
              </p>
            </div>
          )}

          {/* Match Analysis Matrix */}
          {outfit.matchBreakdown && (
            <MatchAnalysisCard breakdown={outfit.matchBreakdown} />
          )}

          {/* Feedback + Wishlist */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback('love')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                outfit.feedback === 'love'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                  : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-emerald-500/30 hover:text-emerald-400'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              Love It
            </button>
            <button
              onClick={() => handleFeedback('dislike')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                outfit.feedback === 'dislike'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
                  : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-rose-500/30 hover:text-rose-400'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              Dislike
            </button>
            <button
              onClick={handleWishlistOutfit}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                wishlisted.has(outfit.id)
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
                  : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-rose-500/30 hover:text-rose-400'
              }`}
            >
              {wishlisted.has(outfit.id) ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </button>
          </div>

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6D0C8] bg-[#FAF8F5]/40 py-2.5 font-mono text-[10px] uppercase tracking-wider text-stone-400 transition hover:text-stone-500"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        </div>
      )}

      {/* Feedback stats */}
      {feedback.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 font-mono text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3 text-emerald-500/60" />
            {feedback.filter((f) => f.feedback === 'love').length} loved
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="h-3 w-3 text-rose-500/60" />
            {feedback.filter((f) => f.feedback === 'dislike').length} disliked
          </span>
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-[#D6D0C8] bg-[#FAF8F5]/60 px-2 py-1">
      <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <span className="font-mono text-[10px] font-semibold text-stone-600">{value}</span>
    </div>
  );
}

function MatchAnalysisCard({ breakdown }: { breakdown: MatchBreakdown }) {
  const [expanded, setExpanded] = useState(false);

  const rows = [
    { label: 'Proportions', score: breakdown.bodyScore, weight: '30%' },
    { label: 'Color Harmony', score: breakdown.colorScore, weight: '25%', tag: breakdown.harmonyType },
    { label: 'Layer Logic', score: breakdown.layerScore, weight: '20%', passFail: true },
    { label: 'Undertone Match', score: breakdown.undertoneScore, weight: '15%' },
    { label: 'Feedback Memory', score: breakdown.feedbackScore, weight: '10%' },
  ];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#D6D0C8] bg-[#FAF8F5]/60">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-[#EDE9E3]/40"
      >
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-600">
          <Brain className="h-3.5 w-3.5" />
          Match Analysis Matrix
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-stone-600">{breakdown.total}%</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2 border-t border-[#D6D0C8]/60 px-4 py-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-28 flex-shrink-0 font-mono text-[9px] uppercase tracking-wider text-stone-400">
                {row.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#D6D0C8]">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.score >= 80
                      ? 'bg-emerald-400'
                      : row.score >= 60
                      ? 'bg-stone-600'
                      : row.score >= 40
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${row.score}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] font-semibold text-stone-600">
                {row.passFail ? (row.score > 0 ? 'Pass' : 'Fail') : `${row.score}%`}
              </span>
              <span className="w-8 text-right font-mono text-[8px] text-stone-400">{row.weight}</span>
            </div>
          ))}
          {breakdown.harmonyType && (
            <p className="pt-1 font-mono text-[9px] text-stone-400">
              Harmony: {breakdown.harmonyType}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
