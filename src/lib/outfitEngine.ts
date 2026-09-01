import type {
  ClothingItem,
  Weather,
  Occasion,
  GeneratedOutfit,
  BodyMatrix,
  FitStyle,
  MainCategory,
  SkinUndertone,
  LayerTag,
} from '../types';
import { INSPO_FITS, UNDERTONE_COLORS, getLayerTag } from '../constants';
import { uid, pick, shuffle } from './utils';

import {
  type PreferenceScores,
  getTotalPreferenceScore,
  isBlacklisted,
} from './preferenceEngine';
import { scoreColorHarmony, scoreUndertoneMatch, hexToHsl, type MatchBreakdown } from './colorHarmony';
import type { MatchBreakdown as MatchBreakdownType, WishlistItem } from '../types';

/* ── Body Matrix math ──────────────────────────────────────────── */

export interface BodyProfile {
  shoulderToWaist: number;
  waistToHip: number;
  isVTaper: boolean;
  isTall: boolean;
  isShort: boolean;
  height: number;
  bmi: number | null;
  undertone: SkinUndertone;
}

export function computeBodyProfile(body: BodyMatrix | null): BodyProfile | null {
  if (!body || body.shoulder <= 0 || body.waist <= 0 || body.hips <= 0 || body.height <= 0)
    return null;
  const shoulderToWaist = body.shoulder / body.waist;
  const waistToHip = body.waist / body.hips;
  const isVTaper = shoulderToWaist > 1.2;
  const isTall = body.height > 180;
  const isShort = body.height < 175;
  const bmi = body.weight > 0 ? body.weight / Math.pow(body.height / 100, 2) : null;
  return {
    shoulderToWaist,
    waistToHip,
    isVTaper,
    isTall,
    isShort,
    height: body.height,
    bmi,
    undertone: body.undertone ?? 'Neutral',
  };
}

/* ── Layer classification & sleeve compatibility ──────────────── */

function getLayer(item: ClothingItem): LayerTag | undefined {
  if (item.layerTag) return item.layerTag;
  return getLayerTag(item.subcategory);
}

function isLongSleeve(item: ClothingItem): boolean {
  const sub = item.subcategory.toLowerCase();
  return sub.includes('long-sleeve') || sub.includes('sweater') || sub.includes('cardigan') || sub.includes('flannel') || sub.includes('overshirt');
}

const FIT_RANK: Record<FitStyle, number> = {
  'Fitted': 0,
  'Regular': 1,
  'Baggy/Oversized': 2,
};

/**
 * Strict compatibility rules:
 * - Never pair two long-sleeve items unless the outer is Mid (Open Overshirt/Flannel) or Outer (Jacket/Coat)
 *   AND the outer is Oversized or Relaxed fit.
 * - Two fitted long-sleeve crewnecks or two long-sleeve sweaters must NEVER be layered.
 * - Inner item fit must be tighter than or equal to outer item fit.
 */
function isLayeringCompatible(inner: ClothingItem, outer: ClothingItem): boolean {
  const innerLayer = getLayer(inner);
  const outerLayer = getLayer(outer);

  if (!innerLayer || !outerLayer) return true;

  // Outer must be a higher layer than inner
  const layerOrder: LayerTag[] = ['Base', 'Mid', 'Outer'];
  if (layerOrder.indexOf(outerLayer) <= layerOrder.indexOf(innerLayer)) return false;

  // Fit hierarchy: inner must be tighter or equal to outer
  if (FIT_RANK[inner.fit] > FIT_RANK[outer.fit]) return false;

  // Two long-sleeve items: forbidden unless outer is Mid (Open Overshirt/Flannel) or Outer with Oversized/Regular fit
  if (isLongSleeve(inner) && isLongSleeve(outer)) {
    const outerIsOpenOrJacket =
      outerLayer === 'Outer' ||
      ['Flannels', 'Overshirts', 'Cardigans'].includes(outer.subcategory);
    const outerIsRelaxed = outer.fit === 'Baggy/Oversized' || outer.fit === 'Regular';

    if (!outerIsOpenOrJacket || !outerIsRelaxed) return false;

    // Two fitted long-sleeve crewnecks or two long-sleeve sweaters: never allowed
    if (inner.fit === 'Fitted' && outer.fit === 'Fitted') return false;
    if (inner.subcategory === 'Sweaters' && outer.subcategory === 'Sweaters') return false;
  }

  // Only base or fitted mid layers under long-sleeve outerwear
  if (isLongSleeve(outer) && innerLayer === 'Mid' && inner.fit !== 'Fitted') {
    // Mid layer under long-sleeve outer must be fitted
    if (isLongSleeve(inner)) return false;
  }

  return true;
}

function validateOutfitLayers(items: ClothingItem[]): boolean {
  const upperBody = items.filter(
    (i) => i.mainCategory === 'Tops' || i.mainCategory === 'Jackets'
  );
  if (upperBody.length < 2) return true;

  // Sort by layer order
  const layerOrder: LayerTag[] = ['Base', 'Mid', 'Outer'];
  const sorted = [...upperBody].sort(
    (a, b) => layerOrder.indexOf(getLayer(a) ?? 'Base') - layerOrder.indexOf(getLayer(b) ?? 'Base')
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    if (!isLayeringCompatible(sorted[i], sorted[i + 1])) return false;
  }
  return true;
}

/* ── Occasion-specific logic ──────────────────────────────────── */

const OCCASION_RULES: Record<Occasion, {
  tops: string[];
  bottoms: string[];
  shoes: string[];
  preferDark?: boolean;
  preferLayered?: boolean;
}> = {
  College: {
    tops: ['Short-Sleeve Tee', 'Short-Sleeve Henley', 'Long-Sleeve Henley', 'Tank'],
    bottoms: ['Baggy Jeans', 'Cargo Pants', 'Loose Jeans'],
    shoes: ['Sneakers', 'Boots'],
  },
  'Street Outdoors': {
    tops: ['Short-Sleeve Tee', 'Long-Sleeve Tee', 'Flannels', 'Overshirts'],
    bottoms: ['Baggy Jeans', 'Cargo Pants', 'Wide-Leg Trousers', 'Loose Jeans'],
    shoes: ['Boots', 'Sneakers'],
    preferLayered: true,
  },
  'Night Outs': {
    tops: ['Long-Sleeve Tee', 'Long-Sleeve Henley', 'Sweaters'],
    bottoms: ['Loose Jeans', 'Wide-Leg Trousers', 'Formal Trousers'],
    shoes: ['Boots', 'Loafers'],
    preferDark: true,
  },
  Hangouts: {
    tops: ['Short-Sleeve Tee', 'Long-Sleeve Tee', 'Long-Sleeve Henley', 'Sweaters', 'Cardigans'],
    bottoms: ['Baggy Jeans', 'Loose Jeans', 'Cargo Pants', 'Shorts'],
    shoes: ['Sneakers', 'Loafers', 'Boots'],
  },
};

function itemsByCat(items: ClothingItem[], cat: MainCategory): ClothingItem[] {
  return items.filter((i) => i.mainCategory === cat && !i.inLaundry);
}

function itemsBySub(items: ClothingItem[], subs: string[]): ClothingItem[] {
  return items.filter((i) => subs.includes(i.subcategory) && !i.inLaundry);
}

function weatherLayerCount(weather: Weather): number {
  if (weather === 'Cold/Layering') return 2;
  if (weather === 'Rainy') return 2;
  return 1;
}

/* ── Body-driven fit selection ─────────────────────────────────── */

function selectTopByBody(tops: ClothingItem[], profile: BodyProfile): ClothingItem | undefined {
  if (profile.isVTaper) {
    const fitted = tops.filter((t) => t.fit === 'Fitted');
    const regular = tops.filter((t) => t.fit === 'Regular');
    return pick(shuffle(fitted.length ? fitted : regular.length ? regular : tops));
  }
  const regular = tops.filter((t) => t.fit === 'Regular');
  return pick(shuffle(regular.length ? regular : tops));
}

function selectBottomByBody(
  bottoms: ClothingItem[],
  occasion: Occasion,
  profile: BodyProfile
): ClothingItem | undefined {
  if (profile.isVTaper) {
    const baggy = bottoms.filter((b) => b.fit === 'Baggy/Oversized' || b.subcategory.includes('Baggy'));
    const loose = bottoms.filter((b) => b.fit === 'Regular');
    return pick(shuffle(baggy.length ? baggy : loose.length ? loose : bottoms));
  }
  const rules = OCCASION_RULES[occasion];
  const preferred = itemsBySub(bottoms, rules.bottoms);
  return pick(shuffle(preferred.length ? preferred : bottoms));
}

function selectJacketByBody(jackets: ClothingItem[], profile: BodyProfile): ClothingItem | undefined {
  if (jackets.length === 0) return undefined;
  if (profile.isTall) {
    const long = jackets.filter((j) => ['Oversized Coats', 'Heavy Coats', 'Leather'].includes(j.subcategory));
    return pick(shuffle(long.length ? long : jackets));
  }
  if (profile.isShort) {
    const midHip = jackets.filter((j) => ['Bombers', 'Denim'].includes(j.subcategory));
    return pick(shuffle(midHip.length ? midHip : jackets));
  }
  return pick(shuffle(jackets));
}

function requiredLayerCount(profile: BodyProfile, weather: Weather): number {
  let count = weatherLayerCount(weather);
  if (!profile.isVTaper) count = Math.max(count, 2);
  return count;
}

/* ── Multi-variable scoring ─────────────────────────────────────── */

function scoreBodyMatrix(items: ClothingItem[], profile: BodyProfile): number {
  let score = 50;
  if (items.some((i) => i.mainCategory === 'Tops')) score += 10;
  if (items.some((i) => i.mainCategory === 'Bottoms')) score += 10;
  if (items.some((i) => i.mainCategory === 'Footwear')) score += 5;

  if (profile.isVTaper) {
    const fittedTop = items.some((i) => i.mainCategory === 'Tops' && i.fit === 'Fitted');
    const baggyBottom = items.some(
      (i) => i.mainCategory === 'Bottoms' && (i.fit === 'Baggy/Oversized' || i.subcategory.includes('Baggy'))
    );
    if (fittedTop) score += 15;
    if (baggyBottom) score += 10;
  } else {
    const topLayers = items.filter((i) => i.mainCategory === 'Tops').length;
    const hasJacket = items.some((i) => i.mainCategory === 'Jackets');
    const totalLayers = topLayers + (hasJacket ? 1 : 0);
    if (totalLayers >= 2) score += 15;
    if (totalLayers >= 3) score += 5;
  }

  if (profile.isTall) {
    const longOuter = items.some(
      (i) => i.mainCategory === 'Jackets' && ['Oversized Coats', 'Heavy Coats', 'Leather'].includes(i.subcategory)
    );
    if (longOuter) score += 8;
  }
  if (profile.isShort) {
    const midHip = items.some(
      (i) => i.mainCategory === 'Jackets' && ['Bombers', 'Denim'].includes(i.subcategory)
    );
    if (midHip) score += 8;
  }

  return Math.min(score, 100);
}

function scoreLayerLogic(items: ClothingItem[], weather: Weather): number {
  let score = 50;
  if (validateOutfitLayers(items)) score += 35;
  else return 0;

  if ((weather === 'Cold/Layering' || weather === 'Rainy') && items.some((i) => i.mainCategory === 'Jackets')) score += 15;
  if (weather === 'Warm' && !items.some((i) => i.mainCategory === 'Jackets')) score += 10;

  const upperLayers = items.filter((i) => i.mainCategory === 'Tops' || i.mainCategory === 'Jackets').length;
  if (upperLayers >= 2) score += 5;

  return Math.min(score, 100);
}

function scoreFeedback(items: ClothingItem[], prefScores: PreferenceScores): number {
  const raw = getTotalPreferenceScore(prefScores, items);
  if (raw >= 0) return Math.min(70 + raw, 100);
  return Math.max(50 + raw, 0);
}

function computeTotalMatch(
  bodyScore: number,
  colorScore: number,
  layerScore: number,
  undertoneScore: number,
  feedbackScore: number
): number {
  return Math.round(
    bodyScore * 0.30 +
    colorScore * 0.25 +
    layerScore * 0.20 +
    undertoneScore * 0.15 +
    feedbackScore * 0.10
  );
}

function scoreOutfit(
  items: ClothingItem[],
  occasion: Occasion,
  weather: Weather,
  profile: BodyProfile,
  prefScores: PreferenceScores
): { total: number; breakdown: MatchBreakdownType } {
  const bodyScore = scoreBodyMatrix(items, profile);
  const harmony = scoreColorHarmony(items);
  const layerScore = scoreLayerLogic(items, weather);
  const undertoneScore = scoreUndertoneMatch(items, profile.undertone);
  const feedbackScore = scoreFeedback(items, prefScores);

  let colorScore = harmony.score;

  const rules = OCCASION_RULES[occasion];
  const occasionTops = items.filter((i) => rules.tops.includes(i.subcategory));
  if (occasionTops.length > 0) { /* occasion bonus folded into body */ }
  if (rules.preferDark) {
    const dark = items.filter((i) =>
      ['black', 'charcoal', 'navy', 'burgundy', 'deep'].some((n) => i.color.toLowerCase().includes(n))
    );
    if (dark.length >= 2) colorScore = Math.min(colorScore + 5, 100);
  }

  const total = computeTotalMatch(bodyScore, colorScore, layerScore, undertoneScore, feedbackScore);

  return {
    total: Math.max(total, 35),
    breakdown: {
      bodyScore: Math.round(bodyScore),
      colorScore: Math.round(colorScore),
      layerScore: Math.round(layerScore),
      undertoneScore: Math.round(undertoneScore),
      feedbackScore: Math.round(feedbackScore),
      total: Math.max(total, 35),
      harmonyType: harmony.label,
    },
  };
}

/* ── Body match explanation ────────────────────────────────────── */

function buildBodyMatch(
  items: ClothingItem[],
  profile: BodyProfile,
  weather: Weather
): string {
  const top = items.find((i) => i.mainCategory === 'Tops');
  const bottom = items.find((i) => i.mainCategory === 'Bottoms');
  const jacket = items.find((i) => i.mainCategory === 'Jackets');

  const swRatio = profile.shoulderToWaist.toFixed(1);
  const height = Math.round(profile.height);
  const parts: string[] = [];

  if (profile.isVTaper) {
    const topDesc = top ? `${top.fit.toLowerCase()} ${top.subcategory.toLowerCase()}` : 'fitted top';
    const bottomDesc = bottom ? `${bottom.fit.toLowerCase()} ${bottom.subcategory.toLowerCase()}` : 'loose bottoms';
    parts.push(`Paired a ${topDesc} with ${bottomDesc} to highlight your ${swRatio} shoulder-to-waist ratio`);
  } else {
    const layerCount = items.filter((i) => i.mainCategory === 'Tops').length + (jacket ? 1 : 0);
    parts.push(`Built a ${layerCount}-layer combo to visually broaden your upper body, matching your ${swRatio} shoulder-to-waist ratio`);
  }

  if (profile.isTall && jacket) {
    parts.push(`with a ${jacket.subcategory.toLowerCase()} to match your ${height}cm height`);
  } else if (profile.isShort && jacket) {
    parts.push(`with a ${jacket.subcategory.toLowerCase()} to extend your leg line at ${height}cm`);
  } else if (jacket) {
    parts.push(`with a ${jacket.subcategory.toLowerCase()} suited to your ${height}cm frame`);
  }

  if (profile.undertone !== 'Neutral') {
    const colorList = UNDERTONE_COLORS[profile.undertone].slice(0, 3).join(', ');
    parts.push(`using ${colorList.toLowerCase()} tones that complement your ${profile.undertone.toLowerCase()} undertone`);
  }

  if (weather === 'Cold/Layering') parts.push('for cold-weather layering');
  if (weather === 'Rainy') parts.push('for wet-weather protection');

  let sentence = parts.join(', ') + '.';
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/* ── Build closet outfit ──────────────────────────────────────── */

function buildClosetOutfit(
  items: ClothingItem[],
  occasion: Occasion,
  weather: Weather,
  profile: BodyProfile,
  prefScores: PreferenceScores
): GeneratedOutfit | null {
  const tops = itemsByCat(items, 'Tops');
  const bottoms = itemsByCat(items, 'Bottoms');
  const jackets = itemsByCat(items, 'Jackets');
  const shoes = itemsByCat(items, 'Footwear');
  const accessories = itemsByCat(items, 'Accessories');

  if (!tops.length || !bottoms.length) return null;

  const rules = OCCASION_RULES[occasion];
  const layers = requiredLayerCount(profile, weather);
  const chosenTops: ClothingItem[] = [];

  // Base top — body-driven, occasion-filtered
  const basePool = itemsBySub(tops, rules.tops);
  const baseTop = selectTopByBody(basePool.length ? basePool : tops, profile);
  if (baseTop) chosenTops.push(baseTop);

  // Additional mid layer
  if (layers >= 2 && tops.length > 1) {
    const midPool = tops.filter(
      (t) =>
        t.id !== baseTop?.id &&
        (getLayer(t) === 'Mid' || getLayer(t) === 'Base') &&
        isLayeringCompatible(baseTop!, t)
    );
    const layer = pick(shuffle(midPool.length ? midPool : tops.filter((t) => t.id !== baseTop?.id)));
    if (layer && isLayeringCompatible(baseTop!, layer)) chosenTops.push(layer);
  }

  const chosenBottom = selectBottomByBody(bottoms, occasion, profile);
  const chosenJacket = selectJacketByBody(jackets, profile);

  // Validate jacket compatibility with top layers
  let validJacket = chosenJacket;
  if (chosenJacket && chosenTops.length > 0) {
    const lastTop = chosenTops[chosenTops.length - 1];
    if (!isLayeringCompatible(lastTop, chosenJacket)) {
      validJacket = undefined;
    }
  }

  const chosenShoes = pick(shuffle(shoes.length ? shoes : []));
  const chosenAcc = pick(shuffle(accessories.length ? accessories : []));

  let outfitItems = [
    ...chosenTops,
    chosenBottom,
    validJacket,
    chosenShoes,
    chosenAcc,
  ].filter(Boolean) as ClothingItem[];

  if (!outfitItems.length) return null;

  // Layer validation
  if (!validateOutfitLayers(outfitItems)) {
    let attempts = 0;
    while (attempts < 8 && !validateOutfitLayers(outfitItems)) {
      const reshuffled = [
        ...chosenTops,
        selectBottomByBody(bottoms, occasion, profile),
        selectJacketByBody(jackets, profile),
        pick(shuffle(shoes.length ? shoes : [])),
        pick(shuffle(accessories.length ? accessories : [])),
      ].filter(Boolean) as ClothingItem[];
      if (reshuffled.length) outfitItems = reshuffled;
      attempts++;
    }
    if (!validateOutfitLayers(outfitItems)) return null;
  }

  // Exclude blacklisted combinations
  if (isBlacklisted(prefScores, outfitItems)) {
    let attempts = 0;
    while (attempts < 5 && isBlacklisted(prefScores, outfitItems)) {
      const reshuffled = [
        ...chosenTops,
        selectBottomByBody(bottoms, occasion, profile),
        selectJacketByBody(jackets, profile),
        pick(shuffle(shoes.length ? shoes : [])),
        pick(shuffle(accessories.length ? accessories : [])),
      ].filter(Boolean) as ClothingItem[];
      if (reshuffled.length) outfitItems = reshuffled;
      attempts++;
    }
    if (isBlacklisted(prefScores, outfitItems)) return null;
  }

  const { total: matchScore, breakdown: matchBreakdown } = scoreOutfit(outfitItems, occasion, weather, profile, prefScores);
  const aesthetic = deriveAesthetic(occasion, outfitItems);
  const bodyMatch = buildBodyMatch(outfitItems, profile, weather);

  return {
    id: uid(),
    source: 'closet',
    weather,
    occasion,
    title: titleFor(occasion, aesthetic),
    description: describeClosetFit(outfitItems, occasion, weather),
    aesthetic,
    items: outfitItems,
    matchScore,
    bodyMatch,
    preferenceScore: getTotalPreferenceScore(prefScores, outfitItems),
    matchBreakdown,
  };
}

function deriveAesthetic(occasion: Occasion, items: ClothingItem[]): string {
  const hasBaggy = items.some(
    (i) => i.mainCategory === 'Bottoms' && (i.fit === 'Baggy/Oversized' || i.subcategory.includes('Baggy'))
  );
  const hasFittedTop = items.some((i) => i.mainCategory === 'Tops' && i.fit === 'Fitted');
  if ((occasion === 'College' || occasion === 'Street Outdoors') && hasBaggy && hasFittedTop)
    return 'Late-90s Off-Duty';
  if (occasion === 'Night Outs') return 'Smart Streetwear';
  if (occasion === 'Street Outdoors') return 'Smart Streetwear';
  if (occasion === 'Hangouts') return 'Smart Casual';
  return 'Smart Casual';
}

function titleFor(occasion: Occasion, aesthetic: string): string {
  const map: Record<Occasion, string> = {
    College: 'Campus Off-Duty',
    'Street Outdoors': 'Street Protocol',
    'Night Outs': 'After Dark',
    Hangouts: 'Easy Hangout',
  };
  return `${map[occasion]} · ${aesthetic}`;
}

function describeClosetFit(
  items: ClothingItem[],
  occasion: Occasion,
  weather: Weather
): string {
  const top = items.find((i) => i.mainCategory === 'Tops');
  const bottom = items.find((i) => i.mainCategory === 'Bottoms');
  const jacket = items.find((i) => i.mainCategory === 'Jackets');
  const shoe = items.find((i) => i.mainCategory === 'Footwear');

  const parts: string[] = [];
  if (top) parts.push(`${top.color.toLowerCase()} ${top.subcategory.toLowerCase()} (${top.fit.toLowerCase()})`);
  if (jacket) parts.push(`layered under a ${jacket.color.toLowerCase()} ${jacket.subcategory.toLowerCase()}`);
  if (bottom) parts.push(`${bottom.color.toLowerCase()} ${bottom.subcategory.toLowerCase()} (${bottom.fit.toLowerCase()})`);
  if (shoe) parts.push(`finished with ${shoe.color.toLowerCase()} ${shoe.subcategory.toLowerCase()}`);

  let desc = parts.join(', ') + '.';
  if (weather === 'Cold/Layering') desc += ' Layered for warmth with a collar or tee peeking through.';
  if (weather === 'Rainy') desc += ' Weather-resistant layers chosen for wet conditions.';
  if (occasion === 'College') desc += ' Low-effort comfort fit for campus days.';
  if (occasion === 'Night Outs') desc += ' Darker palette and sharper lines for after-dark energy.';
  if (occasion === 'Street Outdoors') desc += ' Structured layering for urban outdoor wear.';
  if (occasion === 'Hangouts') desc += ' Effortless relaxed casual combination.';
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

/* ── Build inspo outfit ────────────────────────────────────────── */

function buildInspoOutfit(
  items: ClothingItem[],
  occasion: Occasion,
  weather: Weather,
  profile: BodyProfile,
  prefScores: PreferenceScores
): GeneratedOutfit {
  const pool = INSPO_FITS.filter(
    (f) => f.occasions.includes(occasion) && f.weathers.includes(weather)
  );
  const fit = pick(shuffle(pool.length ? pool : INSPO_FITS))!;

  const inspoItems: ClothingItem[] = fit.items.map((item, idx) => ({
    id: `inspo_${idx}_${fit.caption.slice(0, 10)}`,
    mainCategory: item.category,
    subcategory: item.subcategory,
    color: item.color,
    colorHex: item.colorHex,
    fit: item.fit,
    layerTag: getLayerTag(item.subcategory),
    inLaundry: false,
    imageData: undefined,
    createdAt: Date.now(),
  }));

  const bodyMatch = buildBodyMatch(inspoItems, profile, weather);
  const { total: matchScore, breakdown: matchBreakdown } = scoreOutfit(inspoItems, occasion, weather, profile, prefScores);

  return {
    id: uid(),
    source: 'inspo',
    weather,
    occasion,
    title: titleFor(occasion, fit.aesthetic),
    description: fit.caption,
    aesthetic: fit.aesthetic,
    items: inspoItems,
    inspoCaption: fit.caption,
    matchScore,
    bodyMatch,
    preferenceScore: getTotalPreferenceScore(prefScores, inspoItems),
    matchBreakdown,
  };
}

/* ── Public API ───────────────────────────────────────────────── */

export function generateOutfit(
  items: ClothingItem[],
  occasion: Occasion,
  weather: Weather,
  source: 'closet' | 'inspo',
  body: BodyMatrix | null,
  prefScores: PreferenceScores
): GeneratedOutfit | null {
  const profile = computeBodyProfile(body);
  const effectiveProfile: BodyProfile = profile ?? {
    shoulderToWaist: 1.0,
    waistToHip: 1.0,
    isVTaper: false,
    isTall: false,
    isShort: false,
    height: 175,
    bmi: null,
    undertone: body?.undertone ?? 'Neutral',
  };

  if (source === 'inspo')
    return buildInspoOutfit(items, occasion, weather, effectiveProfile, prefScores);
  return buildClosetOutfit(items, occasion, weather, effectiveProfile, prefScores);
}

export function buyOrPass(
  imageData: string,
  items: ClothingItem[],
  body: BodyMatrix | null
): import('../types').ScanResult {
  const profile = computeBodyProfile(body);
  const matchScore = Math.floor(62 + Math.random() * 33);
  const verdict: 'BUY' | 'PASS' = matchScore >= 75 ? 'BUY' : 'PASS';

  const breakdown: string[] = [];
  const tops = itemsByCat(items, 'Tops').length;
  const bottoms = itemsByCat(items, 'Bottoms').length;

  if (tops < 3) breakdown.push('Your top rotation is thin — this adds valuable mix-and-match range.');
  else if (bottoms < 2) breakdown.push('Limited bottom options — this fills a gap in your rotation.');
  else breakdown.push('You have solid base pieces; this complements your existing palette.');

  if (profile) {
    if (profile.isVTaper)
      breakdown.push(`Your ${profile.shoulderToWaist.toFixed(1)} shoulder-to-waist ratio favors fitted tops — this piece works with that silhouette.`);
    else
      breakdown.push(`Your ${profile.shoulderToWaist.toFixed(1)} shoulder-to-waist ratio benefits from layering — this adds depth to your frame.`);

    if (profile.isTall)
      breakdown.push(`At ${Math.round(profile.height)}cm, long-line cuts complement your proportions.`);
    else if (profile.isShort)
      breakdown.push(`At ${Math.round(profile.height)}cm, mid-hip and cropped cuts extend your leg line.`);

    if (profile.undertone !== 'Neutral') {
      const colorList = UNDERTONE_COLORS[profile.undertone].slice(0, 3).join(', ');
      breakdown.push(`Your ${profile.undertone.toLowerCase()} undertone pairs best with ${colorList.toLowerCase()}.`);
    }
  } else {
    breakdown.push('Set up your Body Matrix for personalized proportion analysis.');
  }

  if (matchScore >= 80) breakdown.push('High wardrobe compatibility — pairs with multiple existing items.');
  else if (verdict === 'PASS') breakdown.push('Lower versatility — similar pieces may already cover this slot.');

  const pairsWellWith = shuffle(items.filter((i) => !i.inLaundry)).slice(0, 3);

  return { verdict, matchScore, breakdown, pairsWellWith, imageData, timestamp: Date.now() };
}

/* ── Buy Recommendations Engine ───────────────────────────────── */

export function generateBuyRecommendations(
  items: ClothingItem[],
  body: BodyMatrix | null
): import('../types').BuyRecommendation[] {
  const profile = computeBodyProfile(body);
  const undertone = body?.undertone ?? 'Neutral';
  const recs: import('../types').BuyRecommendation[] = [];
  const closetItems = items;

  // Category audit
  const counts: Record<MainCategory, number> = {
    Tops: 0, Bottoms: 0, Jackets: 0, Footwear: 0, Accessories: 0,
  };
  for (const item of items) counts[item.mainCategory]++;

  // Layer audit for tops
  const baseLayers = items.filter((i) => i.mainCategory === 'Tops' && getLayer(i) === 'Base');
  const midLayers = items.filter((i) => i.mainCategory === 'Tops' && getLayer(i) === 'Mid');
  const outerLayers = items.filter((i) => i.mainCategory === 'Jackets');

  // Fit audit
  const fittedTops = items.filter((i) => i.mainCategory === 'Tops' && i.fit === 'Fitted');
  const baggyBottoms = items.filter((i) => i.mainCategory === 'Bottoms' && (i.fit === 'Baggy/Oversized' || i.subcategory.includes('Baggy')));
  const fittedBottoms = items.filter((i) => i.mainCategory === 'Bottoms' && i.fit === 'Fitted');

  const preferredColors = UNDERTONE_COLORS[undertone];
  const pickColor = (offset: number) => preferredColors[offset % preferredColors.length];

  let priority = 100;

  // Missing mid-layer overshirts/flannels
  if (midLayers.length === 0) {
    const color = pickColor(0);
    recs.push({
      id: uid(),
      name: `${color} Oversized Flannel`,
      category: 'Tops',
      fit: 'Baggy/Oversized',
      color,
      layerTag: 'Mid',
      reasonWhy: 'Fills your missing Mid-Layer category. An open flannel or overshirt is the most versatile layering piece — it works over base tees and under outer jackets.',
      reasonFit: profile?.isVTaper
        ? `Oversized fit balances your V-Taper profile by adding visual weight to the upper body. ${color} complements your ${undertone} skin undertone.`
        : `Regular fit adds structured layering depth to your frame. ${color} complements your ${undertone} skin undertone.`,
      priority: priority--,
    });
  }

  // Missing jackets/outerwear
  if (outerLayers.length === 0) {
    const color = pickColor(1);
    recs.push({
      id: uid(),
      name: `${color} Bomber Jacket`,
      category: 'Jackets',
      fit: 'Regular',
      color,
      layerTag: 'Outer',
      reasonWhy: `You have zero outerwear. A ${color.toLowerCase()} bomber is the most versatile outer layer — it pairs with ${items.length > 0 ? 'your existing tops and bottoms' : 'any base wardrobe'}.`,
      reasonFit: profile?.isShort
        ? `Mid-hip cut extends your leg line at ${Math.round(profile.height)}cm. ${color} complements your ${undertone} undertone.`
        : `Structured silhouette works with your ${Math.round(profile?.height ?? 175)}cm frame. ${color} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // V-Taper: missing fitted base layers
  if (profile?.isVTaper && fittedTops.length === 0) {
    const color = pickColor(2);
    recs.push({
      id: uid(),
      name: `${color} Fitted Short-Sleeve Tee`,
      category: 'Tops',
      fit: 'Fitted',
      color,
      layerTag: 'Base',
      reasonWhy: 'Your V-Taper profile calls for fitted base layers to highlight your shoulder-to-waist ratio, but you have none.',
      reasonFit: `Fitted cut accentuates your ${profile.shoulderToWaist.toFixed(1)} shoulder-to-waist ratio. ${color} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // Missing baggy bottoms when user has fitted tops
  if (fittedTops.length > 0 && baggyBottoms.length === 0) {
    const color = pickColor(3);
    recs.push({
      id: uid(),
      name: `${color} Baggy Jeans`,
      category: 'Bottoms',
      fit: 'Baggy/Oversized',
      color,
      reasonWhy: `You have ${fittedTops.length} fitted top${fittedTops.length !== 1 ? 's' : ''} but no baggy bottoms to balance the silhouette. Baggy denim creates the classic fitted-top / loose-bottom proportion.`,
      reasonFit: `Loose fit balances your upper body proportions. ${color} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // Missing fitted bottoms when user has baggy tops
  if (items.some((i) => i.mainCategory === 'Tops' && i.fit === 'Baggy/Oversized') && fittedBottoms.length === 0 && counts.Bottoms < 3) {
    const color = pickColor(4);
    recs.push({
      id: uid(),
      name: `${color} Loose Straight Trousers`,
      category: 'Bottoms',
      fit: 'Regular',
      color,
      reasonWhy: 'You have oversized tops but no straight or fitted bottoms to ground the silhouette. A straight-leg trouser anchors loose upper layers.',
      reasonFit: `Regular fit grounds your oversized tops without competing. ${color} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // Missing footwear
  if (counts.Footwear === 0) {
    recs.push({
      id: uid(),
      name: `${pickColor(5)} Sneakers`,
      category: 'Footwear',
      fit: 'Regular',
      color: pickColor(5),
      reasonWhy: 'You have no footwear at all. A versatile sneaker is the foundation of any off-duty or casual rotation.',
      reasonFit: `Pairs with ${counts.Bottoms > 0 ? 'your existing bottoms' : 'any bottom choice'}. ${pickColor(5)} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // Missing base layer tanks/tees
  if (baseLayers.length === 0) {
    const color = pickColor(6);
    recs.push({
      id: uid(),
      name: `${color} Short-Sleeve Tee`,
      category: 'Tops',
      fit: 'Fitted',
      color,
      layerTag: 'Base',
      reasonWhy: 'You have no base-layer tees. A short-sleeve tee is the most essential starting point for any outfit stack.',
      reasonFit: `Base layer that works under all mid and outer layers. ${color} complements your ${undertone} undertone.`,
      priority: priority--,
    });
  }

  // Accessory gap
  if (counts.Accessories === 0 && items.length > 3) {
    recs.push({
      id: uid(),
      name: 'Leather Belt',
      category: 'Accessories',
      fit: 'Regular',
      color: 'Brown',
      reasonWhy: 'You have a growing wardrobe but no accessories. A leather belt pulls together any tucked or layered look.',
      reasonFit: `Versatile neutral that works across your existing palette.`,
      priority: priority--,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 6).map((rec) => {
    const unlock = calculateUnlockScore(
      { category: rec.category, fit: rec.fit, subcategory: rec.name.replace(/.*\s/, '').trim(), colorHex: undefined },
      closetItems,
      body
    );
    return { ...rec, unlockScore: unlock.unlockScore, unlockCount: unlock.unlockCount };
  });
}

/* ── Outfit Unlock Calculator ─────────────────────────────────── */

export interface UnlockResult {
  unlockScore: number;
  unlockCount: number;
}

export function calculateUnlockScore(
  candidate: { category: MainCategory; fit: FitStyle; subcategory?: string; colorHex?: string },
  closetItems: ClothingItem[],
  body: BodyMatrix | null
): UnlockResult {
  const profile = computeBodyProfile(body);
  const effectiveProfile: BodyProfile = profile ?? {
    shoulderToWaist: 1.0,
    waistToHip: 1.0,
    isVTaper: false,
    isTall: false,
    isShort: false,
    height: 175,
    bmi: null,
    undertone: body?.undertone ?? 'Neutral',
  };

  const candidateItem: ClothingItem = {
    id: 'candidate',
    mainCategory: candidate.category,
    subcategory: candidate.subcategory ?? '',
    color: '',
    colorHex: candidate.colorHex,
    fit: candidate.fit,
    layerTag: getLayerTag(candidate.subcategory ?? ''),
    inLaundry: false,
    createdAt: Date.now(),
  };

  const tops = closetItems.filter((i) => i.mainCategory === 'Tops' && !i.inLaundry);
  const bottoms = closetItems.filter((i) => i.mainCategory === 'Bottoms' && !i.inLaundry);
  const footwear = closetItems.filter((i) => i.mainCategory === 'Footwear' && !i.inLaundry);
  const jackets = closetItems.filter((i) => i.mainCategory === 'Jackets' && !i.inLaundry);

  let validCombos = 0;
  let highScoreCombos = 0;
  const threshold = 0.75;

  const tryCombo = (top: ClothingItem, bottom: ClothingItem, shoe: ClothingItem | undefined, jacket: ClothingItem | undefined) => {
    const combo = [top, bottom, ...(shoe ? [shoe] : []), ...(jacket ? [jacket] : []), candidateItem].filter(
      (i, _idx, arr) => arr.findIndex((x) => x.id === i.id) === _idx
    ) as ClothingItem[];

    if (!validateOutfitLayers(combo)) return;

    const score = scoreOutfit(combo, 'Hangouts', 'Warm', effectiveProfile, { itemCombo: {}, attributes: {} });
    const normalized = score.total / 100;
    validCombos++;
    if (normalized >= threshold) highScoreCombos++;
  };

  if (candidate.category === 'Tops' || candidate.category === 'Jackets') {
    for (const top of (candidate.category === 'Tops' ? [candidateItem] : tops)) {
      for (const bottom of bottoms) {
        const shoe = footwear[0];
        const jacket = candidate.category === 'Jackets' ? candidateItem : jackets[0];
        if (candidate.category === 'Tops') {
          tryCombo(top, bottom, shoe, jacket);
        } else {
          const realTop = tops[0];
          if (realTop) tryCombo(realTop, bottom, shoe, jacket);
        }
      }
    }
  } else if (candidate.category === 'Bottoms') {
    for (const top of tops) {
      for (const bottom of [candidateItem]) {
        tryCombo(top, bottom, footwear[0], jackets[0]);
      }
    }
  } else if (candidate.category === 'Footwear') {
    for (const top of tops) {
      for (const bottom of bottoms) {
        tryCombo(top, bottom, candidateItem, jackets[0]);
      }
    }
  } else {
    validCombos = closetItems.length;
    highScoreCombos = Math.floor(closetItems.length * 0.7);
  }

  const maxPossible = Math.max(tops.length * bottoms.length, 1);
  const unlockScore = validCombos > 0 ? Math.round((highScoreCombos / validCombos) * 100) : 0;

  return { unlockScore, unlockCount: highScoreCombos };
}

/* ── Replicate Matcher (Inspo → Closet) ────────────────────────── */

export interface ReplicateMatch {
  inspoItem: { category: string; color?: string; colorHex?: string; fit?: string };
  closetItem?: ClothingItem;
  similarity: number;
  missing: boolean;
}

export function replicateFromCloset(
  inspoItems: { category: string; color?: string; colorHex?: string; fit?: string; subcategory?: string }[],
  closetItems: ClothingItem[]
): ReplicateMatch[] {
  return inspoItems.map((inspo) => {
    const cat = inspo.category as MainCategory;
    const pool = closetItems.filter((i) => i.mainCategory === cat && !i.inLaundry);

    let bestMatch: ClothingItem | undefined;
    let bestScore = 0;

    for (const item of pool) {
      let score = 0.3;

      if (inspo.fit && item.fit === inspo.fit) score += 0.25;

      if (inspo.colorHex && item.colorHex) {
        const inspoHsl = hexToHsl(inspo.colorHex);
        const itemHsl = hexToHsl(item.colorHex);
        if (inspoHsl && itemHsl) {
          let hueDiff = Math.abs(inspoHsl.h - itemHsl.h);
          if (hueDiff > 180) hueDiff = 360 - hueDiff;
          const hueSim = 1 - hueDiff / 180;
          const lightSim = 1 - Math.abs(inspoHsl.l - itemHsl.l);
          score += (hueSim * 0.25 + lightSim * 0.15);
        }
      } else if (inspo.color && item.color) {
        const inspoLower = inspo.color.toLowerCase();
        const itemLower = item.color.toLowerCase();
        if (inspoLower === itemLower || inspoLower.includes(itemLower) || itemLower.includes(inspoLower)) {
          score += 0.2;
        }
      }

      if (inspo.subcategory && item.subcategory === inspo.subcategory) score += 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    return {
      inspoItem: inspo,
      closetItem: bestMatch,
      similarity: Math.round(bestScore * 100),
      missing: !bestMatch || bestScore < 0.4,
    };
  });
}

export function buildReplicateOutfitItems(
  matches: ReplicateMatch[]
): { items: ClothingItem[]; missingSlots: import('../components/FlatLayCanvas').FlatLayMissingSlot[] } {
  const items: ClothingItem[] = [];
  const missingSlots: import('../components/FlatLayCanvas').FlatLayMissingSlot[] = [];

  for (const match of matches) {
    if (match.closetItem && !match.missing) {
      items.push(match.closetItem);
    } else {
      const cat = match.inspoItem.category as MainCategory;
      missingSlots.push({
        category: cat,
        label: `Missing ${match.inspoItem.color ?? ''} ${match.inspoItem.subcategory ?? cat}`.trim(),
      });
    }
  }

  return { items, missingSlots };
}

/* ── Wishlist Simulation ──────────────────────────────────────── */

export function simulateWishlistOutfits(
  wishlist: WishlistItem[],
  closetItems: ClothingItem[],
  occasion: Occasion,
  weather: Weather,
  body: BodyMatrix | null,
  prefScores: PreferenceScores
): GeneratedOutfit[] {
  const simulatedItems: ClothingItem[] = wishlist.map((w) => ({
    id: `sim_${w.id}`,
    mainCategory: w.category,
    subcategory: '',
    color: w.color,
    fit: w.fit,
    layerTag: w.layerTag,
    inLaundry: false,
    createdAt: w.addedAt,
  }));

  const allItems = [...closetItems, ...simulatedItems];
  const results: GeneratedOutfit[] = [];

  for (let i = 0; i < 3; i++) {
    const outfit = buildClosetOutfit(allItems, occasion, weather, computeBodyProfile(body) ?? {
      shoulderToWaist: 1.0,
      waistToHip: 1.0,
      isVTaper: false,
      isTall: false,
      isShort: false,
      height: 175,
      bmi: null,
      undertone: body?.undertone ?? 'Neutral',
    }, prefScores);
    if (outfit) results.push(outfit);
  }

  return results;
}
