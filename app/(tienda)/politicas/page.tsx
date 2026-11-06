'use client';

import { useCompany } from '@/lib/hooks';
import { phoneLocal, waLink } from '@/lib/format';
import { Icon, Skeleton } from '@/components/ui';

export default function Politicas() {
  const { company, loading } = useCompany();
  const policies = company?.settings?.policies || [];
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="display text-[52px] sm:text-[64px]">Políticas de compra</h1>
      <p className="mt-1 text-sm text-muted">Claras desde el principio, para que apartes con confianza.</p>
      {loading && !company ? (
        <div className="mt-5 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {policies.map((p) => (
            <section key={p.title} className="rounded-2xl border border-line bg-white p-4">
              <h2 className="font-bold">{p.title}</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {p.items.map((it, k) => (
                  <li key={k} className="flex gap-2 text-[15px] leading-6 text-[#33373D]">
                    <Icon name="check" size={18} stroke={2.2} className="mt-1 flex-none text-ok" /> <span>{it}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {company?.whatsapp && (
            <a href={waLink(company.whatsapp, 'Hola, tengo una duda sobre las políticas de SarabiaShop')} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line2 bg-white font-semibold">
              <Icon name="chat" size={18} /> Dudas al WhatsApp {phoneLocal(company.whatsapp)}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
