import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Download, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../platform/auth';
import { Logo, Label, btn, LoadingScreen } from '../platform/ui';
import { whatsappLink } from '../platform/config';
import { cargarMisAccesos, cargarProductos, supabase, type Producto, type Acceso } from '../platform/supabase';
import { APPS } from '../apps/registry';

export default function MisApps() {
  const { session, signOut } = useAuth();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [vigentes, setVigentes] = useState<Set<string>>(new Set());
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([cargarProductos(), cargarMisAccesos()])
      .then(([p, a]) => {
        setProductos(p);
        setVigentes(a.vigentes);
        setAccesos(a.todos);
      })
      .catch(() => setError('No pudimos cargar tus productos. Revisá tu conexión y recargá la página.'));
  }, []);

  if (!productos && !error) return <LoadingScreen text="Cargando tus productos…" />;

  const lista = productos ?? [];
  const mios = lista.filter((p) => vigentes.has(p.slug));
  const otros = lista.filter((p) => !vigentes.has(p.slug));
  const vencidos = new Set(accesos.filter((a) => !vigentes.has(a.app_slug)).map((a) => a.app_slug));

  return (
    <div className="min-h-screen bg-paper text-text font-body">
      <header className="bg-ink text-on-ink">
        <div className="max-w-[1100px] mx-auto px-6 box-border py-5 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-on-ink-muted break-all">{session?.user.email}</span>
            <button type="button" onClick={signOut} className={`${btn.ghostDark} min-h-[44px] px-4 text-sm`}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 box-border py-14 flex flex-col gap-14">
        {error && (
          <p role="alert" className="m-0 p-4 rounded-md bg-white border border-paper-line text-text">{error}</p>
        )}

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label>Tu panel</Label>
            <h1 className="m-0 font-display font-extrabold text-[clamp(30px,3.4vw,42px)] tracking-[-0.03em]">Mis apps y ebooks</h1>
          </div>
          {mios.length === 0 ? (
            <p className="m-0 p-6 rounded-[10px] border border-dashed border-paper-line-2 text-text-muted leading-relaxed">
              Todavía no tenés productos activos. Si ya compraste y no aparece, esperá unos minutos o escribinos.
            </p>
          ) : (
            <div className="flex flex-wrap gap-5">
              {mios.map((p) => (
                <MiProducto key={p.slug} p={p} />
              ))}
            </div>
          )}
        </section>

        {otros.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="m-0 font-display font-bold text-2xl">Sumá más herramientas</h2>
            <div className="flex flex-wrap gap-5">
              {otros.map((p) => {
                const link = whatsappLink(`Hola, quiero ${vencidos.has(p.slug) ? 'renovar' : 'comprar'} ${p.nombre} de Vértice Lab.`);
                return (
                  <article key={p.slug} className="flex-[1_1_300px] min-w-0 bg-white border border-paper-line rounded-[10px] p-6 box-border flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      {vencidos.has(p.slug) ? 'Acceso vencido' : p.tipo === 'app' ? 'Micro app' : 'Ebook'}
                    </div>
                    <h3 className="m-0 font-display font-bold text-xl">{p.nombre}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-text-muted flex-grow">{p.descripcion}</p>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className={`${btn.gold} self-start min-h-[44px] px-5`}>
                        {vencidos.has(p.slug) ? 'Renovar' : 'Obtener acceso'}
                      </a>
                    ) : (
                      <Link to="/#catalogo" className={`${btn.gold} self-start min-h-[44px] px-5`}>Ver en la web</Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MiProducto({ p }: { p: Producto }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  if (p.tipo === 'app') {
    const disponible = Boolean(APPS[p.slug]);
    return (
      <article className="flex-[1_1_300px] min-w-0 bg-ink text-on-ink rounded-[10px] p-6 box-border flex flex-col gap-4">
        <span className="font-label text-[11px] tracking-[0.12em] text-gold">MICRO APP</span>
        <h3 className="m-0 font-display font-extrabold text-2xl">{p.nombre}</h3>
        <p className="m-0 text-[15px] leading-relaxed text-on-ink-muted flex-grow">{p.descripcion}</p>
        {disponible ? (
          <Link to={`/apps/${p.slug}`} className={`${btn.gold} self-start`}>
            Abrir <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="text-sm text-on-ink-muted">Disponible muy pronto</span>
        )}
      </article>
    );
  }

  const descargar = async () => {
    if (!p.archivo) return setError('El archivo todavía no está cargado.');
    setError('');
    setDescargando(true);
    const { data, error } = await supabase.storage.from('ebooks').createSignedUrl(p.archivo, 60, { download: true });
    setDescargando(false);
    if (error || !data) return setError('No pudimos generar la descarga. Probá de nuevo.');
    window.location.href = data.signedUrl;
  };

  return (
    <article className="flex-[1_1_300px] min-w-0 bg-white border border-paper-line rounded-[10px] p-6 box-border flex flex-col gap-4">
      {p.imagen ? (
        <img
          src={p.imagen}
          alt={`Portada de ${p.nombre}`}
          width={600}
          height={600}
          className="w-full max-w-[260px] aspect-square object-cover rounded-md border border-paper-line"
        />
      ) : (
        <div className="h-[120px] bg-ink rounded-md p-5 box-border flex flex-col justify-between" aria-hidden="true">
          <div className="w-7 h-1 bg-gold" />
          <span className="font-display font-extrabold text-xl text-on-ink leading-[1.05]">{p.nombre}</span>
        </div>
      )}
      <h3 className="m-0 font-display font-bold text-xl">{p.nombre}</h3>
      {error && <p role="alert" className="m-0 text-sm text-[#a3172f]">{error}</p>}
      <button type="button" onClick={descargar} disabled={descargando} className={`${btn.ink} self-start`}>
        {descargando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
        Descargar PDF
      </button>
    </article>
  );
}
