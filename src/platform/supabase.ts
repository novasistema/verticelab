import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface Producto {
  slug: string;
  tipo: 'app' | 'ebook';
  nombre: string;
  descripcion: string;
  precio: number | null;
  moneda: string;
  archivo: string | null;
  imagen?: string | null;
  link_compra?: string | null;
  orden: number;
}

export interface Acceso {
  app_slug: string;
  estado: 'activo' | 'vencido';
  vence_el: string | null;
}

export async function cargarProductos(): Promise<Producto[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('orden', { ascending: true });
  if (error) {
    console.error('No se pudo cargar el catálogo:', error.message);
    return [];
  }
  return (data ?? []) as Producto[];
}

export function accesoVigente(a: Acceso): boolean {
  if (a.estado !== 'activo') return false;
  if (!a.vence_el) return true;
  return new Date(a.vence_el).getTime() > Date.now();
}

/** Devuelve los slugs de productos a los que el usuario logueado tiene acceso vigente. */
export async function cargarMisAccesos(): Promise<{ vigentes: Set<string>; todos: Acceso[] }> {
  const { data, error } = await supabase.from('accesos').select('app_slug, estado, vence_el');
  if (error) throw new Error(error.message);
  const todos = (data ?? []) as Acceso[];
  return { vigentes: new Set(todos.filter(accesoVigente).map((a) => a.app_slug)), todos };
}

export function formatearPrecio(p: Producto): string {
  if (p.precio == null) return 'Consultar';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: p.moneda || 'ARS',
    maximumFractionDigits: 0,
  }).format(p.precio);
}
