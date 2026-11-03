'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { left, money, productImage, productLeft, sizes, slugSku } from '@/lib/format';
import { Progress } from './ui';

export function ProductCard({ p }: { p: Product }) {
  const img = productImage(p);
  const rem = productLeft(p);
  const soldOut = rem === 0;
  const few = !soldOut && rem <= 3;
  return (
    <Link href={`/p/${slugSku(p.sku)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-[#C9C9C2] active:scale-[.99]">
      <div className="relative aspect-[3/4] bg-soft">
        {img && <img src={img} alt={p.name} loading="lazy" className={`h-full w-full object-cover ${soldOut ? 'opacity-60' : ''}`} />}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold">
          {soldOut ? 'Agotado' : few ? `Últimas ${rem}` : 'Preventa'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{p.details?.marca}</span>
        <span className="min-h-[40px] text-[15px] font-semibold leading-5">{p.name.replace(/^Playera\s+/i, '').replace(p.details?.marca || '', '').trim() || p.name}</span>
        <span className="text-lg font-bold tabular">{money(p.price)}</span>
        <div className="flex gap-1.5" aria-label="Tallas disponibles">
          {sizes(p).map((v) => {
            const l = left(v);
            return (
              <span key={v.id} title={l ? `Quedan ${l}` : 'Agotada'}
                className={`flex h-7 min-w-[34px] items-center justify-center rounded-lg border px-1.5 text-xs font-semibold ${l ? 'border-line2 text-ink' : 'border-line text-[#A0A4AA] line-through'}`}>
                {v.name}
              </span>
            );
          })}
        </div>
        <div className="mt-auto pt-1">
          <Progress value={p.reserved_qty} max={p.goal_qty} done={soldOut} />
          <div className="mt-1.5 flex justify-between text-xs text-muted tabular">
            <span>{p.reserved_qty} de {p.goal_qty} apartadas</span>
            {!soldOut && <span className={few ? 'font-semibold text-[#C2410C]' : ''}>Quedan {rem}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
