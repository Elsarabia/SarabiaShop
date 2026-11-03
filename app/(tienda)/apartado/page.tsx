'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { ensureCustomer, useCompany, useCustomer, useProducts } from '@/lib/hooks';
import { sb } from '@/lib/supabase';
import { PLAN, errMsg, left, money, phoneLocal, piezas, sizes } from '@/lib/format';
import type { DeliveryMethod, PaymentPlan } from '@/lib/types';
import { BackLink, Icon, Spinner, StateBox, btnPrimary, card, input } from '@/components/ui';

const PLANS: PaymentPlan[] = ['transferencia', 'anticipo', 'efectivo'];
const DELIVERIES: DeliveryMethod[] = ['recoger', 'domicilio', 'paqueteria'];

export default function Apartado() {
  const router = useRouter();
  const { company } = useCompany();
  const { products } = useProducts(company?.id);
  const { customer, loading: custLoading, reload: reloadCustomer } = useCustomer(company?.id);
  const { items, ready, setQty, remove, clear, count, subtotal } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<PaymentPlan>('transferencia');
  const [delivery, setDelivery] = useState<DeliveryMethod>('recoger');
  const [addr, setAddr] = useState({ street: '', neighborhood: '', city: 'Tijuana', state: 'Baja California', postal_code: '', reference: '' });
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const settings = company?.settings;
  const dset = settings?.delivery || {};
  const maxNoShows = settings?.max_no_shows ?? 3;
  const cashBlocked = (customer?.no_show_count ?? 0) >= maxNoShows;
  const minDomicilio = dset.domicilio?.min_pieces ?? 0;

  // Disponibilidad actual de cada pieza del apartado
  const availability = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) for (const v of sizes(p)) m.set(v.id, left(v));
    return m;
  }, [products]);

  const shipping = delivery === 'recoger' ? 0 : delivery === 'domicilio' ? Number(dset.domicilio?.cost ?? 0) : null;
  const total = subtotal + (shipping ?? 0);
  const payNow = plan === 'transferencia' ? total : plan === 'anticipo' ? Math.ceil(total / 2) : 0;
  const payLater = total - payNow;

  const planDisabled = (pl: PaymentPlan): string | null => {
    if (settings?.payment_plans && !settings.payment_plans.includes(pl)) return 'No disponible';
    if (pl === 'efectivo' && cashBlocked) return `Tienes ${maxNoShows} advertencias por apartados no recogidos`;
    if (delivery === 'paqueteria' && pl !== 'transferencia') return 'Con envío nacional el pago es completo por transferencia';
    return null;
  };
  const deliveryDisabled = (d: DeliveryMethod): string | null => {
    if (dset[d]?.enabled === false) return 'No disponible';
    if (d === 'domicilio' && count < minDomicilio) return `Solo pedidos de más de ${minDomicilio - 1} piezas (llevas ${count})`;
    return null;
  };

  const chooseDelivery = (d: DeliveryMethod) => {
    setDelivery(d);
    if (d === 'paqueteria') setPlan('transferencia');
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const needAddr = delivery !== 'recoger';
  const errs = {
    name: !customer && name.trim().length < 2 ? 'Escribe tu nombre.' : null,
    phone: !customer && phoneDigits.length !== 10 ? 'Escribe tu WhatsApp a 10 dígitos.' : null,
    street: needAddr && !addr.street.trim() ? 'Escribe calle y número.' : null,
    city: needAddr && !addr.city.trim() ? 'Escribe la ciudad.' : null,
    postal_code: needAddr && !/^\d{5}$/.test(addr.postal_code) ? 'El código postal tiene 5 dígitos.' : null,
  };
  const stockProblem = items.find((i) => i.variantId && availability.size > 0 && (availability.get(i.variantId) ?? 0) < i.qty);
  const invalid = Object.values(errs).some(Boolean) || !!planDisabled(plan) || !!deliveryDisabled(delivery) || !!stockProblem;

  const confirm = async () => {
    setTried(true);
    setError(null);
    if (invalid) return;
    setBusy(true);
    try {
      if (!customer) {
        await ensureCustomer(name.trim(), phoneDigits);
        await reloadCustomer();
      }
      const { data, error } = await sb().rpc('checkout_preventa', {
        p_items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, qty: i.qty })),
        p_plan: plan,
        p_delivery: delivery,
        p_address: needAddr ? addr : null,
        p_notes: notes || null,
      });
      if (error) throw error;
      clear();
      router.push(`/pedidos/${(data as { order_id: string }).order_id}?nuevo=1`);
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="py-4">
        <BackLink href="/" label="Modelos" />
        <StateBox icon="bag" title="Tu apartado está vacío"
          action={<div className="flex flex-col items-center gap-3"><Link href="/" className={`${btnPrimary} h-12`}>Ver modelos</Link><Link href="/pedidos" className="text-sm font-semibold underline underline-offset-4">Ver mis pedidos</Link></div>}>
          Elige tu modelo y talla para apartar.
        </StateBox>
      </div>
    );
  }

  const fieldErr = (k: keyof typeof errs) => (tried && errs[k] ? <p className="mt-1 text-[13px] font-semibold text-[#B42318]">{errs[k]}</p> : null);
  const errBorder = (k: keyof typeof errs) => (tried && errs[k] ? 'border-2 border-[#C4321F]' : '');

  return (
    <div className="mx-auto max-w-2xl pb-36">
      <div className="pt-2"><BackLink href="/" label="Seguir viendo" /></div>
      <h1 className="mt-1 text-[26px] font-bold tracking-tight">Tu apartado</h1>
      <p className="text-sm text-muted">{piezas(count)} · {money(subtotal)}</p>

      <section aria-label="Piezas" className={`${card} mt-4 divide-y divide-[#EEEEEA]`}>
        {items.map((i) => {
          const avail = i.variantId ? availability.get(i.variantId) : undefined;
          const short = avail !== undefined && avail < i.qty;
          return (
            <div key={`${i.productId}-${i.variantId}`} className="flex gap-3 p-3">
              {i.image && <img src={i.image} alt="" className="h-[88px] w-[66px] flex-none rounded-lg object-cover bg-soft" />}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[15px] font-semibold leading-5">{i.name}</span>
                  <span className="font-bold tabular">{money(i.qty * i.price)}</span>
                </div>
                <span className="text-sm text-muted">Talla {i.size} · {money(i.price)} c/u</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-line2">
                    <button type="button" aria-label="Quitar una" onClick={() => setQty(i.productId, i.variantId, i.qty - 1)} className="flex h-10 w-10 items-center justify-center"><Icon name="minus" size={17} stroke={2.2} /></button>
                    <span className="w-8 text-center font-bold tabular">{i.qty}</span>
                    <button type="button" aria-label="Agregar una" disabled={avail !== undefined && i.qty >= avail} onClick={() => setQty(i.productId, i.variantId, i.qty + 1)} className="flex h-10 w-10 items-center justify-center disabled:opacity-30"><Icon name="plus" size={17} stroke={2.2} /></button>
                  </div>
                  <button type="button" onClick={() => remove(i.productId, i.variantId)} className="h-10 px-2 text-sm font-semibold text-[#B42318]">Quitar</button>
                </div>
                {short && (
                  <p className="text-[13px] font-semibold text-[#B42318]">
                    {avail === 0 ? 'Esta talla se agotó. Quítala para continuar.' : `Solo ${avail === 1 ? 'queda 1' : `quedan ${avail}`}. Ajusta la cantidad.`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="h-datos" className="mt-6">
        <h2 id="h-datos" className="text-lg font-bold">Tus datos</h2>
        {custLoading ? (
          <div className="mt-3 h-12 animate-pulse rounded-xl bg-[#E9E9E4]" />
        ) : customer ? (
          <div className={`${card} mt-3 flex items-center gap-3 p-4`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
              {customer.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <div className="text-sm"><div className="font-semibold">{customer.full_name}</div><div className="text-muted">WhatsApp {phoneLocal(customer.whatsapp)}</div></div>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="n" className="mb-1.5 block text-[13px] font-semibold">Nombre</label>
              <input id="n" className={`${input} ${errBorder('name')}`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre y apellido" />
              {fieldErr('name')}
            </div>
            <div>
              <label htmlFor="w" className="mb-1.5 block text-[13px] font-semibold">WhatsApp</label>
              <input id="w" className={`${input} ${errBorder('phone')}`} type="tel" inputMode="numeric" autoComplete="tel-national" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 14))} placeholder="664 123 4567" />
              {fieldErr('phone')}
            </div>
            <p className="text-[13px] text-muted sm:col-span-2">Por aquí te avisamos de tu pedido. No necesitas contraseña: tus pedidos quedan guardados en este celular.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="h-entrega" className="mt-6">
        <h2 id="h-entrega" className="text-lg font-bold">¿Cómo lo quieres recibir?</h2>
        <div role="radiogroup" aria-labelledby="h-entrega" className="mt-3 grid gap-2">
          {DELIVERIES.map((d) => {
            const dis = deliveryDisabled(d);
            const on = delivery === d;
            const opt = dset[d];
            const cost = d === 'recoger' ? 'Gratis' : d === 'domicilio' ? `+${money(opt?.cost ?? 0)}` : 'Se cotiza';
            return (
              <button key={d} type="button" role="radio" aria-checked={on} disabled={!!dis} onClick={() => chooseDelivery(d)}
                className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'border-2 border-ink' : 'border-line hover:border-[#C9C9C2]'}`}>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-soft"><Icon name={d === 'recoger' ? 'pin' : d === 'domicilio' ? 'home' : 'truck'} /></span>
                <span className="flex-1">
                  <span className="flex justify-between gap-2"><span className="font-semibold">{opt?.label}</span><span className="text-sm font-semibold">{cost}</span></span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muted">{dis || opt?.details}</span>
                </span>
              </button>
            );
          })}
        </div>
        {needAddr && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 animate-fade">
            <div className="sm:col-span-2">
              <label htmlFor="a1" className="mb-1.5 block text-[13px] font-semibold">Calle y número</label>
              <input id="a1" className={`${input} ${errBorder('street')}`} autoComplete="street-address" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
              {fieldErr('street')}
            </div>
            <div>
              <label htmlFor="a2" className="mb-1.5 block text-[13px] font-semibold">Colonia</label>
              <input id="a2" className={input} value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} />
            </div>
            <div>
              <label htmlFor="a3" className="mb-1.5 block text-[13px] font-semibold">Código postal</label>
              <input id="a3" className={`${input} ${errBorder('postal_code')}`} inputMode="numeric" autoComplete="postal-code" value={addr.postal_code}
                onChange={(e) => setAddr({ ...addr, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
              {fieldErr('postal_code')}
            </div>
            <div>
              <label htmlFor="a4" className="mb-1.5 block text-[13px] font-semibold">Ciudad</label>
              <input id="a4" className={`${input} ${errBorder('city')}`} autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
              {fieldErr('city')}
            </div>
            <div>
              <label htmlFor="a5" className="mb-1.5 block text-[13px] font-semibold">Estado</label>
              <input id="a5" className={input} autoComplete="address-level1" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="a6" className="mb-1.5 block text-[13px] font-semibold">Referencias (opcional)</label>
              <input id="a6" className={input} value={addr.reference} onChange={(e) => setAddr({ ...addr, reference: e.target.value })} placeholder="Color de la casa, entre calles…" />
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="h-pago" className="mt-6">
        <h2 id="h-pago" className="text-lg font-bold">¿Cómo quieres pagar?</h2>
        <div role="radiogroup" aria-labelledby="h-pago" className="mt-3 grid gap-2">
          {PLANS.map((pl) => {
            const dis = planDisabled(pl);
            const on = plan === pl;
            const amt = pl === 'transferencia' ? `${money(total)} ahora` : pl === 'anticipo' ? `${money(Math.ceil(total / 2))} ahora` : `${money(total)} al recibir`;
            return (
              <button key={pl} type="button" role="radio" aria-checked={on} disabled={!!dis} onClick={() => setPlan(pl)}
                className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'border-2 border-ink' : 'border-line hover:border-[#C9C9C2]'}`}>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-soft"><Icon name={pl === 'efectivo' ? 'cash' : 'card'} /></span>
                <span className="flex-1">
                  <span className="flex justify-between gap-2"><span className="font-semibold">{PLAN[pl].label}</span><span className="text-sm font-semibold tabular">{amt}</span></span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muted">{dis || PLAN[pl].help}</span>
                </span>
              </button>
            );
          })}
        </div>
        {plan === 'efectivo' && !cashBlocked && (
          <p className="mt-2 flex gap-2 rounded-xl bg-[#FFF3E9] p-3 text-[13px] leading-5 text-[#7A3600]">
            <Icon name="info" size={18} className="mt-px flex-none" />
            Si no te presentas a recoger, recibes una advertencia. Con {maxNoShows} advertencias solo podrás apartar con transferencia o anticipo.
            {customer && customer.no_show_count > 0 ? ` Llevas ${customer.no_show_count}.` : ''}
          </p>
        )}
      </section>

      <section className="mt-6">
        <label htmlFor="notes" className="mb-1.5 block text-[13px] font-semibold">Notas para la entrega (opcional)</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-line2 bg-white px-3.5 py-3 text-base outline-none focus:border-ink" />
      </section>

      <section aria-label="Resumen" className={`${card} mt-6 p-4`}>
        <dl className="grid grid-cols-[1fr_auto] gap-2 text-[15px] tabular">
          <dt className="text-muted">Productos · {piezas(count)}</dt><dd className="text-right">{money(subtotal)}</dd>
          <dt className="text-muted">Entrega</dt><dd className="text-right">{shipping === null ? 'Se cotiza' : shipping === 0 ? 'Gratis' : money(shipping)}</dd>
          <dt className="border-t border-[#EEEEEA] pt-2 font-bold">Total{shipping === null ? ' sin envío' : ''}</dt>
          <dd className="border-t border-[#EEEEEA] pt-2 text-right text-lg font-bold">{money(total)}</dd>
          {payNow > 0 && <><dt className="text-muted">Pagas ahora por transferencia</dt><dd className="text-right font-semibold">{money(payNow)}</dd></>}
          {payLater > 0 && <><dt className="text-muted">Pagas en efectivo al recibir</dt><dd className="text-right font-semibold">{money(payLater)}</dd></>}
        </dl>
        {payNow > 0 && <p className="mt-3 text-[13px] text-muted">Tendrás 24 horas para subir tu comprobante; si no, tu apartado se libera para alguien más.</p>}
      </section>

      <p className="mt-4 flex gap-2 text-[13px] leading-5 text-muted">
        <Icon name="shield" size={18} className="flex-none text-ok" />
        Tu apartado queda registrado en cuanto confirmas y puedes consultarlo en cualquier momento en “Mis pedidos”.
      </p>

      {error && (
        <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-[#FEF1EF] p-3 text-sm font-semibold text-[#8F1D12]">
          <Icon name="alert" size={18} className="mt-px flex-none" /> {error}
        </div>
      )}
      {tried && stockProblem && !error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-[#B42318]">Una de tus tallas ya no tiene suficientes piezas. Ajusta tu apartado.</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="hidden flex-col sm:flex">
            <span className="text-xs text-muted">{payNow > 0 ? 'Pagas ahora' : 'Total'}</span>
            <span className="text-lg font-bold tabular">{money(payNow > 0 ? payNow : total)}</span>
          </div>
          <button type="button" onClick={confirm} disabled={busy} className={`${btnPrimary} h-14 flex-1 text-base`}>
            {busy && <Spinner />} {busy ? 'Apartando…' : `Confirmar apartado · ${piezas(count)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
