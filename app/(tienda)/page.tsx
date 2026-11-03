'use client';

import Link from 'next/link';
import { useCompany, useProducts } from '@/lib/hooks';
import { fechaLarga, money, productLeft } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { Icon, Skeleton, StateBox, btnPrimary } from '@/components/ui';

export default function Tienda() {
  const { company, error: cErr, reload: reloadCompany } = useCompany();
  const { products, loading, error, reload } = useProducts(company?.id);

  const totalLeft = products.reduce((a, p) => a + productLeft(p), 0);
  const arrival = products.find((p) => p.expected_arrival)?.expected_arrival;
  const price = products[0]?.price;
  const d = company?.settings?.delivery;

  return (
    <div className="pb-6">
      <section className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1CC] px-3 py-1 text-xs font-semibold text-[#7A5200]">
            <Icon name="clock" size={14} stroke={2.2} /> Preventa{arrival ? ` · llegan el ${fechaLarga(arrival)}` : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF3E7] px-3 py-1 text-xs font-semibold text-[#11663F]">
            <Icon name="shield" size={14} stroke={2.2} /> 100 % originales
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-[30px] font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Playeras originales Banana Republic y GAP
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">
          Aparta tu talla hoy desde tu celular. Son pocas piezas: solo 3 por talla de cada modelo.
        </p>
        <dl className="mt-5 grid max-w-xl grid-cols-3 gap-2">
          {[
            { k: 'Precio', v: price ? `${money(price)} c/u` : '—' },
            { k: 'Tallas', v: 'S · M · L' },
            { k: 'Disponibles', v: loading ? '…' : `${totalLeft} piezas` },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <dt className="text-xs text-muted">{x.k}</dt>
              <dd className="mt-0.5 text-[15px] font-bold tabular">{x.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="h-modelos" className="mt-8">
        <h2 id="h-modelos" className="mb-3 text-xl font-bold tracking-tight">Modelos</h2>
        {(cErr || error) && (
          <StateBox icon="alert" tone="bad" title="No pudimos cargar la tienda"
            action={<button className={`${btnPrimary} h-11`} onClick={() => { reloadCompany(); reload(); }}>Reintentar</button>}>
            Revisa tu conexión. Tus apartados están a salvo.
          </StateBox>
        )}
        {!cErr && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {loading && products.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
                    <Skeleton className="aspect-[3/4] rounded-none" />
                    <div className="space-y-2 p-3"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-2 w-full" /></div>
                  </div>
                ))
              : products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="h-como" className="mt-12">
        <h2 id="h-como" className="text-xl font-bold tracking-tight">Así de fácil</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { n: 1, t: 'Elige modelo y talla', d: 'Ves en vivo cuántas piezas quedan de cada talla.' },
            { n: 2, t: 'Aparta y elige cómo pagar', d: 'Transferencia, anticipo del 50 % o efectivo al recibir.' },
            { n: 3, t: 'Recíbelas', d: arrival ? `Llegan el ${fechaLarga(arrival)}. Te avisamos por WhatsApp.` : 'Te avisamos por WhatsApp.' },
          ].map((s) => (
            <li key={s.n} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{s.n}</span>
              <div>
                <div className="font-semibold">{s.t}</div>
                <div className="mt-0.5 text-sm text-muted">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {d && (
        <section aria-labelledby="h-entrega" className="mt-10">
          <h2 id="h-entrega" className="text-xl font-bold tracking-tight">Entregas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(['recoger', 'domicilio', 'paqueteria'] as const).filter((k) => d[k]?.enabled !== false).map((k) => (
              <div key={k} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-soft"><Icon name={k === 'recoger' ? 'pin' : k === 'domicilio' ? 'home' : 'truck'} /></span>
                <div>
                  <div className="font-semibold">{d[k]?.label}</div>
                  <div className="mt-0.5 text-sm leading-5 text-muted">{d[k]?.details}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/politicas" className="mt-4 inline-flex h-10 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            Ver políticas de pagos, cambios y reembolsos <Icon name="right" size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
