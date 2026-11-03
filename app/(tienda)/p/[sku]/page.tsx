import type { Metadata } from 'next';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import ProductView from './ProductView';

type Params = { sku: string };

// Vista previa del link cuando se comparte por WhatsApp
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { sku } = await params;
  try {
    const url = `${SUPABASE_URL}/rest/v1/products?select=name,price,description,expected_arrival,product_images(storage_path)&sku=ilike.${encodeURIComponent(sku)}&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 300 },
    });
    const [p] = (await res.json()) as { name: string; price: number; description: string; product_images: { storage_path: string }[] }[];
    if (!p) return { title: 'Producto' };
    const img = p.product_images?.[0]?.storage_path;
    const title = `${p.name} · $${Number(p.price).toLocaleString('es-MX')}`;
    return {
      title: p.name,
      description: p.description,
      openGraph: { title, description: 'Preventa · aparta tu talla en SarabiaShop', images: img ? [{ url: img }] : undefined },
    };
  } catch {
    return { title: 'Producto' };
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { sku } = await params;
  return <ProductView sku={sku} />;
}
