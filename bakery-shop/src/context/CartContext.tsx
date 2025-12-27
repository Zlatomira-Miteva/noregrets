'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  image?: string;
};

type AddItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (payload: AddItemPayload) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalPrice: number;
  lastAddedEvent: CartAddEvent | null;
  acknowledgeLastAdded: () => void;
};

const STORAGE_KEY = "noregrets-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

const createOptionsKey = (options?: string[]) =>
  options && options.length > 0 ? options.slice().sort().join("| ") : "";

type CartAddEvent = {
  id: number;
  name: string;
  timestamp: number;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastAddedEvent, setLastAddedEvent] = useState<CartAddEvent | null>(null);
  const eventIncrement = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Неуспешно зареждане на количката", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Неуспешно запазване на количката", error);
    }
  }, [items, isHydrated]);

  const addItem = (payload: AddItemPayload) => {
    setItems((prev) => {
      const optionsKey = createOptionsKey(payload.options);
      const key = `${payload.productId}__${optionsKey}`;
      const existingIndex = prev.findIndex((item) => item.key === key);

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + payload.quantity,
          image: payload.image ?? next[existingIndex].image,
        };
        return next;
      }

      return [
        ...prev,
        {
          key,
          productId: payload.productId,
          name: payload.name,
          price: payload.price,
          quantity: payload.quantity,
          options: payload.options,
          image: payload.image,
        },
      ];
    });

    setLastAddedEvent({
      id: eventIncrement.current++,
      name: payload.name,
      timestamp: Date.now(),
    });
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.max(1, quantity),
            }
          : item
      )
    );
  };

  const clearCart = useCallback(() => setItems([]), []);
  const acknowledgeLastAdded = useCallback(() => setLastAddedEvent(null), []);

  const { totalQuantity, totalPrice } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalPrice += item.price * item.quantity;
        return acc;
      },
      { totalQuantity: 0, totalPrice: 0 }
    );
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalQuantity,
    totalPrice,
    lastAddedEvent,
    acknowledgeLastAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart може да се използва само вътре в CartProvider");
  }
  return context;
};
