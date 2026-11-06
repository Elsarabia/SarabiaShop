'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { left, money, productImage, productLeft, shortName, sizes, slugSku } from '@/lib/format';
import { Pieces } from './ui';

export function ProductCard({ p }: { p: Product }) {
  const img = productImage(p);
  const rem = productLeft(p);
  const soldOut = rem === 0;
  const few = !soldOut && rem <= 3;
  return (
    <Link href={`/p/${slugSku(p.sku)}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] bg-studio">
        {img && <img src={img} alt={p.name} loading="lazy" className={`h-full w-full object-cover ${soldOut ? 'opacity-50 grayscale' : ''}`} />}
        {(soldOut || few) && (
          <span className={`absolute left-2 top-2 rounded-[3px] px-2 py-1 text-[12px] font-semibold ${soldOut ? 'bg-white text-ink' : 'bg-navy text-bone'}`}>
            {soldOut ? 'Agotado' : rem === 1 ? 'Última pieza' : `Últimas ${rem}`}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="display-soft text-[22px] leading-[1.02] group-hover:underline group-hover:decoration-gold group-hover:decoration-2 group-hover:underline-offset-4 sm:text-[24px]">
            {shortName(p)}
          </div>
          <div className="mt-1 text-[13px] text-muted">{p.details?.marca}</div>
        </div>
        <div className="pt-0.5 text-[15px] font-semibold tabular">{money(p.price)}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2" aria-label="Disponibilidad por talla">
        {sizes(p).map((v) => {
          const l = left(v);
          return (
            <span key={v.id} className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${l ? '' : 'text-muted line-through'}`}>
              {v.name}
              <Pieces total={v.stock_qty ?? 0} taken={v.reserved_qty} size={6} label={`Talla ${v.name}: ${l ? `quedan ${l}` : 'agotada'}`} />
            </span>
          );
        })}
      </div>
    </Link>
  );
}
