'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCompany, useCustomer } from '@/lib/hooks';
import { sb } from '@/lib/supabase';
import { ORDER_STATUS, PAY_STATUS, PLAN, amounts, fechaHora, money, needsTransfer, piezas, tiempoRestante } from '@/lib/format';
import type { Order } from '@/lib/types';
import { Badge, Icon, Skeleton, StateBox, btnPrimary } from '@/components/ui';

export default function MisPedidos() {
  const { company } = useCompany();
  const { customer, loading: cl } = useCustomer(company?.id);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!company || !customer) return;
    const { data, error } = await sb().from('orders')
      .select('id,number,status,status_reason,payment_status,payment_plan,delivery_method,subtotal,shipping_cost,total,deposit_amount,amount_paid,payment_due_at,created_at,order_items(qty,product_name,variant_name,unit_price)')
      .eq('company_id', company.id).eq('customer_id', customer.id).order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setOrders((data || []) as unknown as Order[]);
  }, [company, customer]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="display text-[52px] sm:text-[64px]">Mis pedidos</h1>
      {customer && <p className="mt-1 text-sm text-muted">Hola, {customer.full_name.split(' ')[0]}. Aquí ves el estado de cada apartado.</p>}

      {cl || (customer && !orders && !error) ? (
        <div className="mt-5 space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}</div>
      ) : error ? (
        <StateBox icon="alert" tone="bad" title="No pudimos cargar tus pedidos" action={<button onClick={load} className={`${btnPrimary} h-11`}>Reintentar</button>}>
          Revisa tu conexión. Tus apartados están a salvo.
        </StateBox>
      ) : !customer || (orders && orders.length === 0) ? (
        <StateBox icon="list" title="Aún no tienes pedidos en este celular" action={<Link href="/" className={`${btnPrimary} h-12`}>Ver modelos</Link>}>
          Cuando apartes, tus pedidos aparecerán aquí. Si apartaste desde otro celular, escríbenos por WhatsApp.
        </StateBox>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {orders!.map((o) => {
            const st = o.status === 'cancelado' ? ORDER_STATUS.cancelado : o.payment_status === 'aprobado' && o.status === 'confirmado' ? PAY_STATUS.aprobado : o.status === 'confirmado' ? PAY_STATUS[o.payment_status] : ORDER_STATUS[o.status];
            const pcs = o.order_items.reduce((a, i) => a + i.qty, 0);
            const owe = needsTransfer(o);
            return (
              <li key={o.id}>
                <Link href={`/pedidos/${o.id}`} className="block rounded-2xl border border-line bg-white p-4 transition hover:border-[#C9C9C2]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[15px] font-semibold">Pedido #{o.number}</div>
                      <div className="text-[13px] text-muted">{fechaHora(o.created_at)}</div>
                    </div>
                    <Badge {...st} />
                  </div>
                  <div className="mt-3 text-sm text-[#33373D]">
                    {o.order_items.map((i, k) => <div key={k}>{i.qty} × {i.product_name.replace(/^Playera\s+/i, '')} · talla {i.variant_name}</div>)}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm tabular">
                    <span className="text-muted">{piezas(pcs)} · {o.payment_plan ? PLAN[o.payment_plan].short : ''}</span>
                    <span className="flex items-center gap-1 text-base font-bold">{money(o.total)} <Icon name="right" size={18} className="text-muted" /></span>
                  </div>
                  {owe && o.payment_due_at && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF8E1] px-3 py-2.5 text-[13px] font-semibold text-[#5C3E00]">
                      <Icon name="clock" size={16} /> Sube tu comprobante de {money(amounts(o).now)} · quedan {tiempoRestante(o.payment_due_at)}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
