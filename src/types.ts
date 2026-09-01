export type MainCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Jackets'
  | 'Footwear'
  | 'Accessories';

export type FitStyle = 'Fitted' | 'Regular' | 'Baggy/Oversized';

export type LayerTag = 'Base' | 'Mid' | 'Outer';

export type SkinUndertone = 'Cool' | 'Warm' | 'Neutral' | 'Olive';

export type Occasion = 'College' | 'Street Outdoors' | 'Night Outs' | 'Hangouts';

export interface ClothingItem {
  id: string;
  mainCategory: MainCategory;
  subcategory: string;
  color: string;
  colorHex?: string;
  fit: FitStyle;
  layerTag?: LayerTag;
  styleVibe?: string;
  inLaundry: boolean;
  imageData?: string;
  createdAt: number;
}

export interface BodyMatrix {
  height: number;
  weight: number;
  shoulder: number;
  waist: number;
  hips: number;
  undertone: SkinUndertone;
}

export type Weather = 'Cold/Layering' | 'Warm' | 'Rainy';

export type OutfitSource = 'closet' | 'inspo';

export interface MatchBreakdown {
  bodyScore: number;
  colorScore: number;
  layerScore: number;
  undertoneScore: number;
  feedbackScore: number;
  total: number;
  harmonyType: string;
}

export interface GeneratedOutfit {
  id: string;
  source: OutfitSource;
  weather: Weather;
  occasion: Occasion;
  title: string;
  description: string;
  aesthetic: string;
  items: ClothingItem[];
  inspoImage?: string;
  inspoCaption?: string;
  matchScore: number;
  bodyMatch?: string;
  preferenceScore?: number;
  feedback?: 'love' | 'dislike';
  matchBreakdown?: MatchBreakdown;
}

export interface FeedbackRecord {
  outfitId: string;
  feedback: 'love' | 'dislike';
  timestamp: number;
}

export interface ScanResult {
  verdict: 'BUY' | 'PASS';
  matchScore: number;
  breakdown: string[];
  pairsWellWith: ClothingItem[];
  imageData: string;
  timestamp: number;
}

export interface BuyRecommendation {
  id: string;
  name: string;
  category: MainCategory;
  fit: FitStyle;
  color: string;
  layerTag?: LayerTag;
  reasonWhy: string;
  reasonFit: string;
  priority: number;
  unlockScore?: number;
  unlockCount?: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  category: MainCategory;
  fit: FitStyle;
  color: string;
  layerTag?: LayerTag;
  source: 'buy' | 'inspo';
  addedAt: number;
}
