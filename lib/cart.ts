'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CartItem } from './types';

const KEY = 'sarabiashop-cart-v1';
const EVT = 'sarabiashop-cart';

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento no disponible: el carrito vive solo en esta pantalla */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((next: CartItem[]) => {
    setItems(next);
    write(next);
  }, []);

  const add = useCallback((item: CartItem) => {
    const cur = read();
    const i = cur.findIndex((x) => x.productId === item.productId && x.variantId === item.variantId);
    if (i >= 0) cur[i] = { ...cur[i], qty: cur[i].qty + item.qty };
    else cur.push(item);
    save(cur);
  }, [save]);

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    save(read().map((x) => (x.productId === productId && x.variantId === variantId ? { ...x, qty } : x)).filter((x) => x.qty > 0));
  }, [save]);

  const remove = useCallback((productId: string, variantId: string | null) => {
    save(read().filter((x) => !(x.productId === productId && x.variantId === variantId)));
  }, [save]);

  const clear = useCallback(() => save([]), [save]);

  const count = items.reduce((a, x) => a + x.qty, 0);
  const subtotal = items.reduce((a, x) => a + x.qty * x.price, 0);

  return { items, ready, add, setQty, remove, clear, count, subtotal };
}
