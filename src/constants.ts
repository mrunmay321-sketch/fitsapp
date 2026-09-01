import type { MainCategory, FitStyle, Weather, Occasion, SkinUndertone, LayerTag } from './types';

export const SUBCATEGORIES: Record<MainCategory, string[]> = {
  Tops: ['Tank', 'Short-Sleeve Tee', 'Short-Sleeve Henley', 'Long-Sleeve Tee', 'Long-Sleeve Henley', 'Sweaters', 'Cardigans', 'Flannels', 'Overshirts'],
  Bottoms: ['Baggy Jeans', 'Loose Jeans', 'Cargo Pants', 'Wide-Leg Trousers', 'Formal Trousers', 'Shorts'],
  Jackets: ['Leather', 'Denim', 'Oversized Coats', 'Bombers', 'Heavy Coats'],
  Footwear: ['Boots', 'Loafers', 'Sneakers'],
  Accessories: ['Belts', 'Sunglasses', 'Hats', 'Jewelry'],
};

// Layer classification for upper-body garments
export const LAYER_TAGS: Record<string, LayerTag> = {
  // Base Layer
  'Tank': 'Base',
  'Short-Sleeve Tee': 'Base',
  'Short-Sleeve Henley': 'Base',
  // Mid Layer
  'Long-Sleeve Tee': 'Mid',
  'Long-Sleeve Henley': 'Mid',
  'Sweaters': 'Mid',
  'Cardigans': 'Mid',
  'Flannels': 'Mid',
  'Overshirts': 'Mid',
  // Outer Layer
  'Leather': 'Outer',
  'Denim': 'Outer',
  'Oversized Coats': 'Outer',
  'Bombers': 'Outer',
  'Heavy Coats': 'Outer',
};

export function getLayerTag(subcategory: string): LayerTag | undefined {
  return LAYER_TAGS[subcategory];
}

export const FIT_STYLES: FitStyle[] = ['Fitted', 'Regular', 'Baggy/Oversized'];

export const WEATHERS: Weather[] = ['Cold/Layering', 'Warm', 'Rainy'];

export const OCCASIONS: Occasion[] = [
  'College',
  'Street Outdoors',
  'Night Outs',
  'Hangouts',
];

export const UNDERTONES: SkinUndertone[] = ['Cool', 'Warm', 'Neutral', 'Olive'];

export const UNDERTONE_LABELS: Record<SkinUndertone, string> = {
  Cool: 'Cool (Pink/Blue)',
  Warm: 'Warm (Golden/Yellow)',
  Neutral: 'Neutral',
  Olive: 'Olive / Deep Warm',
};

// Undertone color matching matrix
export const UNDERTONE_COLORS: Record<SkinUndertone, string[]> = {
  Cool: ['Navy', 'Emerald', 'Burgundy', 'Cool Charcoal', 'Slate Gray', 'Pure White', 'Icy Blue'],
  Warm: ['Olive Green', 'Warm Rust', 'Mustard', 'Cream', 'Chocolate Brown', 'Tan', 'Earth Tone'],
  Olive: ['Sage Green', 'Deep Plum', 'Dark Charcoal', 'Muted Mustard', 'Warm Off-White', 'Warm Navy'],
  Neutral: ['Navy', 'White', 'Grey', 'Burgundy', 'Olive', 'Cream', 'Charcoal', 'Forest Green', 'Tan'],
};

export const MAIN_CATEGORIES: MainCategory[] = [
  'Tops',
  'Bottoms',
  'Jackets',
  'Footwear',
  'Accessories',
];

export interface InspoItem {
  category: MainCategory;
  subcategory: string;
  color: string;
  colorHex: string;
  fit: FitStyle;
}

export interface InspoFit {
  caption: string;
  occasions: Occasion[];
  weathers: Weather[];
  aesthetic: string;
  items: InspoItem[];
}

export const INSPO_FITS: InspoFit[] = [
  {
    caption: 'Fitted white tee under open olive flannel with baggy denim',
    occasions: ['College', 'Street Outdoors'],
    weathers: ['Cold/Layering', 'Warm'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'White', colorHex: '#fafaf9', fit: 'Fitted' },
      { category: 'Tops', subcategory: 'Flannels', color: 'Olive Green', colorHex: '#6b6d3d', fit: 'Baggy/Oversized' },
      { category: 'Bottoms', subcategory: 'Baggy Jeans', color: 'Washed Indigo', colorHex: '#4a5d7a', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'All-black streetwear — graphic tee with relaxed trousers',
    occasions: ['Street Outdoors', 'Night Outs'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Black', colorHex: '#1c1917', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Sunglasses + casual layers — effortless off-duty energy',
    occasions: ['College', 'Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Henley', color: 'Cream', colorHex: '#f5f0e8', fit: 'Fitted' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Light Blue', colorHex: '#a3b8d1', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
      { category: 'Accessories', subcategory: 'Sunglasses', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Leather jacket over fitted tee with loose bottoms',
    occasions: ['College', 'Street Outdoors'],
    weathers: ['Cold/Layering'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'Charcoal', colorHex: '#44403c', fit: 'Fitted' },
      { category: 'Jackets', subcategory: 'Leather', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Indigo', colorHex: '#2d3a5a', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
    ],
  },
  {
    caption: 'Fitted black tee + baggy denim — minimalist streetwear',
    occasions: ['Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'Black', colorHex: '#1c1917', fit: 'Fitted' },
      { category: 'Bottoms', subcategory: 'Baggy Jeans', color: 'Washed Blue', colorHex: '#6b7fa3', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'Black vest over white tee — high-contrast evening streetwear',
    occasions: ['Night Outs', 'Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Tank', color: 'White', colorHex: '#fafaf9', fit: 'Fitted' },
      { category: 'Tops', subcategory: 'Overshirts', color: 'Black', colorHex: '#1c1917', fit: 'Baggy/Oversized' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Loafers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Relaxed layered knit — cozy smart casual',
    occasions: ['Hangouts', 'College'],
    weathers: ['Cold/Layering'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Sweaters', color: 'Sage Green', colorHex: '#9caf88', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Washed Blue', colorHex: '#6b7fa3', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'Henley and relaxed denim — off-duty classic',
    occasions: ['College', 'Hangouts'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Henley', color: 'Slate Gray', colorHex: '#64748b', fit: 'Fitted' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Washed Indigo', colorHex: '#4a5d7a', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Tan', colorHex: '#d2b48c', fit: 'Regular' },
    ],
  },
  {
    caption: 'Oversized silhouette — coordinated streetwear',
    occasions: ['Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Long-Sleeve Tee', color: 'Charcoal', colorHex: '#44403c', fit: 'Baggy/Oversized' },
      { category: 'Bottoms', subcategory: 'Cargo Pants', color: 'Olive', colorHex: '#6b6d3d', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Winter layering — structured coat over knit',
    occasions: ['Street Outdoors', 'Hangouts'],
    weathers: ['Cold/Layering', 'Rainy'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Sweaters', color: 'Charcoal', colorHex: '#44403c', fit: 'Fitted' },
      { category: 'Jackets', subcategory: 'Heavy Coats', color: 'Navy', colorHex: '#1e3a5f', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Charcoal', colorHex: '#44403c', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
    ],
  },
  {
    caption: 'Blazer over tee — smart casual with relaxed styling',
    occasions: ['Night Outs', 'Hangouts'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'White', colorHex: '#fafaf9', fit: 'Fitted' },
      { category: 'Jackets', subcategory: 'Oversized Coats', color: 'Cream', colorHex: '#f5f0e8', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Formal Trousers', color: 'Slate Gray', colorHex: '#64748b', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Loafers', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
    ],
  },
  {
    caption: 'Grey suit with printed shirt — smart casual done loose',
    occasions: ['Night Outs', 'Hangouts'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Long-Sleeve Tee', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
      { category: 'Jackets', subcategory: 'Oversized Coats', color: 'Grey', colorHex: '#78716c', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Formal Trousers', color: 'Grey', colorHex: '#78716c', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Loafers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Striped shirt and jeans — off-duty model aesthetic',
    occasions: ['College', 'Hangouts'],
    weathers: ['Warm'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Long-Sleeve Tee', color: 'Navy', colorHex: '#1e3a5f', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Washed Blue', colorHex: '#6b7fa3', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'Beige tailoring with sneakers — smart streetwear crossover',
    occasions: ['Hangouts', 'Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'Cream', colorHex: '#f5f0e8', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Tan', colorHex: '#d2b48c', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'All-black evening ensemble — night-out minimalism',
    occasions: ['Night Outs'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Long-Sleeve Henley', color: 'Black', colorHex: '#1c1917', fit: 'Fitted' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Plaid flannel open over tee — relaxed layering',
    occasions: ['College', 'Street Outdoors'],
    weathers: ['Warm', 'Cold/Layering'],
    aesthetic: 'Late-90s Off-Duty',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'White', colorHex: '#fafaf9', fit: 'Fitted' },
      { category: 'Tops', subcategory: 'Flannels', color: 'Burgundy', colorHex: '#6b0f3a', fit: 'Baggy/Oversized' },
      { category: 'Bottoms', subcategory: 'Baggy Jeans', color: 'Washed Indigo', colorHex: '#4a5d7a', fit: 'Baggy/Oversized' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'White', colorHex: '#fafaf9', fit: 'Regular' },
    ],
  },
  {
    caption: 'Night-out layering — dark tones and sharp lines',
    occasions: ['Night Outs', 'Street Outdoors'],
    weathers: ['Cold/Layering'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Long-Sleeve Tee', color: 'Black', colorHex: '#1c1917', fit: 'Fitted' },
      { category: 'Jackets', subcategory: 'Bombers', color: 'Charcoal', colorHex: '#44403c', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Evening coffee run — dark layers and relaxed fit',
    occasions: ['Night Outs', 'Hangouts'],
    weathers: ['Cold/Layering'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Sweaters', color: 'Charcoal', colorHex: '#44403c', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Indigo', colorHex: '#2d3a5a', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Sneakers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Statement streetwear — bold color for the night out',
    occasions: ['Night Outs', 'Street Outdoors'],
    weathers: ['Warm'],
    aesthetic: 'Smart Streetwear',
    items: [
      { category: 'Tops', subcategory: 'Short-Sleeve Tee', color: 'Burgundy', colorHex: '#6b0f3a', fit: 'Fitted' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Black', colorHex: '#1c1917', fit: 'Regular' },
    ],
  },
  {
    caption: 'Denim shirt under wool coat — cold-weather layering',
    occasions: ['Street Outdoors', 'College'],
    weathers: ['Cold/Layering', 'Rainy'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Overshirts', color: 'Washed Blue', colorHex: '#6b7fa3', fit: 'Regular' },
      { category: 'Jackets', subcategory: 'Heavy Coats', color: 'Charcoal', colorHex: '#44403c', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Loose Jeans', color: 'Indigo', colorHex: '#2d3a5a', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Boots', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
    ],
  },
  {
    caption: 'Beige overcoat — smart casual cold-weather staple',
    occasions: ['Hangouts'],
    weathers: ['Cold/Layering'],
    aesthetic: 'Smart Casual',
    items: [
      { category: 'Tops', subcategory: 'Sweaters', color: 'Cream', colorHex: '#f5f0e8', fit: 'Fitted' },
      { category: 'Jackets', subcategory: 'Oversized Coats', color: 'Tan', colorHex: '#d2b48c', fit: 'Regular' },
      { category: 'Bottoms', subcategory: 'Wide-Leg Trousers', color: 'Cream', colorHex: '#f5f0e8', fit: 'Regular' },
      { category: 'Footwear', subcategory: 'Loafers', color: 'Brown', colorHex: '#4a3528', fit: 'Regular' },
    ],
  },
];
