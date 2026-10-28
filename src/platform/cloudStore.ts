import { supabase } from './supabase';

/**
 * Almacenamiento en la nube por usuario y por app.
 *
 * Las apps lo usan igual que localStorage (getItem / setItem / removeItem),
 * pero los datos viven en la tabla public.datos_app de Supabase, en una fila
 * por usuario y app, protegida por las reglas de seguridad (RLS).
 *
 * Los cambios se agrupan y se guardan 1 segundo después del último cambio.
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'denied';

type Data = Record<string, unknown>;

const SAVE_DELAY_MS = 1000;
const RETRY_DELAY_MS = 5000;

export class CloudStore {
  private data: Data = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saving = false;
  private pending = false;
  private listeners = new Set<(s: SaveStatus) => void>();
  private _status: SaveStatus = 'idle';
  private disposed = false;

  constructor(
    readonly userId: string,
    readonly appSlug: string,
  ) {
    this.onHide = this.onHide.bind(this);
    document.addEventListener('visibilitychange', this.onHide);
    window.addEventListener('pagehide', this.onHide);
  }

  get status() {
    return this._status;
  }

  /** Carga los datos del usuario. Devuelve false si todavía no tiene fila guardada. */
  async load(): Promise<boolean> {
    const { data, error } = await supabase
      .from('datos_app')
      .select('data')
      .eq('user_id', this.userId)
      .eq('app_slug', this.appSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return false;
    this.data = (data.data as Data) ?? {};
    return true;
  }

  /** Reemplaza todos los datos (se usa al migrar datos guardados en el navegador). */
  replaceAll(values: Data) {
    this.data = { ...values };
    this.schedule(0);
  }

  getItem(key: string): string | null {
    if (!(key in this.data)) return null;
    const v = this.data[key];
    return typeof v === 'string' ? v : JSON.stringify(v);
  }

  setItem(key: string, value: string) {
    let parsed: unknown = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* se guarda como texto */
    }
    if (JSON.stringify(this.data[key]) === JSON.stringify(parsed)) return;
    this.data[key] = parsed;
    this.schedule(SAVE_DELAY_MS);
  }

  removeItem(key: string) {
    if (!(key in this.data)) return;
    delete this.data[key];
    this.schedule(SAVE_DELAY_MS);
  }

  subscribe(fn: (s: SaveStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this._status);
    return () => this.listeners.delete(fn);
  }

  /** Guarda ya lo pendiente (al ocultar la pestaña o cerrar sesión). */
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      await this.save();
    } else if (this.saving) {
      this.pending = true;
    }
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    document.removeEventListener('visibilitychange', this.onHide);
    window.removeEventListener('pagehide', this.onHide);
    this.listeners.clear();
    this.data = {};
  }

  private onHide() {
    if (document.visibilityState === 'hidden') void this.flush();
  }

  private setStatus(s: SaveStatus) {
    this._status = s;
    this.listeners.forEach((fn) => fn(s));
  }

  private schedule(delay: number) {
    if (this.disposed) return;
    if (this.timer) clearTimeout(this.timer);
    this.setStatus('saving');
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.save();
    }, delay);
  }

  private async save() {
    if (this.disposed) return;
    if (this.saving) {
      this.pending = true;
      return;
    }
    this.saving = true;
    this.setStatus('saving');
    const snapshot = JSON.parse(JSON.stringify(this.data));
    const { error } = await supabase
      .from('datos_app')
      .upsert(
        { user_id: this.userId, app_slug: this.appSlug, data: snapshot },
        { onConflict: 'user_id,app_slug' },
      );
    this.saving = false;
    if (this.disposed) return;

    if (error) {
      // 42501 = la regla de seguridad rechazó el guardado (acceso vencido o revocado)
      if (error.code === '42501') {
        this.setStatus('denied');
        return;
      }
      this.setStatus('offline');
      this.schedule(RETRY_DELAY_MS);
      return;
    }

    if (this.pending) {
      this.pending = false;
      void this.save();
      return;
    }
    this.setStatus('saved');
  }
}

/* ------------------------------------------------------------------ */
/* Datos viejos guardados en el navegador (antes de la nube)            */
/* ------------------------------------------------------------------ */

export function leerDatosLocales(prefijo: string): Data | null {
  const out: Data = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefijo)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw == null) continue;
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    }
  } catch {
    return null;
  }
  return Object.keys(out).length ? out : null;
}

export function borrarDatosLocales(prefijo: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefijo)) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* sin acceso al almacenamiento local */
  }
}

/* ------------------------------------------------------------------ */
/* Almacenamiento activo: lo que usan las apps en lugar de localStorage */
/* ------------------------------------------------------------------ */

let active: CloudStore | null = null;

export function setActiveStore(store: CloudStore | null) {
  active = store;
}

export const appStorage = {
  getItem(key: string): string | null {
    return active ? active.getItem(key) : null;
  },
  setItem(key: string, value: string) {
    active?.setItem(key, value);
  },
  removeItem(key: string) {
    active?.removeItem(key);
  },
};
