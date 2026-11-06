'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { useCompany, useProducts } from '@/lib/hooks';
import { fechaLarga, left, money, productImage, productLeft, shortName, sizes } from '@/lib/format';
import { BackLink, Icon, Pieces, Skeleton, StateBox, btnPrimary, btnSecondary, useToast } from '@/components/ui';

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
        <Skeleton className="aspect-[3/4] w-full rounded-[4px]" />
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

  const actions = !soldOut && (
    <div className="flex gap-2">
      <button type="button" disabled={!selected || maxQty < 1} onClick={() => addToCart(false)}
        className={`${btnSecondary} h-14 flex-none px-4 sm:px-5`}>
        <span className="hidden sm:inline">Agregar y seguir viendo</span><span className="sm:hidden">Agregar</span>
      </button>
      <button type="button" disabled={!selected || maxQty < 1} onClick={() => addToCart(true)} className={`${btnPrimary} h-14 flex-1 text-[16px]`}>
        {selected ? `Apartar talla ${selected.name} por ${money(Number(p.price) * Math.max(qty, 1))}` : 'Elige tu talla'}
      </button>
    </div>
  );

  return (
    <div className="pb-32 md:pb-6">
      <div className="pt-3"><BackLink href="/#modelos" label="Todos los modelos" /></div>
      <div className="mt-3 grid gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <button type="button" onClick={() => setZoom(true)} aria-label="Ampliar foto"
            className="relative block w-full cursor-zoom-in overflow-hidden rounded-[4px] bg-studio">
            {img && <img src={img} alt={p.name} className={`aspect-[3/4] w-full object-cover ${soldOut ? 'opacity-50 grayscale' : ''}`} />}
            <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-white/90 px-3 text-[13px] font-semibold">
              <Icon name="zoom" size={16} stroke={2} /> Ampliar
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <p className="text-[15px] text-muted">{p.details?.marca}</p>
            <h1 className="display mt-2 text-[64px] sm:text-[88px]">{shortName(p)}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="display-soft text-[36px] tabular">{money(p.price)}</span>
              <span className="text-[15px] text-muted">
                Original{p.expected_arrival ? `, llega el ${fechaLarga(p.expected_arrival)}` : ''}
              </span>
            </div>
          </div>

          {soldOut ? (
            <div className="border-y border-line py-5">
              <p className="display-soft text-[28px]">Se agotó</p>
              <p className="mt-1 text-[15px] text-muted">Las {p.goal_qty} piezas de este modelo ya tienen dueño. Revisa los otros modelos.</p>
            </div>
          ) : (
            <fieldset>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <legend className="text-[17px] font-semibold">Elige tu talla</legend>
                <span className="text-[14px] text-muted tabular">Quedan {rem} de {p.goal_qty}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sz.map((v) => {
                  const l = left(v);
                  const on = v.id === sizeId;
                  return (
                    <button key={v.id} type="button" disabled={l === 0} aria-pressed={on} onClick={() => setSizeId(v.id)}
                      className={`flex h-[104px] flex-col items-center justify-center gap-2 rounded-[6px] border transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'border-navy bg-navy text-bone' : 'border-line2 bg-white hover:border-navy'}`}>
                      <span className={`display text-[40px] ${l === 0 ? 'line-through' : ''}`}>{v.name}</span>
                      <span className="flex items-center gap-2">
                        <Pieces total={v.stock_qty ?? 0} taken={v.reserved_qty} size={7} tone={on ? 'light' : 'navy'} label={`Talla ${v.name}: ${l === 0 ? 'agotada' : `quedan ${l}`}`} />
                      </span>
                      <span className={`text-[12px] ${on ? 'text-bone/80' : 'text-muted'}`}>
                        {l === 0 ? 'Agotada' : l === 1 ? 'Queda 1' : `Quedan ${l}`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px] text-muted">Puntos azules: piezas libres. Dorados: ya apartadas. Se actualiza en vivo.</p>
            </fieldset>
          )}

          {!soldOut && selected && (
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="qty" className="text-[17px] font-semibold">Cantidad</label>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted">
                  {maxQty < 1 ? (limitReached ? `Máximo ${maxPerson} por persona` : 'Ya están todas en tu apartado') : `Máximo ${maxQty}`}
                </span>
                <div className="flex items-center rounded-[6px] border border-line2 bg-white">
                  <button type="button" aria-label="Quitar una" disabled={qty <= 1} onClick={() => setQty(qty - 1)}
                    className="flex h-12 w-12 items-center justify-center disabled:opacity-30"><Icon name="minus" stroke={2} /></button>
                  <span id="qty" aria-live="polite" className="w-8 text-center text-lg font-semibold tabular">{maxQty < 1 ? 0 : qty}</span>
                  <button type="button" aria-label="Agregar una" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)}
                    className="flex h-12 w-12 items-center justify-center disabled:opacity-30"><Icon name="plus" stroke={2} /></button>
                </div>
              </div>
            </div>
          )}

          <div className="hidden md:block">{actions}</div>

          {p.description && <p className="max-w-prose text-[16px] leading-7 text-[#2C3550]">{p.description}</p>}

          <dl className="grid grid-cols-[7rem_1fr] border-t border-line text-[15px]">
            {p.details?.marca && (<><dt className="border-b border-line py-3 text-muted">Marca</dt><dd className="border-b border-line py-3">{p.details.marca}</dd></>)}
            {p.details?.color && (<><dt className="border-b border-line py-3 text-muted">Color</dt><dd className="border-b border-line py-3">{p.details.color}</dd></>)}
            <dt className="border-b border-line py-3 text-muted">Tallas</dt><dd className="border-b border-line py-3">{sz.map((v) => v.name).join(', ')}</dd>
            {p.max_per_customer && (<><dt className="border-b border-line py-3 text-muted">Límite</dt><dd className="border-b border-line py-3">{p.max_per_customer} por persona</dd></>)}
            <dt className="border-b border-line py-3 text-muted">Cambios</dt>
            <dd className="border-b border-line py-3">Solo por defecto de fábrica. <Link href="/politicas" className="underline underline-offset-4">Ver políticas</Link></dd>
          </dl>
        </div>
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ground/95 p-3 backdrop-blur md:hidden">
          {actions}
        </div>
      )}

      {zoom && img && (
        <div role="dialog" aria-modal="true" aria-label="Foto ampliada" className="fixed inset-0 z-50 flex flex-col bg-navy animate-fade">
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
