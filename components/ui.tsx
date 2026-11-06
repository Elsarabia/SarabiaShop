'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

const ICONS: Record<string, string> = {
  bag: 'M5 8h14l-1.2 12.2H6.2zM9 8V6.5a3 3 0 0 1 6 0V8',
  back: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M18 6 6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  clock: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 7v5l3 2',
  card: 'M2.5 6h19v12h-19zM2.5 10h19M6 14.5h4',
  search: 'M10.5 17.5a7 7 0 1 0 0-14a7 7 0 1 0 0 14M20.5 20.5 15.5 15.5',
  truck: 'M1.5 5.5h12.5v10H1.5zM14 9h4.2l3.3 3.6v2.9H14M4.2 17.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M15.2 17.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0',
  home: 'M3 10.5 12 3.5l9 7V20.5H3zM9.5 20.5v-6h5v6',
  pin: 'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5',
  box: 'M21 7.5 12 3 3 7.5v9L12 21l9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9',
  clip: 'M9 3h6v3H9zM15 4.5h3v16.5H6V4.5h3M9 11h6M9 15h4',
  send: 'M21.5 2.5 10.5 13.5M21.5 2.5 14.5 21.5l-4-8-8-4z',
  flag: 'M5 21V4M5 4h12l-2.5 4L17 12H5',
  shield: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6zM9 12l2 2 4-4',
  chat: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  upload: 'M12 15V3M7.5 7.5 12 3l4.5 4.5M4 15v4.5h16V15',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  alert: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17.5h.01',
  info: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 11v5M12 8h.01',
  zoom: 'M10.5 17.5a7 7 0 1 0 0-14a7 7 0 1 0 0 14M20.5 20.5 15.5 15.5M10.5 7.5v6M7.5 10.5h6',
  list: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8M4 21a8 8 0 0 1 16 0',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  cash: 'M2.5 6.5h19v11h-19zM12 15a3 3 0 1 0 0-6a3 3 0 1 0 0 6M6 9.5v5M18 9.5v5',
};

export function Icon({ name, size = 20, stroke = 1.9, className = '' }: { name: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={ICONS[name] || ''} />
    </svg>
  );
}

export function Badge({ label, fg, bg, icon, small }: { label: string; fg: string; bg: string; icon?: string; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${small ? 'px-2 py-0.5 text-[11.5px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: bg, color: fg }}>
      {icon && <Icon name={icon} size={small ? 12 : 13} stroke={2.3} />}
      {label}
    </span>
  );
}

/** Wordmark: "Sarabia" ultracondensada + "Shop" en ancho normal. */
export function Logo({ compact, size = 26 }: { name?: string; compact?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-baseline leading-none" style={{ fontSize: size }}>
      <span className="display" style={{ letterSpacing: '0.01em' }}>Sarabia</span>
      {!compact && <span className="ml-[0.12em] text-[0.62em] font-normal tracking-[0.02em]">Shop</span>}
    </span>
  );
}

export function Progress({ value, max, done }: { value: number; max: number; done?: boolean }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-1.5 overflow-hidden rounded-full bg-soft">
      <div className="h-full origin-left animate-grow rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: done ? '#137A4B' : '#0F1A3A' }} />
    </div>
  );
}

/**
 * Una marca por pieza física. Sólida = disponible; dorada = ya apartada.
 * `tone` define el color de las disponibles según el fondo.
 */
export function Pieces({ total, taken, tone = 'navy', size = 9, label }: {
  total: number; taken: number; tone?: 'navy' | 'light'; size?: number; label?: string;
}) {
  const free = tone === 'light' ? '#F6F6F7' : '#0F1A3A';
  return (
    <span className="inline-flex gap-[3px]" role="img" aria-label={label ?? `${Math.max(total - taken, 0)} de ${total} disponibles`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="block rounded-full transition-colors duration-500"
          style={{ width: size, height: size, background: i < total - taken ? free : '#B08D4A' }} />
      ))}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-soft ${className}`} />;
}

export function StateBox({ icon, tone = 'neutral', title, children, action }: {
  icon: string; tone?: 'neutral' | 'bad' | 'ok'; title: string; children?: ReactNode; action?: ReactNode;
}) {
  const t = tone === 'bad' ? 'bg-[#FDE7E4] text-[#B42318]' : tone === 'ok' ? 'bg-[#DFF3E7] text-[#11663F]' : 'bg-soft text-ink';
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-14 text-center animate-fade" role={tone === 'bad' ? 'alert' : undefined}>
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${t}`}><Icon name={icon} size={26} /></span>
      <h2 className="mt-1 text-[17px] font-bold">{title}</h2>
      {children && <div className="max-w-sm text-sm leading-5 text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg animate-fade">
      <Icon name="check" size={18} stroke={2.3} /> {msg}
    </div>
  ) : null;
  return { toast: setMsg, toastNode: node };
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center gap-1 rounded-xl pr-3 text-sm font-semibold text-ink hover:bg-soft">
      <Icon name="back" size={20} stroke={2} /> {label}
    </Link>
  );
}

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-[6px] bg-ink px-5 font-semibold tracking-[0.01em] text-bone transition hover:bg-navy2 disabled:cursor-not-allowed disabled:bg-[#A9ACB8]';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-[6px] border border-ink/80 bg-transparent px-4 font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-40';
export const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-[6px] border border-line2 bg-white px-4 font-semibold text-ink transition hover:bg-bone disabled:opacity-50';
export const card = 'rounded-[10px] border border-line bg-white';
export const input =
  'h-12 w-full rounded-[6px] border border-line2 bg-white px-3.5 text-base text-ink outline-none placeholder:text-[#8A8F96] focus:border-ink';
