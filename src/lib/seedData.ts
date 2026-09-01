import type { ClothingItem } from '../types';
import { getLayerTag } from '../constants';
import { uid } from './utils';

// No seed images — the closet starts empty.
// Users upload their own photos, which pass through background removal
// to produce transparent PNG cutouts before being saved.

export function createSeedItems(): ClothingItem[] {
  return [];
}

export function getInspoImage(_category: string, _subcategory: string, _color: string): string | undefined {
  return undefined;
}
