import { Footer, Header } from '@/components/Shell';

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4">{children}</main>
      <Footer />
    </>
  );
}
