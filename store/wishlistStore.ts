import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  handle: string;
  title: string;
  price: string;
  image: string | null;
}

import { syncWishlist } from '@/lib/api/auth-client';

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  setWishlist: (items: WishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const current = get().items;
        const exists = current.some((i) => i.id === item.id);
        if (exists) return;
        const updated = [...current, item];
        set({ items: updated });
        syncWishlist(updated).catch(() => {});
      },
      removeItem: (id) => {
        const updated = get().items.filter((i) => i.id !== id);
        set({ items: updated });
        syncWishlist(updated).catch(() => {});
      },
      isInWishlist: (id) => get().items.some((i) => i.id === id),
      clearWishlist: () => set({ items: [] }),
      setWishlist: (items) => set({ items }),
    }),
    {
      name: 'boutiique-vastraa-wishlist',
    }
  )
);
