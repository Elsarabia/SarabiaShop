import { SUPABASE_URL } from './config';
import type { DeliveryMethod, Order, OrderStatus, PaymentPlan, PaymentStatus, Product, Variant } from './types';

const mx = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

export const money = (n: number | string | null | undefined) => '$' + mx.format(Number(n || 0));
export const piezas = (n: number) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`;

const TZ = 'America/Tijuana';
export function fechaLarga(d: string | Date) {
  const date = typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: TZ });
}
export function fechaHora(d: string | Date) {
  return new Date(d).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ,
  });
}
export function tiempoRestante(d: string) {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return 'vencido';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

export function productImage(p: Product) {
  const img = [...(p.product_images || [])].sort((a, b) => a.position - b.position)[0];
  return imgUrl(img?.storage_path);
}

export function sizes(p: Product): Variant[] {
  return [...(p.product_variants || [])].filter((v) => v.kind === 'talla').sort((a, b) => a.position - b.position);
}
export const left = (v: Variant) => Math.max(0, (v.stock_qty ?? 0) - v.reserved_qty);
export const productLeft = (p: Product) => Math.max(0, p.goal_qty - p.reserved_qty);

/** "Playera Banana Republic Script Blanca" → "Script Blanca" */
export function shortName(p: Pick<Product, 'name' | 'details'>) {
  const brand = p.details?.marca || '';
  const s = p.name.replace(/^Playera\s+/i, '').replace(brand, '').trim();
  return s || p.name;
}

export function slugSku(sku: string) {
  return sku.toLowerCase();
}

export function waLink(phone: string | null | undefined, text: string) {
  const digits = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function phoneLocal(phone: string | null | undefined) {
  const d = (phone || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : phone || '';
}

export function errMsg(e: unknown): string {
  const m = (e as { message?: string })?.message || String(e || '');
  if (/anonymous sign-ins are disabled/i.test(m)) return 'Todavía no podemos registrar clientes en línea. Escríbenos por WhatsApp para apartar.';
  if (/failed to fetch|network/i.test(m)) return 'No pudimos conectarnos. Revisa tu internet e intenta de nuevo.';
  if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(m)) return 'Primero confirma tu correo con el enlace que te enviamos.';
  if (/user already registered/i.test(m)) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (/password should be at least/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit/i.test(m)) return 'Hiciste muchos intentos seguidos. Espera unos minutos.';
  return m || 'Algo salió mal. Intenta de nuevo.';
}

export const PLAN: Record<PaymentPlan, { label: string; short: string; help: string }> = {
  transferencia: { label: 'Transferencia completa', short: 'Transferencia', help: 'Pagas todo ahora por transferencia. Tienes 24 horas para subir tu comprobante.' },
  anticipo: { label: 'Anticipo del 50 %', short: 'Anticipo 50 %', help: 'Transfieres la mitad para apartar y pagas el resto en efectivo al recibir.' },
  efectivo: { label: 'Efectivo al recibir', short: 'Efectivo', help: 'Pagas todo en efectivo el día de la entrega.' },
};

export const DELIVERY_ICON: Record<DeliveryMethod, string> = {
  recoger: 'pin',
  domicilio: 'home',
  paqueteria: 'truck',
};

type Tone = { label: string; fg: string; bg: string; icon: string };

export const ORDER_STATUS: Record<OrderStatus, Tone> = {
  por_confirmar: { label: 'Por confirmar', fg: '#7A5200', bg: '#FFF1CC', icon: 'flag' },
  confirmado: { label: 'Apartado', fg: '#2149B8', bg: '#E5ECFC', icon: 'check' },
  en_transito: { label: 'En tránsito', fg: '#0A6470', bg: '#DBF0F2', icon: 'truck' },
  espera: { label: 'En espera', fg: '#9C4500', bg: '#FFE9D6', icon: 'clock' },
  recibido: { label: 'Recibido', fg: '#3F4B5A', bg: '#E8ECF1', icon: 'box' },
  preparando: { label: 'Preparando', fg: '#6236B8', bg: '#EFE8FB', icon: 'clip' },
  enviado: { label: 'Enviado', fg: '#0E6A52', bg: '#DCF1EA', icon: 'send' },
  entregado: { label: 'Entregado', fg: '#FFFFFF', bg: '#137A4B', icon: 'home' },
  cancelado: { label: 'Cancelado', fg: '#4A4F57', bg: '#E4E4DF', icon: 'x' },
};

export const PAY_STATUS: Record<PaymentStatus, Tone> = {
  pendiente: { label: 'Pago pendiente', fg: '#4A4F57', bg: '#ECECE8', icon: 'card' },
  revision: { label: 'Pago en revisión', fg: '#7A5200', bg: '#FFF1CC', icon: 'search' },
  aprobado: { label: 'Pago aprobado', fg: '#11663F', bg: '#DFF3E7', icon: 'check' },
  rechazado: { label: 'Pago rechazado', fg: '#B42318', bg: '#FDE7E4', icon: 'x' },
};

/** Cuánto debe pagar ahora el cliente (por transferencia) y cuánto al recibir. */
export function amounts(o: Pick<Order, 'payment_plan' | 'total' | 'deposit_amount' | 'amount_paid'>) {
  const total = Number(o.total);
  const paid = Number(o.amount_paid || 0);
  if (o.payment_plan === 'anticipo') {
    const dep = Number(o.deposit_amount ?? Math.ceil(total / 2));
    return { now: Math.max(dep - paid, 0), later: Math.max(total - Math.max(dep, paid), 0) };
  }
  if (o.payment_plan === 'efectivo') return { now: 0, later: Math.max(total - paid, 0) };
  return { now: Math.max(total - paid, 0), later: 0 };
}

export function needsTransfer(o: Order) {
  return (
    o.status !== 'cancelado' && o.status !== 'entregado' &&
    (o.payment_status === 'pendiente' || o.payment_status === 'rechazado') && amounts(o).now > 0
  );
}
