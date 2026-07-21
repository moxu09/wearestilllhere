"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { MerchandiseSlug } from "@/lib/merchandiseCatalog";

export type MerchandiseCartItem = {
  slug: MerchandiseSlug;
  name: string;
  unitPrice: number;
  quantity: number;
};

type MerchandiseCartContextValue = {
  items: MerchandiseCartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  addItem: (item: MerchandiseCartItem) => void;
  updateQuantity: (slug: MerchandiseSlug, quantity: number) => void;
  removeItem: (slug: MerchandiseSlug) => void;
};

const MerchandiseCartContext = createContext<
  MerchandiseCartContextValue | undefined
>(undefined);

export function calculateShippingFee(subtotal: number) {
  if (subtotal <= 0 || subtotal >= 490) return 0;
  return 60;
}

export default function MerchandiseCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<MerchandiseCartItem[]>([]);

  const addItem = useCallback((item: MerchandiseCartItem) => {
    const quantity = Math.max(1, Math.floor(item.quantity));

    setItems((current) => {
      const existing = current.find((entry) => entry.slug === item.slug);

      if (!existing) return [...current, { ...item, quantity }];

      return current.map((entry) =>
        entry.slug === item.slug
          ? {
              ...entry,
              name: item.name,
              unitPrice: item.unitPrice,
              quantity: entry.quantity + quantity,
            }
          : entry
      );
    });
  }, []);

  const updateQuantity = useCallback(
    (slug: MerchandiseSlug, quantity: number) => {
      const nextQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
      setItems((current) =>
        current.map((item) =>
          item.slug === slug ? { ...item, quantity: nextQuantity } : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((slug: MerchandiseSlug) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const shippingFee = calculateShippingFee(subtotal);

    return {
      items,
      itemCount,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      addItem,
      updateQuantity,
      removeItem,
    };
  }, [items, addItem, updateQuantity, removeItem]);

  return (
    <MerchandiseCartContext.Provider value={value}>
      {children}
    </MerchandiseCartContext.Provider>
  );
}

export function useMerchandiseCart() {
  const context = useContext(MerchandiseCartContext);

  if (!context) {
    throw new Error("useMerchandiseCart 必須在 MerchandiseCartProvider 內使用");
  }

  return context;
}
