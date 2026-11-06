import { Footer, Header } from '@/components/Shell';

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">{children}</main>
      <Footer />
    </>
  );
}
