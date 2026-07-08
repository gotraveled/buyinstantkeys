import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartCtx = createContext(null);
const STORAGE_KEY = "bik_cart_v1";
const COUPON_KEY = "bik_coupon_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [coupon, setCoupon] = useState(() => {
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon]);

  const addItem = useCallback((product, variant, quantity = 1) => {
    setItems((prev) => {
      const key = `${product.id}__${variant.id}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug,
          product_image: product.image_url,
          box_variant: product.box_variant || "gold",
          variant_id: variant.id,
          variant_label: variant.label,
          unit_price: variant.price,
          quantity,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, qty) } : i)));
  }, []);
  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clearCart = useCallback(() => { setItems([]); setCoupon(null); }, []);
  const applyCoupon = useCallback((c) => setCoupon(c), []);
  const removeCoupon = useCallback(() => setCoupon(null), []);

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartCtx.Provider value={{ items, addItem, updateQty, removeItem, clearCart, subtotal, count, coupon, applyCoupon, removeCoupon }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
