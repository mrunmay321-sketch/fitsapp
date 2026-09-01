import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { ClothingItem, BodyMatrix, FeedbackRecord, GeneratedOutfit, WishlistItem } from '../types';
import * as db from '../lib/db';
import {
  type PreferenceScores,
  loadPreferenceScores,
  savePreferenceScores,
  applyFeedback,
  clearPreferenceScores,
} from '../lib/preferenceEngine';

interface WardrobeContextValue {
  items: ClothingItem[];
  body: BodyMatrix | null;
  feedback: FeedbackRecord[];
  prefScores: PreferenceScores;
  wishlist: WishlistItem[];
  loading: boolean;
  addItem: (item: ClothingItem) => Promise<void>;
  updateItem: (item: ClothingItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  saveBody: (body: BodyMatrix) => Promise<void>;
  recordFeedback: (rec: FeedbackRecord, outfit: GeneratedOutfit) => Promise<void>;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [body, setBody] = useState<BodyMatrix | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [prefScores, setPrefScores] = useState<PreferenceScores>(loadPreferenceScores());
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [i, b, f, w] = await Promise.all([
      db.getAllItems(),
      db.getBody(),
      db.getAllFeedback(),
      db.getAllWishlist(),
    ]);
    const sorted = i.sort((a, c) => c.createdAt - a.createdAt);
    setItems(sorted);
    setBody(b);
    setFeedback(f);
    setWishlist(w.sort((a, c) => c.addedAt - c.addedAt));
    setLoading(false);

    if (sorted.length === 0) return;

    const ids = sorted.map((item) => item.id);
    const images = await db.getAllImages(ids);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        imageData: images[item.id] ?? item.imageData,
      }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(async (item: ClothingItem) => {
    await db.putItem(item);
    setItems((prev) => [item, ...prev].sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const updateItem = useCallback(async (item: ClothingItem) => {
    await db.putItem(item);
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }, []);

  const removeItem = useCallback(async (id: string) => {
    await db.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const saveBody = useCallback(async (b: BodyMatrix) => {
    await db.putBody(b);
    setBody(b);
  }, []);

  const recordFeedback = useCallback(async (rec: FeedbackRecord, outfit: GeneratedOutfit) => {
    await db.putFeedback(rec);
    setFeedback((prev) => {
      const rest = prev.filter((f) => f.outfitId !== rec.outfitId);
      return [rec, ...rest];
    });
    setPrefScores((prev) => {
      const next = applyFeedback(prev, outfit, rec.feedback);
      savePreferenceScores(next);
      return next;
    });
  }, []);

  const addToWishlist = useCallback(async (item: WishlistItem) => {
    await db.putWishlistItem(item);
    setWishlist((prev) => {
      const rest = prev.filter((w) => w.id !== item.id);
      return [item, ...rest].sort((a, b) => b.addedAt - a.addedAt);
    });
  }, []);

  const removeFromWishlist = useCallback(async (id: string) => {
    await db.deleteWishlistItem(id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const resetAll = useCallback(async () => {
    await db.clearAll();
    clearPreferenceScores();
    setItems([]);
    setBody(null);
    setFeedback([]);
    setWishlist([]);
    setPrefScores({ itemCombo: {}, attributes: {} });
  }, []);

  return (
    <WardrobeContext.Provider
      value={{ items, body, feedback, prefScores, wishlist, loading, addItem, updateItem, removeItem, saveBody, recordFeedback, addToWishlist, removeFromWishlist, resetAll }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider');
  return ctx;
}
