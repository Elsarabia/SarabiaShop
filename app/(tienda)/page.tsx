'use client';

import Link from 'next/link';
import { useCompany, useProducts } from '@/lib/hooks';
import { fechaLarga, money, shortName, sizes } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton, StateBox, btnPrimary } from '@/components/ui';

const COUNT_WORD: Record<number, string> = { 1: 'El modelo', 2: 'Los dos modelos', 3: 'Los tres modelos', 4: 'Los cuatro modelos', 5: 'Los cinco modelos', 6: 'Los seis modelos' };

export default function Tienda() {
  const { company, error: cErr, reload: reloadCompany } = useCompany();
  const { products, loading, error, reload } = useProducts(company?.id);

  const stock = products.reduce((a, p) => a + sizes(p).reduce((b, v) => b + (v.stock_qty ?? 0), 0), 0);
  const taken = products.reduce((a, p) => a + sizes(p).reduce((b, v) => b + v.reserved_qty, 0), 0);
  const left = Math.max(stock - taken, 0);
  const arrival = products.find((p) => p.expected_arrival)?.expected_arrival;
  const price = products[0]?.price;
  const d = company?.settings?.delivery;
  const ready = products.length > 0;

  return (
    <div>
      {/* Portada */}
      <section className="on-navy bleed bg-navy text-bone">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16">
          <h1 className="display text-[clamp(84px,24vw,232px)]">
            {ready ? <>Solo {stock}<br className="sm:hidden" /> piezas.</> : <>Solo unas<br className="sm:hidden" /> piezas.</>}
          </h1>
          <div className="mt-6 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-end lg:gap-16">
            <div>
              <p className="max-w-md text-[17px] leading-[1.55] text-bone/80 sm:text-lg">
                Playeras originales Banana Republic y GAP. Tres por talla de cada modelo, a {price ? money(price) : '$350'} cada una.
                {arrival && <> Llegan a Tijuana el {fechaLarga(arrival)}.</>}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a href="#modelos" className="inline-flex h-[52px] items-center justify-center rounded-[6px] bg-bone px-7 text-[16px] font-semibold text-navy transition hover:bg-white">
                  Elegir mi talla
                </a>
                <Link href="/politicas" className="text-[15px] text-bone/70 underline decoration-bone/30 underline-offset-4 hover:text-bone">
                  Cómo pagas y recibes
                </Link>
              </div>
            </div>
            <Tally products={products} loading={loading && !ready} left={left} />
          </div>
        </div>
      </section>

      {/* Modelos */}
      <section id="modelos" aria-labelledby="h-modelos" className="scroll-mt-16 pt-14 sm:pt-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 id="h-modelos" className="display text-[52px] sm:text-[72px]">{COUNT_WORD[products.length] || 'Los modelos'}</h2>
          {ready && <p className="hidden pb-2 text-[15px] text-muted sm:block">Toca un modelo para ver tallas</p>}
        </div>
        {(cErr || error) && (
          <StateBox icon="alert" tone="bad" title="No pudimos cargar la tienda"
            action={<button className={`${btnPrimary} h-11`} onClick={() => { reloadCompany(); reload(); }}>Reintentar</button>}>
            Revisa tu conexión. Tus apartados están a salvo.
          </StateBox>
        )}
        {!cErr && !error && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5">
            {loading && !ready
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] rounded-[4px]" />
                    <div className="mt-3 space-y-2"><Skeleton className="h-6 w-4/5" /><Skeleton className="h-3 w-1/2" /></div>
                  </div>
                ))
              : products.map((p, i) => (
                  <div key={p.id} className={products.length % 2 === 1 && i === products.length - 1 ? 'col-span-2 sm:col-span-1' : ''}>
                    <ProductCard p={p} />
                  </div>
                ))}
          </div>
        )}
      </section>

      {/* Cómo funciona: es una secuencia real */}
      <section aria-labelledby="h-como" className="mt-24 border-t border-line pt-10">
        <h2 id="h-como" className="display text-[44px] sm:text-[56px]">Cómo apartar</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {[
            { t: 'Elige modelo y talla', d: 'Ves en vivo cuántas quedan de cada talla. Cuando se acaban, se acaban.' },
            { t: 'Aparta y elige cómo pagar', d: 'Transferencia completa, la mitad para apartar y el resto al recibir, o todo en efectivo al recibir.' },
            { t: 'Recíbela', d: arrival ? `Llegan el ${fechaLarga(arrival)}. Te escribimos por WhatsApp para coordinar la entrega.` : 'Te escribimos por WhatsApp para coordinar la entrega.' },
          ].map((s, i) => (
            <li key={s.t} className="grid grid-cols-[3.25rem_1fr] gap-x-3">
              <span aria-hidden="true" className="display text-[56px] text-gold">{i + 1}</span>
              <div className="pt-1">
                <h3 className="text-[18px] font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-[15px] leading-6 text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Entregas como lista de precios */}
      {d && (
        <section aria-labelledby="h-entrega" className="mt-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <h2 id="h-entrega" className="display text-[44px] sm:text-[56px]">Entregas</h2>
              <p className="mt-3 max-w-sm text-[15px] leading-6 text-muted">
                Eliges cómo recibir al apartar. Cambios solo por defecto de fábrica.{' '}
                <Link href="/politicas" className="text-ink underline underline-offset-4">Ver políticas</Link>
              </p>
            </div>
            <dl className="divide-y divide-line border-y border-line">
              {(['recoger', 'domicilio', 'paqueteria'] as const).filter((k) => d[k] && d[k]?.enabled !== false).map((k) => {
                const o = d[k]!;
                const cost = o.quote ? 'Se cotiza' : !o.cost ? 'Gratis' : money(o.cost);
                return (
                  <div key={k} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-5">
                    <dt className="text-[18px] font-semibold">{o.label}</dt>
                    <dd className="display-soft text-right text-[24px] tabular">{cost}</dd>
                    <dd className="col-span-2 max-w-xl text-[15px] leading-6 text-muted">{o.details}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}

/** Una barra por playera: claras = disponibles, doradas = ya apartadas. Se actualiza en vivo. */
function Tally({ products, loading, left }: { products: Product[]; loading: boolean; left: number }) {
  let n = 0;
  return (
    <div>
      <div className="flex items-end gap-3 sm:gap-5" aria-hidden={loading}>
        {loading
          ? Array.from({ length: 5 }).map((_, g) => (
              <div key={g} className="flex flex-1 gap-[3px]">
                {Array.from({ length: 9 }).map((__, i) => <span key={i} className="h-12 flex-1 rounded-[1px] bg-bone/15 sm:h-20" />)}
              </div>
            ))
          : products.map((p) => {
              const vs = sizes(p);
              const free = vs.reduce((a, v) => a + Math.max((v.stock_qty ?? 0) - v.reserved_qty, 0), 0);
              return (
                <Link key={p.id} href={`/p/${p.sku.toLowerCase()}`} className="group flex min-w-0 flex-1 flex-col gap-2"
                  aria-label={`${shortName(p)}: quedan ${free} de ${vs.reduce((a, v) => a + (v.stock_qty ?? 0), 0)}`}>
                  <span className="flex gap-[5px] sm:gap-2">
                    {vs.map((v) => {
                      const total = v.stock_qty ?? 0;
                      return (
                        <span key={v.id} className="flex flex-1 gap-[2px] sm:gap-[3px]" title={`Talla ${v.name}`}>
                          {Array.from({ length: total }).map((_, i) => {
                            const isTaken = i >= total - v.reserved_qty;
                            const delay = n++ * 14;
                            return (
                              <span key={i}
                                className={`block h-12 flex-1 origin-bottom animate-rise rounded-[1px] transition-colors duration-500 sm:h-20 ${isTaken ? 'bg-gold' : 'bg-bone group-hover:bg-white'}`}
                                style={{ animationDelay: `${delay}ms` }} />
                            );
                          })}
                        </span>
                      );
                    })}
                  </span>
                  <span className="hidden truncate text-[13px] text-bone/60 group-hover:text-bone sm:block">{shortName(p)}</span>
                </Link>
              );
            })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-bone/70">
        <span className="font-semibold text-bone">{loading ? 'Contando piezas…' : left === 0 ? 'Agotado' : `Quedan ${left}`}</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-[5px] rounded-[1px] bg-bone" /> Disponible</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-[5px] rounded-[1px] bg-gold" /> Apartada</span>
      </div>
    </div>
  );
}
