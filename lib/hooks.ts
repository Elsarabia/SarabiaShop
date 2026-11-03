'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sb } from './supabase';
import { STORE_SLUG } from './config';
import type { Company, Customer, Product } from './types';

const PRODUCT_FIELDS =
  'id,sku,name,description,price,goal_qty,reserved_qty,max_per_customer,status,expected_arrival,details,' +
  'product_variants(id,name,kind,stock_qty,reserved_qty,position),product_images(storage_path,alt,position)';

let companyCache: Company | null = null;

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(companyCache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!companyCache);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await sb().from('companies').select('id,name,slug,whatsapp,city,settings').eq('slug', STORE_SLUG).maybeSingle();
    if (error || !data) setError(error?.message || 'No encontramos la tienda.');
    else {
      companyCache = data as Company;
      setCompany(companyCache);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!companyCache) load();
  }, [load]);

  return { company, error, loading, reload: load };
}

export function useProducts(companyId?: string, sku?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (!companyId) return;
    if (!quiet) setLoading(true);
    let q = sb().from('products').select(PRODUCT_FIELDS).eq('company_id', companyId)
      .in('status', ['preventa', 'negociacion', 'meta', 'confirmado', 'espera']).order('created_at');
    if (sku) q = q.ilike('sku', sku);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setError(null);
      setProducts((data || []) as unknown as Product[]);
    }
    setLoading(false);
  }, [companyId, sku]);

  useEffect(() => {
    load();
  }, [load]);

  // Disponibilidad en tiempo real: cuando alguien aparta, se actualiza sola
  useEffect(() => {
    if (!companyId) return;
    const ch = sb()
      .channel(`productos-${companyId}-${sku || 'todos'}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `company_id=eq.${companyId}` }, () => load(true))
      .subscribe();
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => {
      sb().removeChannel(ch);
      window.removeEventListener('focus', onFocus);
    };
  }, [companyId, sku, load]);

  return { products, error, loading, reload: load };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useCustomer(companyId?: string) {
  const { session, ready } = useSession();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId || !session) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await sb().from('customers').select('id,full_name,business_name,whatsapp,no_show_count,status')
      .eq('company_id', companyId).eq('user_id', session.user.id).maybeSingle();
    setCustomer((data as Customer) || null);
    setLoading(false);
  }, [companyId, session]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  return { customer, loading: loading || !ready, session, reload: load };
}

/** Registra al cliente con nombre y WhatsApp (sin contraseña ni código). */
export async function ensureCustomer(fullName: string, whatsapp: string) {
  const client = sb();
  const { data: s } = await client.auth.getSession();
  if (!s.session) {
    const { error } = await client.auth.signInAnonymously({ options: { data: { full_name: fullName } } });
    if (error) throw error;
  }
  const { error } = await client.rpc('join_company', {
    p_company_slug: STORE_SLUG,
    p_full_name: fullName,
    p_business_name: null,
    p_whatsapp: whatsapp,
  });
  if (error) throw error;
}
