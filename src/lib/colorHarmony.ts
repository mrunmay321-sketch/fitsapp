import type { ClothingItem, SkinUndertone } from '../types';
import { UNDERTONE_COLORS } from '../constants';

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HSL | null {
  if (!hex) return null;
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: hue = ((g - b) / d) % 6; break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s, l };
}

function hueDistance(a: number, b: number): number {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export type HarmonyType = 'monochromatic' | 'analogous' | 'complementary' | 'neutral' | 'none';

export function classifyHarmony(items: ClothingItem[]): HarmonyType {
  const hsls = items
    .map((i) => (i.colorHex ? hexToHsl(i.colorHex) : null))
    .filter((h): h is HSL => h !== null);
  if (hsls.length < 2) return 'none';

  const nonNeutral = hsls.filter((h) => h.s > 0.15);
  const neutrals = hsls.filter((h) => h.s <= 0.15);

  if (nonNeutral.length === 0) return 'neutral';

  if (nonNeutral.length === 1 && neutrals.length >= 1) return 'neutral';

  const [a, b] = nonNeutral;
  const hd = hueDistance(a.h, b.h);

  if (hd <= 15) return 'monochromatic';
  if (hd <= 30) return 'analogous';
  if (hd >= 160 && hd <= 200) return 'complementary';

  if (nonNeutral.length >= 2 && neutrals.length >= 1) return 'neutral';

  return 'none';
}

export interface HarmonyScore {
  score: number;
  type: HarmonyType;
  label: string;
}

export function scoreColorHarmony(items: ClothingItem[]): HarmonyScore {
  const type = classifyHarmony(items);
  const map: Record<HarmonyType, { score: number; label: string }> = {
    monochromatic: { score: 95, label: 'Monochromatic' },
    analogous: { score: 90, label: 'Analogous' },
    complementary: { score: 85, label: 'High Contrast' },
    neutral: { score: 88, label: 'Neutral Balanced' },
    none: { score: 55, label: 'Unmatched' },
  };
  return { score: map[type].score, type, label: map[type].label };
}

export function scoreUndertoneMatch(items: ClothingItem[], undertone: SkinUndertone): number {
  if (undertone === 'Neutral') return 75;
  const preferred = UNDERTONE_COLORS[undertone].map((c) => c.toLowerCase());
  let matched = 0;
  let total = 0;
  for (const item of items) {
    if (!item.colorHex) continue;
    total++;
    const color = item.color.toLowerCase();
    const isMatch = preferred.some(
      (p) => color.includes(p.split(' ')[0]) || p.includes(color.split(' ')[0])
    );
    if (isMatch) matched++;
  }
  if (total === 0) return 60;
  return Math.round((matched / total) * 100);
}

export interface MatchBreakdown {
  bodyScore: number;
  colorScore: number;
  layerScore: number;
  undertoneScore: number;
  feedbackScore: number;
  total: number;
  harmonyType: string;
}

export function computeMatchBreakdown(
  bodyScore: number,
  colorScore: number,
  layerScore: number,
  undertoneScore: number,
  feedbackScore: number
): MatchBreakdown {
  const total = Math.round(
    bodyScore * 0.30 +
    colorScore * 0.25 +
    layerScore * 0.20 +
    undertoneScore * 0.15 +
    feedbackScore * 0.10
  );
  return {
    bodyScore: Math.round(bodyScore),
    colorScore: Math.round(colorScore),
    layerScore: Math.round(layerScore),
    undertoneScore: Math.round(undertoneScore),
    feedbackScore: Math.round(feedbackScore),
    total,
    harmonyType: '',
  };
}
