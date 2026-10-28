import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CloudOff, Check, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../platform/auth';
import { btn, FullScreenMessage, LoadingScreen } from '../platform/ui';
import { cargarMisAccesos } from '../platform/supabase';
import {
  CloudStore,
  setActiveStore,
  leerDatosLocales,
  borrarDatosLocales,
  type SaveStatus,
} from '../platform/cloudStore';
import { APPS } from '../apps/registry';

type Phase = 'checking' | 'denied' | 'migrate' | 'ready' | 'error';

export default function AppPage() {
  const { slug = '' } = useParams();
  const def = APPS[slug];
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('checking');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const storeRef = useRef<CloudStore | null>(null);
  const localRef = useRef<Record<string, unknown> | null>(null);

  const userId = session?.user.id;

  useEffect(() => {
    if (!def || !userId) return;
    let cancelado = false;
    const store = new CloudStore(userId, def.slug);
    storeRef.current = store;
    const unsub = store.subscribe(setStatus);

    (async () => {
      try {
        const { vigentes } = await cargarMisAccesos();
        if (cancelado) return;
        if (!vigentes.has(def.slug)) return setPhase('denied');

        const existe = await store.load();
        if (cancelado) return;

        if (!existe && def.prefijoLocal) {
          const locales = leerDatosLocales(def.prefijoLocal);
          if (locales) {
            localRef.current = locales;
            return setPhase('migrate');
          }
        }
        setActiveStore(store);
        setPhase('ready');
      } catch {
        if (!cancelado) setPhase('error');
      }
    })();

    return () => {
      cancelado = true;
      unsub();
      void store.flush().finally(() => store.dispose());
      setActiveStore(null);
      storeRef.current = null;
    };
  }, [def, userId]);

  const responderMigracion = (subir: boolean) => {
    const store = storeRef.current;
    if (!store || !def) return;
    if (subir && localRef.current) {
      store.replaceAll(localRef.current);
      borrarDatosLocales(def.prefijoLocal!);
    }
    localRef.current = null;
    setActiveStore(store);
    setPhase('ready');
  };

  const logout = useCallback(async () => {
    await storeRef.current?.flush();
    setActiveStore(null);
    await signOut();
    navigate('/ingresar', { replace: true });
  }, [signOut, navigate]);

  if (!def) {
    return (
      <FullScreenMessage title="No encontramos esta app">
        <Link to="/mis-apps" className={btn.gold}>Volver a Mis apps</Link>
      </FullScreenMessage>
    );
  }

  if (phase === 'checking') return <LoadingScreen text={`Abriendo ${def.nombre}…`} />;

  if (phase === 'error') {
    return (
      <FullScreenMessage title="No pudimos abrir la app">
        <p className="m-0 text-on-ink-muted leading-relaxed">Revisá tu conexión a internet y probá de nuevo.</p>
        <button type="button" onClick={() => window.location.reload()} className={btn.gold}>Reintentar</button>
      </FullScreenMessage>
    );
  }

  if (phase === 'denied') {
    return (
      <FullScreenMessage title="Tu acceso no está activo">
        <p className="m-0 text-on-ink-muted leading-relaxed">
          La cuenta {session?.user.email} no tiene un acceso vigente a {def.nombre}. Si ya pagaste, esperá unos
          minutos o escribinos.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/#catalogo" className={btn.gold}>Obtener acceso</Link>
          <Link to="/mis-apps" className={btn.ghostDark}>Mis apps</Link>
        </div>
        <button type="button" onClick={logout} className="bg-transparent border-0 text-on-ink-muted text-sm underline cursor-pointer min-h-[44px]">
          Cerrar sesión
        </button>
      </FullScreenMessage>
    );
  }

  if (phase === 'migrate') {
    return (
      <FullScreenMessage title="Encontramos datos en este dispositivo">
        <p className="m-0 text-on-ink-muted leading-relaxed">
          Hay datos de {def.nombre} guardados en este navegador de antes. ¿Querés subirlos a tu cuenta para
          verlos en todos tus dispositivos?
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => responderMigracion(true)} className={btn.gold}>Sí, subirlos</button>
          <button type="button" onClick={() => responderMigracion(false)} className={btn.ghostDark}>Empezar de cero</button>
        </div>
      </FullScreenMessage>
    );
  }

  const App = def.component;
  return (
    <>
      <Suspense fallback={<LoadingScreen text={`Abriendo ${def.nombre}…`} />}>
        <App userEmail={session?.user.email ?? ''} onLogout={logout} />
      </Suspense>
      <SaveIndicator status={status} />
    </>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'idle') return;
    setVisible(true);
    if (status === 'saved') {
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!visible || status === 'idle') return null;

  const map = {
    saving: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: 'Guardando…', cls: 'text-slate-200' },
    saved: { icon: <Check className="w-3.5 h-3.5 text-emerald-400" />, text: 'Guardado', cls: 'text-slate-200' },
    offline: { icon: <CloudOff className="w-3.5 h-3.5 text-amber-400" />, text: 'Sin conexión, reintentando', cls: 'text-amber-100' },
    denied: { icon: <Lock className="w-3.5 h-3.5 text-rose-400" />, text: 'Tu acceso venció: los cambios no se guardan', cls: 'text-rose-100' },
  } as const;
  const m = map[status as keyof typeof map];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-[60] top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-slate-700 shadow-lg text-xs font-medium font-body pointer-events-none ${m.cls}`}
    >
      {m.icon}
      {m.text}
    </div>
  );
}
