// Datos públicos de conexión. La llave es "anon" (pública por diseño):
// la seguridad real vive en las reglas de la base de datos (RLS y funciones).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phcmdfvnvwrqkcxqxfpn.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoY21kZnZudndycWtjeHF4ZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NzQ0OTksImV4cCI6MjEwOTI1MDQ5OX0.awL7RqNRASoNEWUssK7HxmPcToS6NZskyz593cno4oU';

export const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || 'sarabiashop';

export const STORE_NAME = 'SarabiaShop';
