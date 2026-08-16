import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  cartId: string | null;
  checkoutUrl: string | null;
  totalQuantity: number;
  lines: any[];
  subtotal: string;
  isCartOpen: boolean;
  lastTransactionCancelled: boolean;
  setCart: (cart: any) => void;
  openCart: () => void;
  closeCart: () => void;
  setTransactionCancelled: (cancelled: boolean) => void;
}

export const useCartStore = create<CartState & { clearCart: () => void }>()(
  persist(
    (set) => ({
      cartId: null,
      checkoutUrl: null,
      totalQuantity: 0,
      lines: [],
      subtotal: "0.00",
      isCartOpen: false,
      lastTransactionCancelled: false,

      setCart: (cart) => {
        if (!cart) {
          set({
            cartId: null,
            checkoutUrl: null,
            totalQuantity: 0,
            lines: [],
            subtotal: "0.00",
            lastTransactionCancelled: false,
          });
          return;
        }
        set({
          cartId: cart.id,
          checkoutUrl: cart.checkoutUrl,
          totalQuantity: cart.totalQuantity,
          lines: Array.isArray(cart.lines) ? cart.lines : (cart.lines?.edges?.map((e: any) => e.node) || []),
          subtotal: cart.cost?.subtotalAmount?.amount || cart.subtotal || "0.00",
          lastTransactionCancelled: false,
        });
      },
      
      clearCart: () => set({
        cartId: null,
        checkoutUrl: null,
        totalQuantity: 0,
        lines: [],
        subtotal: "0.00",
        isCartOpen: false,
      }),
      
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      setTransactionCancelled: (cancelled: boolean) => set({ lastTransactionCancelled: cancelled }),
    }),
    {
      name: 'boutiique-vastraa-cart',
      partialize: (state) => ({ cartId: state.cartId, checkoutUrl: state.checkoutUrl, lastTransactionCancelled: state.lastTransactionCancelled }),
    }
  )
);
