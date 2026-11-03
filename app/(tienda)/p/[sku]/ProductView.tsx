'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { useCompany, useProducts } from '@/lib/hooks';
import { fechaLarga, left, money, productImage, productLeft, sizes } from '@/lib/format';
import { BackLink, Icon, Progress, Skeleton, StateBox, btnPrimary, btnSecondary, useToast } from '@/components/ui';

export default function ProductView({ sku }: { sku: string }) {
  const router = useRouter();
  const { company } = useCompany();
  const { products, loading, error, reload } = useProducts(company?.id, sku);
  const { items, add } = useCart();
  const { toast, toastNode } = useToast();
  const p = products[0];

  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);

  const sz = useMemo(() => (p ? sizes(p) : []), [p]);
  const selected = sz.find((v) => v.id === sizeId) || null;
  const inCart = p ? items.filter((x) => x.productId === p.id).reduce((a, x) => a + x.qty, 0) : 0;
  const inCartSize = selected ? items.filter((x) => x.variantId === selected.id).reduce((a, x) => a + x.qty, 0) : 0;
  const maxPerson = p?.max_per_customer ?? 99;
  const maxQty = selected ? Math.max(0, Math.min(left(selected) - inCartSize, maxPerson - inCart)) : 0;

  useEffect(() => {
    if (selected && left(selected) === 0) setSizeId(null);
  }, [selected]);
  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, maxQty || 1)));
  }, [maxQty]);

  if (loading && !p) {
    return (
      <div className="grid gap-6 py-6 md:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <div className="space-y-3"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }
  if (error || !p) {
    return (
      <StateBox icon={error ? 'alert' : 'search'} tone={error ? 'bad' : 'neutral'} title={error ? 'No pudimos cargar este producto' : 'No encontramos este producto'}
        action={error ? <button onClick={() => reload()} className={`${btnPrimary} h-11`}>Reintentar</button> : <Link href="/" className={`${btnPrimary} h-11`}>Ver todos los modelos</Link>}>
        {error ? 'Revisa tu conexión e intenta de nuevo.' : 'Puede que el link esté incompleto.'}
      </StateBox>
    );
  }

  const img = productImage(p);
  const rem = productLeft(p);
  const soldOut = rem === 0 || p.status !== 'preventa';
  const limitReached = inCart >= maxPerson;

  const addToCart = (go: boolean) => {
    if (!selected || maxQty < 1) return;
    add({ productId: p.id, variantId: selected.id, sku: p.sku, name: p.name, size: selected.name, price: Number(p.price), image: img, qty });
    if (go) router.push('/apartado');
    else toast(`Agregaste ${qty} ${p.name.replace(/^Playera\s+/i, '')} talla ${selected.name}`);
  };

  return (
    <div className="pb-32 md:pb-10">
      <div className="pt-2"><BackLink href="/" label="Modelos" /></div>
      <div className="mt-2 grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <button type="button" onClick={() => setZoom(true)} aria-label="Ampliar foto"
            className="relative block w-full overflow-hidden rounded-2xl border border-line bg-soft cursor-zoom-in">
            {img && <img src={img} alt={p.name} className="aspect-[3/4] w-full object-cover" />}
            <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold">
              <Icon name="zoom" size={16} stroke={2} /> Ampliar
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1CC] px-2.5 py-1 text-xs font-semibold text-[#7A5200]">
                <Icon name="clock" size={13} stroke={2.2} /> {p.expected_arrival ? `Llega el ${fechaLarga(p.expected_arrival)}` : 'Preventa'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DFF3E7] px-2.5 py-1 text-xs font-semibold text-[#11663F]">
                <Icon name="shield" size={13} stroke={2.2} /> Original
              </span>
            </div>
            <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight sm:text-3xl">{p.name}</h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight tabular">{money(p.price)}</span>
              <span className="text-[15px] text-muted">por pieza</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{soldOut ? 'Agotado' : `Quedan ${rem} de ${p.goal_qty}`}</span>
              <span className="text-sm text-muted tabular">{p.reserved_qty} apartadas</span>
            </div>
            <div className="mt-2.5"><Progress value={p.reserved_qty} max={p.goal_qty} done={rem === 0} /></div>
            <p className="mt-2.5 text-[13px] text-muted">La disponibilidad se actualiza en vivo.</p>
          </div>

          {!soldOut && (
            <fieldset>
              <legend className="mb-2 font-semibold">Elige tu talla</legend>
              <div className="grid grid-cols-3 gap-2">
                {sz.map((v) => {
                  const l = left(v);
                  const on = v.id === sizeId;
                  return (
                    <button key={v.id} type="button" disabled={l === 0} aria-pressed={on} onClick={() => setSizeId(v.id)}
                      className={`flex h-[60px] flex-col items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:bg-ground ${on ? 'border-2 border-ink' : 'border-line2 hover:border-[#9A9DA2]'}`}>
                      <span className={`text-lg font-bold ${l === 0 ? 'text-[#A0A4AA] line-through' : ''}`}>{v.name}</span>
                      <span className={`text-xs ${l === 0 ? 'text-[#8A8F96]' : l === 1 ? 'font-semibold text-[#C2410C]' : 'text-muted'}`}>
                        {l === 0 ? 'Agotada' : l === 1 ? 'Queda 1' : `Quedan ${l}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!soldOut && selected && (
            <div>
              <div className="mb-2 font-semibold"><label htmlFor="qty">Cantidad</label></div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Quitar una" disabled={qty <= 1} onClick={() => setQty(qty - 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-line2 bg-white disabled:opacity-40"><Icon name="minus" stroke={2.2} /></button>
                <span id="qty" aria-live="polite" className="w-12 text-center text-xl font-bold tabular">{maxQty < 1 ? 0 : qty}</span>
                <button type="button" aria-label="Agregar una" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-line2 bg-white disabled:opacity-40"><Icon name="plus" stroke={2.2} /></button>
                <span className="ml-2 text-sm text-muted">
                  {maxQty < 1 ? (limitReached ? `Máximo ${maxPerson} por persona` : 'Ya tienes todas en tu apartado') : `Máximo ${maxQty}`}
                </span>
              </div>
            </div>
          )}

          {p.description && <p className="text-[15px] leading-6 text-[#33373D]">{p.description}</p>}

          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
            {p.details?.marca && (<><dt className="text-muted">Marca</dt><dd>{p.details.marca}</dd></>)}
            {p.details?.color && (<><dt className="text-muted">Color</dt><dd>{p.details.color}</dd></>)}
            <dt className="text-muted">Tallas</dt><dd>{sz.map((v) => v.name).join(' · ')}</dd>
            {p.max_per_customer && (<><dt className="text-muted">Límite</dt><dd>{p.max_per_customer} piezas por persona</dd></>)}
            <dt className="text-muted">Cambios</dt><dd>Solo por defecto de fábrica · <Link href="/politicas" className="underline underline-offset-2">ver políticas</Link></dd>
          </dl>
        </div>
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-6xl gap-2 md:justify-end">
            <button type="button" disabled={!selected || maxQty < 1} onClick={() => addToCart(false)} className={`${btnSecondary} h-14 flex-none px-4 md:w-56`}>
              <Icon name="plus" size={18} stroke={2.2} /><span className="hidden sm:inline">Agregar y seguir viendo</span><span className="sm:hidden">Agregar</span>
            </button>
            <button type="button" disabled={!selected || maxQty < 1} onClick={() => addToCart(true)} className={`${btnPrimary} h-14 flex-1 text-base md:w-72 md:flex-none`}>
              {selected ? `Apartar talla ${selected.name} · ${money(Number(p.price) * Math.max(qty, 1))}` : 'Elige tu talla'}
            </button>
          </div>
        </div>
      )}

      {zoom && img && (
        <div role="dialog" aria-modal="true" aria-label="Foto ampliada" className="fixed inset-0 z-50 flex flex-col bg-[#0F1012] animate-fade">
          <div className="flex justify-end p-3">
            <button type="button" onClick={() => setZoom(false)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white">
              <Icon name="x" />
            </button>
          </div>
          <div className="flex-1 overflow-auto"><img src={img} alt={p.name} className="mx-auto min-w-full max-w-none sm:min-w-0 sm:max-w-3xl" /></div>
        </div>
      )}
      {toastNode}
    </div>
  );
}
