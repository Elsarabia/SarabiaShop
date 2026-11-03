# SarabiaShop · Preventa

Tienda de preventa colectiva de SarabiaShop (Tijuana). Next.js 15 + Supabase.

- Tienda: `/` · Producto: `/p/{sku}` · Apartado: `/apartado` · Mis pedidos: `/pedidos` · Políticas: `/politicas`
- Panel de administración: `/admin`

## Publicar en Vercel
Importa este repositorio en Vercel y presiona **Deploy**. No requiere variables de entorno (la URL y la llave pública de Supabase vienen por defecto en `lib/config.ts`; se pueden sobrescribir con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Local
```
npm install
npm run dev
```
