'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCompany, useSession } from '@/lib/hooks';
import { sb } from '@/lib/supabase';
import { ORDER_STATUS, PAY_STATUS, PLAN, amounts, errMsg, fechaHora, left, money, phoneLocal, sizes, waLink } from '@/lib/format';
import type { Order, Product } from '@/lib/types';
import { Badge, Icon, Logo, Spinner, StateBox, btnOutline, btnPrimary, btnSecondary, card, input, useToast } from '@/components/ui';

type Filter = 'revision' | 'porpagar' | 'entregar' | 'entregados' | 'cancelados' | 'todos';

export default function Admin() {
  const { company } = useCompany();
  const { session, ready } = useSession();
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!company || !session || session.user.is_anonymous) { setRole(null); return; }
    setRole(undefined);
    sb().from('memberships').select('role').eq('company_id', company.id).eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setRole((data as { role: string } | null)?.role ?? null));
  }, [company, session]);

  if (!ready || !company || (session && !session.user.is_anonymous && role === undefined)) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="text-muted" /></div>;
  }
  if (!session || session.user.is_anonymous) return <Login />;
  if (!role) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <StateBox icon="shield" title="Tu cuenta no tiene acceso al panel"
          action={<button onClick={() => sb().auth.signOut()} className={`${btnOutline} h-11`}>Cerrar sesión</button>}>
          Entraste como {session.user.email}. Pide a la persona dueña de la tienda que te dé acceso.
        </StateBox>
      </div>
    );
  }
  return <Dashboard companyId={company.id} email={session.user.email || ''} />;
}

function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'in') {
        const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: pass });
        if (error) throw error;
      } else {
        const { data, error } = await sb().auth.signUp({ email: email.trim(), password: pass, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        if (!data.session) setMsg({ ok: true, text: 'Te enviamos un correo para confirmar tu cuenta. Ábrelo y después inicia sesión aquí.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err) });
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className={`${card} w-full max-w-sm p-6`}>
        <Logo />
        <h1 className="mt-5 text-xl font-bold">{mode === 'in' ? 'Panel de administración' : 'Crear cuenta de administrador'}</h1>
        <p className="mt-1 text-sm text-muted">Solo para el equipo de SarabiaShop.</p>
        <label htmlFor="em" className="mb-1.5 mt-5 block text-[13px] font-semibold">Correo</label>
        <input id="em" type="email" required autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw" className="mb-1.5 mt-3 block text-[13px] font-semibold">Contraseña</label>
        <input id="pw" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} className={input} value={pass} onChange={(e) => setPass(e.target.value)} />
        {msg && <p role="alert" className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-[#B42318]'}`}>{msg.text}</p>}
        <button disabled={busy} className={`${btnPrimary} mt-5 h-12 w-full`}>{busy && <Spinner />} {mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
        <button type="button" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); }} className="mt-3 h-10 w-full text-sm font-semibold underline-offset-4 hover:underline">
          {mode === 'in' ? 'Es mi primera vez: crear cuenta' : 'Ya tengo cuenta: entrar'}
        </button>
        <Link href="/" className="mt-1 block text-center text-sm text-muted hover:text-ink">Ir a la tienda</Link>
      </form>
    </div>
  );
}

function Dashboard({ companyId, email }: { companyId: string; email: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pedidos' | 'inventario'>('pedidos');
  const [filter, setFilter] = useState<Filter>('revision');
  const [q, setQ] = useState('');
  const [review, setReview] = useState<Order | null>(null);
  const { toast, toastNode } = useToast();

  const load = useCallback(async () => {
    const [o, p] = await Promise.all([
      sb().from('orders').select('*,customers(full_name,whatsapp,no_show_count,business_name),order_items(id,qty,unit_price,product_name,variant_name,sku),payments(id,amount_expected,amount_reported,proof_path,status,rejection_reason,created_at),shipments(carrier,tracking_number,shipped_on,status)')
        .eq('company_id', companyId).order('created_at', { ascending: false }),
      sb().from('products').select('id,sku,name,price,goal_qty,reserved_qty,status,product_variants(id,name,kind,stock_qty,reserved_qty,position),product_images(storage_path,alt,position)')
        .eq('company_id', companyId).order('created_at'),
    ]);
    if (o.data) setOrders(o.data as unknown as Order[]);
    if (p.data) setProducts(p.data as unknown as Product[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
    const ch = sb().channel('admin-' + companyId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `company_id=eq.${companyId}` }, () => load())
      .subscribe();
    return () => { sb().removeChannel(ch); };
  }, [companyId, load]);

  const live = orders.filter((o) => o.status !== 'cancelado');
  const stats = useMemo(() => {
    const pieces = live.reduce((a, o) => a + o.order_items.reduce((s, i) => s + i.qty, 0), 0);
    const stock = products.reduce((a, p) => a + sizes(p).reduce((s, v) => s + (v.stock_qty ?? 0), 0), 0);
    const paid = live.reduce((a, o) => a + Number(o.amount_paid), 0);
    const pending = live.reduce((a, o) => a + Math.max(Number(o.total) - Number(o.amount_paid), 0), 0);
    return { pieces, stock, paid, pending, review: orders.filter((o) => o.payment_status === 'revision').length };
  }, [orders, products, live]);

  const inFilter = (o: Order, f: Filter) => {
    if (f === 'todos') return true;
    if (f === 'cancelados') return o.status === 'cancelado';
    if (o.status === 'cancelado') return false;
    if (f === 'revision') return o.payment_status === 'revision';
    if (f === 'porpagar') return o.status !== 'entregado' && (o.payment_status === 'pendiente' || o.payment_status === 'rechazado') && amounts(o).now > 0;
    if (f === 'entregados') return o.status === 'entregado';
    return o.status !== 'entregado' && amounts(o).now === 0 && o.payment_status !== 'revision';
  };
  const filters: { id: Filter; label: string }[] = [
    { id: 'revision', label: 'Pagos por revisar' }, { id: 'porpagar', label: 'Por pagar' }, { id: 'entregar', label: 'Listos para entregar' },
    { id: 'entregados', label: 'Entregados' }, { id: 'cancelados', label: 'Cancelados' }, { id: 'todos', label: 'Todos' },
  ];
  const term = q.trim().toLowerCase();
  const shown = orders.filter((o) => inFilter(o, filter) && (!term || String(o.number).includes(term) || o.customers?.full_name.toLowerCase().includes(term) || o.customers?.whatsapp.includes(term)));

  const run = async (fn: string, args: Record<string, unknown>, ok: string) => {
    const { error } = await sb().rpc(fn, args);
    if (error) { toast(errMsg(error)); return false; }
    toast(ok);
    load();
    return true;
  };

  const shareStore = async () => {
    const url = window.location.origin;
    try { await navigator.clipboard.writeText(url); toast('Link de la tienda copiado'); } catch { toast(url); }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-line bg-ground/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link href="/" className="mr-auto flex items-center gap-2"><Logo compact /><span className="font-bold">Panel</span></Link>
          <button onClick={shareStore} className={`${btnSecondary} h-10 text-sm`}><Icon name="copy" size={16} /> <span className="hidden sm:inline">Copiar link de la tienda</span><span className="sm:hidden">Link</span></button>
          <button onClick={() => sb().auth.signOut()} aria-label={`Cerrar sesión de ${email}`} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-soft"><Icon name="logout" /></button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section aria-label="Resumen" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: 'Piezas apartadas', v: `${stats.pieces} de ${stats.stock}`, s: `${stats.stock - stats.pieces} disponibles` },
            { k: 'Cobrado', v: money(stats.paid), s: 'Transferencias aprobadas y efectivo' },
            { k: 'Por cobrar', v: money(stats.pending), s: 'Incluye efectivo al entregar' },
            { k: 'Pagos por revisar', v: String(stats.review), s: stats.review ? 'Revísalos para asegurar apartados' : 'Todo al día', alert: stats.review > 0 },
          ].map((t) => (
            <div key={t.k} className={`${card} p-4 ${t.alert ? 'border-[#F1DC9C] bg-[#FFF8E1]' : ''}`}>
              <div className="text-[13px] text-muted">{t.k}</div>
              <div className="mt-1 text-2xl font-bold tracking-tight tabular">{t.v}</div>
              <div className="mt-0.5 text-xs text-muted">{t.s}</div>
            </div>
          ))}
        </section>

        <div role="tablist" className="mt-6 flex gap-1 border-b border-line">
          {(['pedidos', 'inventario'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`-mb-px h-11 border-b-2 px-3 text-sm font-semibold ${tab === t ? 'border-ink text-ink' : 'border-transparent text-muted'}`}>
              {t === 'pedidos' ? 'Pedidos' : 'Inventario por talla'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center"><Spinner className="mx-auto text-muted" /></div>
        ) : tab === 'inventario' ? (
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className={`${card} p-4`}>
                <div className="flex gap-3">
                  {p.product_images?.[0] && <img src={p.product_images[0].storage_path} alt="" className="h-16 w-12 rounded-lg object-cover" />}
                  <div className="min-w-0">
                    <div className="font-semibold leading-5">{p.name}</div>
                    <div className="font-mono text-xs text-muted">{p.sku}</div>
                    <div className="mt-1 text-sm tabular">{p.reserved_qty} de {p.goal_qty} apartadas</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {sizes(p).map((v) => (
                    <div key={v.id} className={`rounded-xl border p-2 text-center ${left(v) === 0 ? 'border-[#B9E2C9] bg-[#EEF8F2]' : 'border-line'}`}>
                      <div className="text-lg font-bold">{v.name}</div>
                      <div className="text-xs tabular text-muted">{v.reserved_qty}/{v.stock_qty} apartadas</div>
                      <div className={`text-xs font-semibold ${left(v) === 0 ? 'text-ok' : ''}`}>{left(v) === 0 ? 'Agotada' : `Quedan ${left(v)}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar pedidos">
                {filters.map((f) => {
                  const n = orders.filter((o) => inFilter(o, f.id)).length;
                  const on = filter === f.id;
                  return (
                    <button key={f.id} role="tab" aria-selected={on} onClick={() => setFilter(f.id)}
                      className={`flex h-9 flex-none items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${on ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
                      {f.label}<span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/20' : 'bg-soft'}`}>{n}</span>
                    </button>
                  );
                })}
              </div>
              <input aria-label="Buscar pedido" placeholder="Buscar por #, nombre o WhatsApp" value={q} onChange={(e) => setQ(e.target.value)} className={`${input} h-10 sm:max-w-xs`} />
            </div>

            {shown.length === 0 ? (
              <StateBox icon="list" title="No hay pedidos aquí">
                {filter === 'revision' ? 'Cuando un cliente suba su comprobante aparecerá aquí.' : 'Prueba con otro filtro.'}
              </StateBox>
            ) : (
              <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                {shown.map((o) => <OrderCard key={o.id} o={o} onReview={() => setReview(o)} run={run} />)}
              </ul>
            )}
          </section>
        )}
      </main>

      {review && <ReviewDialog o={review} onClose={() => setReview(null)} run={run} />}
      {toastNode}
    </div>
  );
}

function OrderCard({ o, onReview, run }: { o: Order; onReview: () => void; run: (fn: string, a: Record<string, unknown>, ok: string) => Promise<boolean> }) {
  const [panel, setPanel] = useState<null | 'quote' | 'guide' | 'deliver' | 'noshow'>(null);
  const [quote, setQuote] = useState('');
  const [carrier, setCarrier] = useState('Estafeta');
  const [guide, setGuide] = useState('');
  const [busy, setBusy] = useState(false);
  const a = amounts(o);
  const closed = o.status === 'cancelado' || o.status === 'entregado';
  const cash = Math.max(Number(o.total) - Number(o.amount_paid), 0);
  const c = o.customers;
  const go = async (fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const done = await run(fn, args, ok);
    setBusy(false);
    if (done) setPanel(null);
  };
  const wa = waLink(c?.whatsapp, `Hola ${c?.full_name.split(' ')[0] || ''}, te escribo de SarabiaShop sobre tu pedido #${o.number}.`);

  return (
    <li className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono font-semibold">#{o.number}</div>
          <div className="text-xs text-muted">{fechaHora(o.created_at)}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge small {...ORDER_STATUS[o.status]} />
          {o.status !== 'cancelado' && <Badge small {...PAY_STATUS[o.payment_status]} />}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm">
          <div className="font-semibold">{c?.full_name}</div>
          <div className="text-muted">{phoneLocal(c?.whatsapp)}{c && c.no_show_count > 0 ? ` · ${c.no_show_count} advertencia${c.no_show_count > 1 ? 's' : ''}` : ''}</div>
        </div>
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} h-9 text-[13px]`}><Icon name="chat" size={15} /> WhatsApp</a>
      </div>
      <ul className="mt-3 rounded-xl bg-[#FAFAF8] px-3 py-2 text-sm">
        {o.order_items.map((i) => <li key={i.id} className="py-0.5">{i.qty} × {i.product_name.replace(/^Playera\s+/i, '')} · <b>{i.variant_name}</b></li>)}
      </ul>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular">
        <dt className="text-muted">Total</dt><dd className="text-right font-bold">{money(o.total)}</dd>
        <dt className="text-muted">Pago</dt><dd className="text-right">{o.payment_plan ? PLAN[o.payment_plan].short : '—'}</dd>
        <dt className="text-muted">Pagado</dt><dd className="text-right">{money(o.amount_paid)}</dd>
        <dt className="text-muted">Entrega</dt><dd className="text-right">{o.delivery_method === 'recoger' ? 'Punto de entrega' : o.delivery_method === 'domicilio' ? 'Domicilio' : 'Paquetería'}</dd>
        {o.payment_due_at && !closed && amounts(o).now > 0 && <><dt className="text-muted">Paga antes de</dt><dd className="text-right">{fechaHora(o.payment_due_at)}</dd></>}
      </dl>
      {o.address_snapshot && <p className="mt-2 text-[13px] text-muted">{o.address_snapshot.street}, {o.address_snapshot.neighborhood} · {o.address_snapshot.city} {o.address_snapshot.postal_code}</p>}
      {o.delivery_notes && <p className="mt-1 text-[13px] text-muted">Nota: {o.delivery_notes}</p>}
      {o.status === 'cancelado' && o.status_reason && <p className="mt-2 text-[13px] text-muted">{o.status_reason}</p>}

      {!closed && (
        <div className="mt-4 flex flex-wrap gap-2">
          {o.payment_status === 'revision' && <button onClick={onReview} className={`${btnPrimary} h-10 text-sm`}><Icon name="search" size={16} /> Revisar comprobante</button>}
          {o.delivery_method === 'paqueteria' && <button onClick={() => setPanel(panel === 'quote' ? null : 'quote')} className={`${btnOutline} h-10 text-sm`}>Cotizar envío</button>}
          {o.delivery_method === 'paqueteria' && o.payment_status === 'aprobado' && <button onClick={() => setPanel(panel === 'guide' ? null : 'guide')} className={`${btnOutline} h-10 text-sm`}>Agregar guía</button>}
          {o.delivery_method !== 'paqueteria' && a.now === 0 && <button onClick={() => setPanel(panel === 'deliver' ? null : 'deliver')} className={`${btnOutline} h-10 text-sm`}><Icon name="check" size={16} /> Entregado</button>}
          {o.delivery_method !== 'paqueteria' && o.payment_plan !== 'transferencia' && <button onClick={() => setPanel(panel === 'noshow' ? null : 'noshow')} className="h-10 px-2 text-sm font-semibold text-[#B42318]">No se presentó</button>}
        </div>
      )}

      {panel === 'quote' && (
        <div className="mt-3 flex gap-2 animate-fade">
          <input aria-label="Costo del envío" inputMode="decimal" placeholder="Costo del envío" className={`${input} h-11`} value={quote} onChange={(e) => setQuote(e.target.value.replace(/[^\d.]/g, ''))} />
          <button disabled={busy || !quote} onClick={() => go('set_shipping_quote', { p_order_id: o.id, p_cost: Number(quote), p_note: null }, `Envío de #${o.number}: ${money(quote)}`)} className={`${btnPrimary} h-11 text-sm`}>Guardar</button>
        </div>
      )}
      {panel === 'guide' && (
        <div className="mt-3 grid gap-2 animate-fade sm:grid-cols-[auto_1fr_auto]">
          <select aria-label="Paquetería" className={`${input} h-11`} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {['Estafeta', 'DHL', 'FedEx', 'Paquetexpress', '99 Minutos', 'J&T Express', 'Otra'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <input aria-label="Número de guía" placeholder="Número de guía" className={`${input} h-11 font-mono`} value={guide} onChange={(e) => setGuide(e.target.value)} />
          <button disabled={busy || guide.trim().length < 6} onClick={() => go('add_shipment', { p_order_id: o.id, p_carrier: carrier, p_tracking: guide, p_shipped_on: null, p_boxes: null, p_notes: null }, `#${o.number} enviado`)} className={`${btnPrimary} h-11 text-sm`}>Guardar</button>
        </div>
      )}
      {panel === 'deliver' && (
        <div className="mt-3 rounded-xl bg-[#EEF8F2] p-3 text-sm animate-fade">
          <p>{cash > 0 ? <>Cobra <b>{money(cash)}</b> en efectivo al entregar.</> : 'Ya está pagado completo.'}</p>
          <button disabled={busy} onClick={() => go('mark_delivered', { p_order_id: o.id }, `#${o.number} entregado`)} className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-ok px-4 text-sm font-bold text-white hover:bg-[#0E5F3A] disabled:opacity-60">{busy && <Spinner />} Confirmar entrega</button>
        </div>
      )}
      {panel === 'noshow' && (
        <div className="mt-3 rounded-xl bg-[#FEF1EF] p-3 text-sm animate-fade">
          <p>Se cancela el pedido, las piezas regresan al inventario y {c?.full_name.split(' ')[0]} recibe una advertencia ({(c?.no_show_count ?? 0) + 1} de 3).</p>
          <button disabled={busy} onClick={() => go('mark_no_show', { p_order_id: o.id }, `Advertencia registrada para ${c?.full_name}`)} className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-bad px-4 font-bold text-white">{busy && <Spinner />} Confirmar</button>
        </div>
      )}
    </li>
  );
}

function ReviewDialog({ o, onClose, run }: { o: Order; onClose: () => void; run: (fn: string, a: Record<string, unknown>, ok: string) => Promise<boolean> }) {
  const pay = [...(o.payments || [])].filter((p) => p.status === 'revision').sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  const [url, setUrl] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('El monto no coincide con el total del pedido.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pay?.proof_path) return;
    sb().storage.from('payment-proofs').createSignedUrl(pay.proof_path, 3600).then(({ data }) => setUrl(data?.signedUrl || null));
  }, [pay?.proof_path]);

  if (!pay) return null;
  const expected = Number(pay.amount_expected);
  const reported = Number(pay.amount_reported ?? 0);
  const match = Math.abs(expected - reported) < 0.5;
  const isPdf = /\.pdf$/i.test(pay.proof_path || '');

  const act = async (approve: boolean) => {
    setBusy(true);
    const ok = await run('review_payment', { p_payment_id: pay.id, p_approve: approve, p_reason: approve ? null : reason },
      approve ? `Pago de #${o.number} aprobado` : `Pago de #${o.number} rechazado`);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6 animate-fade">
      <div role="dialog" aria-modal="true" aria-labelledby="rv-t" className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl animate-up sm:animate-fade">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 id="rv-t" className="font-bold">Comprobante · #{o.number} · {o.customers?.full_name}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-soft"><Icon name="x" /></button>
        </div>
        <div className="grid flex-1 overflow-y-auto sm:grid-cols-[1.3fr_1fr]">
          <div className="flex min-h-[300px] items-center justify-center bg-[#ECECE8] p-3">
            {!url ? <Spinner className="text-muted" /> : isPdf ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} h-11`}>Abrir PDF</a>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir en grande"><img src={url} alt="Comprobante de pago" className="max-h-[60vh] w-auto rounded-lg" /></a>
            )}
          </div>
          <div className="flex flex-col gap-3 p-4">
            <dl className="grid grid-cols-[1fr_auto] gap-2 text-sm tabular">
              <dt className="text-muted">Debe pagar</dt><dd className="text-right font-bold">{money(expected)}</dd>
              <dt className="text-muted">Dice que pagó</dt><dd className={`text-right font-bold ${match ? 'text-ok' : 'text-[#B42318]'}`}>{money(reported)}</dd>
              <dt className="text-muted">Concepto esperado</dt><dd className="text-right font-mono">Pedido {o.number}</dd>
            </dl>
            <p className={`flex items-center gap-2 rounded-lg p-2.5 text-[13px] font-semibold ${match ? 'bg-[#DFF3E7] text-[#11663F]' : 'bg-[#FDE7E4] text-[#B42318]'}`}>
              <Icon name={match ? 'check' : 'alert'} size={16} /> {match ? 'El monto coincide. Verifica que el dinero esté en tu cuenta.' : 'El monto no coincide con lo que debe pagar.'}
            </p>
            {!rejecting ? (
              <div className="mt-auto flex flex-col gap-2">
                <button disabled={busy} onClick={() => act(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ok font-bold text-white hover:bg-[#0E5F3A]">{busy && <Spinner />}<Icon name="check" size={18} stroke={2.4} /> Aprobar pago</button>
                <button onClick={() => setRejecting(true)} className="h-12 rounded-xl border-[1.5px] border-bad font-bold text-[#B42318] hover:bg-[#FEF1EF]">Rechazar</button>
              </div>
            ) : (
              <div className="mt-auto flex flex-col gap-2 animate-fade">
                <label htmlFor="rr" className="text-[13px] font-semibold">Motivo (se lo enviamos al cliente)</label>
                <select id="rr" className={input} value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option>El monto no coincide con el total del pedido.</option>
                  <option>No se ve bien el comprobante.</option>
                  <option>El pago no aparece en la cuenta.</option>
                  <option>La transferencia se hizo a otra cuenta.</option>
                </select>
                <button disabled={busy} onClick={() => act(false)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-bad font-bold text-white">{busy && <Spinner />} Rechazar y avisar</button>
                <button onClick={() => setRejecting(false)} className="h-10 text-sm font-semibold">Volver</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
