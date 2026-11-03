'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCompany } from '@/lib/hooks';
import { phoneLocal, waLink } from '@/lib/format';
import { Icon, Logo } from './ui';

export function Header() {
  const { count } = useCart();
  const path = usePathname();
  const nav = [
    { href: '/', label: 'Tienda', active: path === '/' || path.startsWith('/p/') },
    { href: '/pedidos', label: 'Mis pedidos', active: path.startsWith('/pedidos') },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" aria-label="SarabiaShop, inicio" className="mr-auto"><Logo /></Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.active ? 'page' : undefined}
              className={`hidden h-10 items-center rounded-xl px-3 text-sm sm:flex ${n.active ? 'bg-soft font-semibold' : 'text-muted hover:bg-soft hover:text-ink'}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/pedidos" aria-label="Mis pedidos" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-soft sm:hidden">
            <Icon name="list" size={22} stroke={1.8} />
          </Link>
          <Link href="/apartado" aria-label={`Tu apartado, ${count} piezas`} className="relative flex h-11 w-11 items-center justify-center rounded-xl hover:bg-soft">
            <Icon name="bag" size={22} stroke={1.8} />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ground bg-ink px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { company } = useCompany();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">SarabiaShop</span>
          <span>Ropa original de marca · {company?.city || 'Tijuana, B.C.'}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/politicas" className="hover:text-ink">Políticas de compra</Link>
          {company?.whatsapp && (
            <a href={waLink(company.whatsapp, 'Hola, tengo una duda sobre SarabiaShop')} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ink">
              <Icon name="chat" size={16} /> WhatsApp {phoneLocal(company.whatsapp)}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
