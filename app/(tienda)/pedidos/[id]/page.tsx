'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCompany } from '@/lib/hooks';
import { sb } from '@/lib/supabase';
import {
  ORDER_STATUS, PAY_STATUS, PLAN, amounts, errMsg, fechaHora, money, needsTransfer, phoneLocal, piezas, tiempoRestante, waLink,
} from '@/lib/format';
import type { ActivityEvent, Order, PaymentSettings } from '@/lib/types';
import { BackLink, Badge, Icon, Skeleton, Spinner, StateBox, btnOutline, btnPrimary, card, input, useToast } from '@/components/ui';

export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>();
  const { company } = useCompany();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [bank, setBank] = useState<PaymentSettings | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [nuevo, setNuevo] = useState(false);
  const [, setTick] = useState(0);
  const { toast, toastNode } = useToast();

  const load = useCallback(async () => {
    const [o, ev] = await Promise.all([
      sb().from('orders').select('*,order_items(id,qty,unit_price,subtotal,product_name,variant_name,sku),payments(id,amount_expected,amount_reported,status,rejection_reason,created_at),shipments(carrier,tracking_number,shipped_on,status)').eq('id', id).maybeSingle(),
      sb().from('activity_events').select('id,kind,title,detail,actor_label,created_at').eq('order_id', id).order('created_at'),
    ]);
    if (o.error) return setState('error');
    if (!o.data) return setState('missing');
    setOrder(o.data as unknown as Order);
    setEvents((ev.data || []) as ActivityEvent[]);
    setState('ok');
  }, [id]);

  useEffect(() => {
    load();
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nuevo')) setNuevo(true);
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    const ch = sb().channel(`pedido-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { clearInterval(t); sb().removeChannel(ch); };
  }, [id, load]);

  useEffect(() => {
    if (!company) return;
    sb().from('company_payment_settings').select('bank_name,beneficiary,clabe,account_number,instructions').eq('company_id', company.id).maybeSingle()
      .then(({ data }) => setBank((data as PaymentSettings) || null));
  }, [company]);

  if (state === 'loading') {
    return <div className="mx-auto max-w-2xl space-y-3 py-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-56 w-full rounded-2xl" /></div>;
  }
  if (state !== 'ok' || !order) {
    return (
      <StateBox icon={state === 'error' ? 'alert' : 'search'} tone={state === 'error' ? 'bad' : 'neutral'}
        title={state === 'error' ? 'No pudimos cargar tu pedido' : 'No encontramos este pedido'}
        action={state === 'error' ? <button onClick={load} className={`${btnPrimary} h-11`}>Reintentar</button> : <Link href="/pedidos" className={`${btnPrimary} h-11`}>Mis pedidos</Link>}>
        {state === 'error' ? 'Revisa tu conexión e intenta de nuevo.' : 'Solo puedes ver los pedidos que apartaste desde este celular.'}
      </StateBox>
    );
  }

  const a = amounts(order);
  const owe = needsTransfer(order);
  const lastPay = [...(order.payments || [])].sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  const cancelled = order.status === 'cancelado';
  const pcs = order.order_items.reduce((s, i) => s + i.qty, 0);
  const d = order.delivery_method ? company?.settings?.delivery?.[order.delivery_method] : undefined;
  const canCancel = order.status === 'confirmado' && Number(order.amount_paid) === 0 && order.payment_status !== 'revision';
  const help = waLink(company?.whatsapp, `Hola, tengo una duda sobre mi pedido #${order.number}`);

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="pt-2"><BackLink href="/pedidos" label="Mis pedidos" /></div>

      {nuevo && !cancelled && (
        <div role="status" className="mt-2 flex flex-col items-center rounded-2xl border border-[#B9E2C9] bg-[#EEF8F2] px-4 py-6 text-center animate-fade">
          <span className="flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-ok text-white"><Icon name="check" size={28} stroke={2.6} /></span>
          <h1 className="mt-3 text-xl font-bold">¡Apartado realizado!</h1>
          <p className="mt-1 text-[15px] text-[#33373D]">Tu pedido #{order.number} quedó registrado: {piezas(pcs)}.</p>
          {owe && order.payment_due_at && <p className="mt-1 text-sm text-muted">Sube tu comprobante antes de {fechaHora(order.payment_due_at)} para asegurarlo.</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pedido <span className="font-mono">#{order.number}</span></h2>
          <p className="text-sm text-muted">Apartado el {fechaHora(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge {...ORDER_STATUS[order.status]} />
          {!cancelled && <Badge {...PAY_STATUS[order.payment_status]} />}
        </div>
      </div>

      {cancelled && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-sm">
          <div className="font-semibold">Este apartado se canceló</div>
          <div className="mt-1 text-muted">{order.status_reason || 'Las piezas volvieron a estar disponibles.'}</div>
        </div>
      )}

      {owe && (
        <PaySection order={order} bank={bank} companyId={company?.id} rejected={order.payment_status === 'rechazado' ? lastPay?.rejection_reason : null}
          onDone={() => { toast('Recibimos tu comprobante'); load(); }} />
      )}

      {!cancelled && order.payment_status === 'revision' && (
        <div className={`${card} mt-4 flex gap-3 border-[#F1DC9C] bg-[#FFF8E1] p-4`}>
          <Icon name="search" size={22} className="mt-0.5 flex-none text-[#7A5200]" />
          <div className="text-sm leading-5">
            <div className="font-bold text-[#5C3E00]">Estamos revisando tu pago</div>
            <div className="mt-0.5 text-[#33373D]">Tu comprobante será revisado por nuestro equipo. Te avisamos por WhatsApp en cuanto se apruebe.</div>
          </div>
        </div>
      )}

      {!cancelled && order.payment_plan && !owe && a.later > 0 && order.status !== 'entregado' && (
        <div className={`${card} mt-4 flex gap-3 p-4`}>
          <Icon name="cash" size={22} className="mt-0.5 flex-none" />
          <div className="text-sm leading-5">
            <div className="font-semibold">Pagas {money(a.later)} en efectivo al recibir</div>
            <div className="mt-0.5 text-muted">{order.payment_plan === 'anticipo' ? 'Tu anticipo ya está cubierto.' : 'Lleva el monto exacto si puedes.'}</div>
          </div>
        </div>
      )}

      <section aria-labelledby="h-prod" className={`${card} mt-4 p-4`}>
        <h3 id="h-prod" className="font-bold">Productos</h3>
        <ul className="mt-2 divide-y divide-[#EEEEEA]">
          {order.order_items.map((i, k) => (
            <li key={i.id || k} className="flex justify-between gap-3 py-2.5 text-sm tabular">
              <span><span className="font-semibold">{i.qty} × {i.product_name}</span><span className="block text-muted">Talla {i.variant_name} · {money(i.unit_price)} c/u</span></span>
              <span className="font-semibold">{money(i.qty * Number(i.unit_price))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-1.5 border-t border-[#EEEEEA] pt-3 text-sm tabular">
          <dt className="text-muted">Subtotal</dt><dd className="text-right">{money(order.subtotal)}</dd>
          <dt className="text-muted">Entrega</dt>
          <dd className="text-right">{order.delivery_method === 'paqueteria' && Number(order.shipping_cost) === 0 ? 'Por cotizar' : Number(order.shipping_cost) === 0 ? 'Gratis' : money(order.shipping_cost)}</dd>
          <dt className="font-bold">Total</dt><dd className="text-right text-base font-bold">{money(order.total)}</dd>
          {Number(order.amount_paid) > 0 && <><dt className="text-muted">Pagado</dt><dd className="text-right text-ok">{money(order.amount_paid)}</dd></>}
          <dt className="text-muted">Forma de pago</dt><dd className="text-right">{order.payment_plan ? PLAN[order.payment_plan].label : '—'}</dd>
        </dl>
      </section>

      <section aria-labelledby="h-ent" className={`${card} mt-4 p-4`}>
        <h3 id="h-ent" className="font-bold">Entrega</h3>
        <div className="mt-2 flex gap-3 text-sm leading-5">
          <Icon name={order.delivery_method === 'recoger' ? 'pin' : order.delivery_method === 'domicilio' ? 'home' : 'truck'} size={20} className="mt-0.5 flex-none text-muted" />
          <div>
            <div className="font-semibold">{d?.label || 'Entrega'}</div>
            <div className="text-muted">{d?.details}</div>
            {order.address_snapshot && (
              <div className="mt-1.5">{order.address_snapshot.street}{order.address_snapshot.neighborhood ? `, ${order.address_snapshot.neighborhood}` : ''}, {order.address_snapshot.city} · CP {order.address_snapshot.postal_code}</div>
            )}
            {order.shipments?.map((s, k) => (
              <div key={k} className="mt-2 rounded-lg bg-[#DCF1EA] px-3 py-2 text-[#0D4F3D]"><b>{s.carrier}</b> · guía <span className="font-mono">{s.tracking_number}</span></div>
            ))}
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section aria-labelledby="h-hist" className={`${card} mt-4 p-4`}>
          <h3 id="h-hist" className="font-bold">Historial</h3>
          <ol className="mt-3">
            {events.map((e, k) => (
              <li key={e.id} className="flex gap-3">
                <div className="flex w-6 flex-none flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-ink" />
                  {k < events.length - 1 && <span className="my-1 w-0.5 flex-1 bg-line" />}
                </div>
                <div className="pb-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-3"><span className="font-semibold">{e.title}</span><span className="text-xs text-muted">{fechaHora(e.created_at)}</span></div>
                  {e.detail && <div className="text-muted">{e.detail}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <a href={help} target="_blank" rel="noopener noreferrer" className={`${btnOutline} h-12`}><Icon name="chat" size={18} /> ¿Dudas? Escríbenos por WhatsApp {company?.whatsapp ? phoneLocal(company.whatsapp) : ''}</a>
        {canCancel && <CancelButton orderId={order.id} onDone={() => { toast('Cancelaste tu apartado'); load(); }} />}
      </div>
      {toastNode}
    </div>
  );
}

function PaySection({ order, bank, companyId, rejected, onDone }: {
  order: Order; bank: PaymentSettings | null; companyId?: string; rejected?: string | null; onDone: () => void;
}) {
  const a = amounts(order);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(String(a.now));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* sin portapapeles */ }
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!/^image\//.test(f.type) && f.type !== 'application/pdf') return setError('Elige una foto o un PDF de tu comprobante.');
    if (f.size > 10 * 1024 * 1024) return setError('El archivo pesa más de 10 MB. Toma una captura de pantalla e intenta de nuevo.');
    setFile(f);
  };

  const send = async () => {
    if (!file || !companyId) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Escribe el monto que transferiste.');
    setBusy(true);
    setError(null);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${companyId}/${order.id}/${Date.now()}.${ext}`;
      const up = await sb().storage.from('payment-proofs').upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (up.error) throw up.error;
      const { error } = await sb().rpc('submit_payment', { p_order_id: order.id, p_proof_path: path, p_amount: amt, p_bank: null, p_reference: `Pedido ${order.number}`, p_method: 'transferencia' });
      if (error) throw error;
      onDone();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  const rows = [
    { k: 'Banco', v: bank?.bank_name },
    { k: 'Beneficiario', v: bank?.beneficiary },
    { k: 'CLABE', v: bank?.clabe, copy: true, mono: true },
    { k: 'Concepto', v: `Pedido ${order.number}`, copy: true, mono: true },
    { k: 'Monto', v: money(a.now), raw: String(a.now), copy: true },
  ].filter((r) => r.v);

  return (
    <section aria-labelledby="h-pagar" className={`${card} mt-4 overflow-hidden`}>
      <div className="border-b border-line bg-[#FAFAF8] p-4">
        <h3 id="h-pagar" className="font-bold">{order.payment_plan === 'anticipo' ? 'Paga tu anticipo' : 'Paga tu pedido'}</h3>
        <div className="mt-1 text-3xl font-bold tracking-tight tabular">{money(a.now)}</div>
        {order.payment_due_at && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#7A3600]">
            <Icon name="clock" size={16} /> Antes de {fechaHora(order.payment_due_at)} · quedan {tiempoRestante(order.payment_due_at)}
          </p>
        )}
        {a.later > 0 && <p className="mt-1 text-sm text-muted">Y {money(a.later)} en efectivo al recibir.</p>}
      </div>

      {rejected && (
        <div role="alert" className="flex gap-2 border-b border-[#F5C2BA] bg-[#FEF1EF] p-4 text-sm text-[#8F1D12]">
          <Icon name="x" size={18} className="mt-0.5 flex-none" />
          <span><b>Tu comprobante anterior no se aprobó.</b> {rejected} Sube uno nuevo.</span>
        </div>
      )}

      <div className="p-4">
        <div className="text-sm font-semibold">1. Transfiere a esta cuenta</div>
        {bank?.clabe ? (
          <dl className="mt-2 divide-y divide-[#EEEEEA] rounded-xl border border-line">
            {rows.map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{r.k}</dt>
                  <dd className={`text-[15px] font-semibold ${r.mono ? 'font-mono' : ''} break-all`}>{r.v}</dd>
                </div>
                {r.copy && (
                  <button type="button" onClick={() => copy(r.raw || String(r.v), r.k)} className="flex h-10 flex-none items-center gap-1.5 rounded-lg bg-soft px-3 text-[13px] font-semibold">
                    <Icon name={copied === r.k ? 'check' : 'copy'} size={15} /> {copied === r.k ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted">Te enviamos los datos de pago por WhatsApp.</p>
        )}

        <div className="mt-5 text-sm font-semibold">2. Sube tu comprobante</div>
        <input ref={fileRef} id="comprobante" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        {!file ? (
          <label htmlFor="comprobante" className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#C9C9C2] bg-[#FCFCFB] px-4 py-6 text-center hover:border-ink">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-soft"><Icon name="upload" /></span>
            <span className="font-semibold">Toca para elegir tu comprobante</span>
            <span className="text-[13px] text-muted">Foto o PDF · máximo 10 MB</span>
          </label>
        ) : (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-line p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5ECFC] text-[#2149B8]"><Icon name="image" /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</span>
            <label htmlFor="comprobante" className="cursor-pointer px-2 text-[13px] font-semibold underline">Cambiar</label>
          </div>
        )}
        <label htmlFor="monto" className="mb-1.5 mt-3 block text-[13px] font-semibold">Monto que transferiste</label>
        <input id="monto" className={input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-[#B42318]">{error}</p>}
        <button type="button" onClick={send} disabled={!file || busy} className={`${btnPrimary} mt-4 h-13 h-[52px] w-full`}>
          {busy && <Spinner />} {busy ? 'Enviando…' : 'Enviar comprobante'}
        </button>
        <p className="mt-3 text-[13px] text-muted">Tu comprobante será revisado por nuestro equipo.</p>
      </div>
    </section>
  );
}

function CancelButton({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    const { error } = await sb().rpc('cancel_my_order', { p_order_id: orderId });
    setBusy(false);
    if (error) return setError(errMsg(error));
    setAsk(false);
    onDone();
  };
  return (
    <>
      <button type="button" onClick={() => setAsk(true)} className="h-12 text-sm font-semibold text-[#B42318]">Cancelar apartado</button>
      {ask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 animate-fade">
          <div role="alertdialog" aria-modal="true" aria-labelledby="c-t" className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 id="c-t" className="text-lg font-bold">¿Cancelar tu apartado?</h2>
            <p className="mt-1.5 text-sm text-muted">Las piezas volverán a estar disponibles para otras personas.</p>
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-[#B42318]">{error}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={run} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-bad font-bold text-white">{busy && <Spinner />} Sí, cancelar</button>
              <button type="button" onClick={() => setAsk(false)} className="h-12 rounded-xl bg-soft font-semibold">Conservar mi apartado</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
