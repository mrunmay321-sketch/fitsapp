import type { ClothingItem, GeneratedOutfit } from '../types';

export interface PreferenceScores {
  itemCombo: Record<string, number>;
  attributes: Record<string, number>;
}

const STORAGE_KEY = 'nefitty-preference-scores';

export function loadPreferenceScores(): PreferenceScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PreferenceScores;
  } catch {
    // ignore
  }
  return { itemCombo: {}, attributes: {} };
}

export function savePreferenceScores(scores: PreferenceScores): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore
  }
}

function comboKey(items: ClothingItem[]): string {
  return items.map((i) => i.id).sort().join('|');
}

function extractAttributes(items: ClothingItem[]): string[] {
  const attrs: string[] = [];
  const top = items.find((i) => i.mainCategory === 'Tops');
  const bottom = items.find((i) => i.mainCategory === 'Bottoms');
  const jacket = items.find((i) => i.mainCategory === 'Jackets');

  if (top && bottom) {
    attrs.push(`top:${top.fit}+bottom:${bottom.fit}`);
  }
  if (top) attrs.push(`color:${top.color}`);
  if (bottom) attrs.push(`color:${bottom.color}`);
  if (jacket) attrs.push(`layered-outerwear:${jacket.subcategory}`);

  // Color pairing
  const colors = items.map((i) => i.color);
  if (colors.length >= 2) {
    attrs.push(`palette:${colors.slice(0, 2).sort().join('+')}`);
  }

  // Fit pairing
  const fits = items.map((i) => i.fit);
  if (fits.length >= 2) {
    attrs.push(`fit-pair:${fits.slice(0, 2).sort().join('+')}`);
  }

  return attrs;
}

export function applyFeedback(
  scores: PreferenceScores,
  outfit: GeneratedOutfit,
  feedback: 'love' | 'dislike'
): PreferenceScores {
  const newScores: PreferenceScores = {
    itemCombo: { ...scores.itemCombo },
    attributes: { ...scores.attributes },
  };

  const key = comboKey(outfit.items);
  const attrs = extractAttributes(outfit.items);

  if (feedback === 'love') {
    newScores.itemCombo[key] = (newScores.itemCombo[key] ?? 0) + 15;
    for (const attr of attrs) {
      newScores.attributes[attr] = (newScores.attributes[attr] ?? 0) + 5;
    }
  } else {
    newScores.itemCombo[key] = (newScores.itemCombo[key] ?? 0) - 30;
    for (const attr of attrs) {
      newScores.attributes[attr] = (newScores.attributes[attr] ?? 0) - 10;
    }
  }

  savePreferenceScores(newScores);
  return newScores;
}

export function getComboScore(scores: PreferenceScores, items: ClothingItem[]): number {
  return scores.itemCombo[comboKey(items)] ?? 0;
}

export function getAttributeScore(scores: PreferenceScores, items: ClothingItem[]): number {
  const attrs = extractAttributes(items);
  return attrs.reduce((sum, attr) => sum + (scores.attributes[attr] ?? 0), 0);
}

export function isBlacklisted(scores: PreferenceScores, items: ClothingItem[]): boolean {
  return getComboScore(scores, items) < 0;
}

export function getTotalPreferenceScore(
  scores: PreferenceScores,
  items: ClothingItem[]
): number {
  return getComboScore(scores, items) + getAttributeScore(scores, items);
}

export function clearPreferenceScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
