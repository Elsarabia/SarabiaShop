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
    { href: '/#modelos', label: 'Modelos', active: path === '/' || path.startsWith('/p/') },
    { href: '/pedidos', label: 'Mis pedidos', active: path.startsWith('/pedidos') },
  ];
  return (
    <header className="on-navy sticky top-0 z-30 bg-navy text-bone">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 sm:px-6">
        <Link href="/" aria-label="SarabiaShop, inicio" className="mr-auto -ml-1 rounded px-1 py-1"><Logo size={28} /></Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.active ? 'page' : undefined}
              className={`hidden h-10 items-center px-3 text-[15px] sm:flex ${n.active ? 'text-bone underline decoration-gold decoration-2 underline-offset-[10px]' : 'text-bone/70 hover:text-bone'}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/pedidos" aria-label="Mis pedidos" className="flex h-11 w-11 items-center justify-center rounded-md text-bone/85 hover:text-bone sm:hidden">
            <Icon name="list" size={22} stroke={1.7} />
          </Link>
          <Link href="/apartado" aria-label={`Tu apartado, ${count} piezas`} className="relative flex h-11 w-11 items-center justify-center rounded-md text-bone/85 hover:text-bone">
            <Icon name="bag" size={22} stroke={1.7} />
            {count > 0 && (
              <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy">
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
    <footer className="on-navy mt-20 bg-navy text-bone">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <Logo size={44} />
          <p className="mt-3 max-w-xs text-[15px] leading-6 text-bone/70">
            Ropa original de marca en preventa, desde {company?.city || 'Tijuana, B.C.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-[15px]">
          <span className="text-bone/50">Dudas</span>
          {company?.whatsapp && (
            <a href={waLink(company.whatsapp, 'Hola, tengo una duda sobre SarabiaShop')} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-gold">
              <Icon name="chat" size={17} /> WhatsApp {phoneLocal(company.whatsapp)}
            </a>
          )}
          <Link href="/pedidos" className="hover:text-gold">Mis pedidos</Link>
        </div>
        <div className="flex flex-col gap-2 text-[15px]">
          <span className="text-bone/50">Compra segura</span>
          <Link href="/politicas" className="hover:text-gold">Políticas de pagos y cambios</Link>
          <span className="text-bone/70">Solo piezas originales</span>
        </div>
      </div>
    </footer>
  );
}
