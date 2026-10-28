import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Plus, LayoutGrid, BookOpen, ArrowUpRight, ShieldCheck, Gem } from 'lucide-react';
import { Logo, Label, btn } from '../platform/ui';
import { BRAND, whatsappLink } from '../platform/config';
import { useAuth } from '../platform/auth';
import {
  cargarProductos,
  cargarMisAccesos,
  formatearPrecio,
  supabase,
  isSupabaseConfigured,
  type Producto,
} from '../platform/supabase';

const container = 'max-w-[1200px] mx-auto px-6 box-border';
const h2 = 'm-0 font-display font-extrabold text-[clamp(32px,3.6vw,46px)] leading-[1.08] tracking-[-0.03em]';

function CheckItem({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <li className="flex gap-3 items-start">
      <Check
        className={`w-[18px] h-[18px] shrink-0 mt-[3px] ${onDark ? 'text-gold' : 'text-gold-dark'}`}
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

export default function Landing() {
  const { session } = useAuth();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [mios, setMios] = useState<Set<string>>(new Set());

  const location = useLocation();

  useEffect(() => {
    cargarProductos().then(setProductos);
  }, []);

  // Al llegar con un ancla (por ejemplo /#catalogo), ir a esa sección
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView();
  }, [location.hash, productos]);

  useEffect(() => {
    if (!session) {
      setMios(new Set());
      return;
    }
    cargarMisAccesos()
      .then((r) => setMios(r.vigentes))
      .catch(() => setMios(new Set()));
  }, [session]);

  const apps = (productos ?? []).filter((p) => p.tipo === 'app');
  const ebooks = (productos ?? []).filter((p) => p.tipo === 'ebook');

  return (
    <div className="font-body text-text bg-paper min-h-screen">
      {/* ================= HERO ================= */}
      <header className="bg-ink text-on-ink">
        <div className={container}>
          <nav
            className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-ink-line"
            aria-label="Principal"
          >
            <Logo />
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[15px]">
              <a href="#micro-apps" className="text-on-ink-2 no-underline hover:text-on-ink">Micro apps</a>
              <a href="#ebooks" className="text-on-ink-2 no-underline hover:text-on-ink">Ebooks</a>
              <a href="#como-funciona" className="text-on-ink-2 no-underline hover:text-on-ink">Cómo funciona</a>
              <a href="#preguntas" className="text-on-ink-2 no-underline hover:text-on-ink">Preguntas</a>
              {session ? (
                <Link to="/mis-apps" className={`${btn.gold} min-h-[44px] px-5`}>Mis apps</Link>
              ) : (
                <Link to="/ingresar" className={`${btn.ghostDark} min-h-[44px] px-5`}>Ingresar</Link>
              )}
            </div>
          </nav>

          <div className="flex flex-wrap items-center gap-14 pt-[88px] pb-[104px]">
            <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-7">
              <Label onDark>Laboratorio de soluciones digitales</Label>
              <h1 className="m-0 font-display font-extrabold text-[clamp(42px,5.6vw,74px)] leading-[1.02] tracking-[-0.035em]">
                Herramientas que resuelven. Conocimiento que se aplica.
              </h1>
              <p className="m-0 text-[19px] leading-relaxed text-on-ink-muted max-w-[540px]">
                Micro apps listas para usar y ebooks prácticos, creados para resolver los problemas
                reales del día a día. Comprás, recibís el acceso al instante y empezás hoy mismo.
              </p>
              <div className="flex flex-wrap gap-3.5 pt-1">
                <a href="#catalogo" className={`${btn.gold} min-h-[52px] px-7 text-base`}>Explorar micro apps</a>
                <a href="#ebooks" className={`${btn.ghostDark} min-h-[52px] px-7 text-base`}>Ver ebooks</a>
              </div>
              <ul className="list-none m-0 p-0 flex flex-wrap gap-6 pt-3 text-sm text-on-ink-2">
                <CheckItem onDark>Acceso inmediato</CheckItem>
                <CheckItem onDark>Pago seguro con Mercado Pago</CheckItem>
                <CheckItem onDark>Tus datos en la nube</CheckItem>
              </ul>
            </div>

            {/* Composición ilustrativa */}
            <div className="flex-[1_1_420px] min-w-0 relative h-[520px] max-sm:h-auto max-w-[560px]" aria-hidden="true">
              <div className="absolute max-sm:relative top-0 left-0 w-[80%] max-sm:w-full bg-ink-2 border border-ink-line rounded-xl p-6 box-border flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="font-label text-[11px] tracking-[0.12em] text-on-ink-muted">MICRO APP</span>
                  <span className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ink-line-2" />
                    <span className="w-2 h-2 rounded-full bg-ink-line-2" />
                    <span className="w-2 h-2 rounded-full bg-gold" />
                  </span>
                </div>
                <div className="font-display font-bold text-[22px]">Mi Dinero</div>
                <div className="flex flex-col gap-2.5 text-sm">
                  {[
                    ['Ingresos del mes', '$ 820.000'],
                    ['Gastos del mes', '$ 571.500'],
                    ['Meta de ahorro', '64 %'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-3.5 py-3 bg-ink rounded-md">
                      <span className="text-on-ink-2">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end border-t border-ink-line pt-4">
                  <span className="text-on-ink-muted text-sm">Disponible</span>
                  <span className="font-display font-extrabold text-[clamp(24px,6vw,30px)] tracking-[-0.02em] whitespace-nowrap">$ 248.500</span>
                </div>
                <div className="bg-gold text-ink font-semibold text-sm text-center p-3 rounded-md">Registrar gasto</div>
              </div>
              <div className="absolute max-sm:hidden bottom-0 right-0 w-[44%] aspect-[3/4] bg-paper text-text rounded-md px-5 py-[22px] box-border flex flex-col justify-between rotate-[4deg] shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
                <div className="flex flex-col gap-2.5">
                  <div className="w-8 h-1 bg-gold" />
                  <span className="font-label text-[10px] tracking-[0.12em] text-text-muted">EBOOK</span>
                </div>
                <div className="font-display font-extrabold text-[clamp(18px,2vw,24px)] leading-[1.05] tracking-[-0.02em]">
                  Guías prácticas que se aplican
                </div>
                <span className="text-[11px] text-text-muted">Vértice Lab</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ================= DOS CAMINOS ================= */}
        <section className={`${container} pt-[104px] pb-10`}>
          <div className="flex flex-col gap-4 max-w-[720px] mb-12">
            <Label>Qué ofrecemos</Label>
            <h2 className={h2}>Dos caminos, un mismo objetivo: que lo resuelvas.</h2>
          </div>
          <div className="flex flex-wrap gap-6">
            <article
              id="micro-apps"
              className="flex-[1_1_420px] min-w-0 bg-ink text-on-ink rounded-xl p-11 box-border flex flex-col gap-5 scroll-mt-6"
            >
              <LayoutGrid className="w-10 h-10 text-gold" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="m-0 font-display font-extrabold text-[32px] tracking-[-0.02em]">Micro apps</h3>
              <p className="m-0 text-[17px] leading-relaxed text-on-ink-muted">
                Herramientas digitales que hacen una cosa y la hacen bien. Sin instalaciones ni curva de
                aprendizaje: abrís, cargás tus datos y listo.
              </p>
              <ul className="list-none m-0 p-0 flex flex-col gap-3 text-base py-2">
                <CheckItem onDark>Funcionan en el celular y en la computadora</CheckItem>
                <CheckItem onDark>Entrás con tu usuario desde cualquier lugar</CheckItem>
                <CheckItem onDark>Tus datos se guardan solos en la nube</CheckItem>
              </ul>
              <a href="#catalogo" className={`${btn.gold} self-start`}>Ver micro apps</a>
            </article>
            <article
              id="ebooks"
              className="flex-[1_1_420px] min-w-0 bg-white border border-paper-line rounded-xl p-11 box-border flex flex-col gap-5 scroll-mt-6"
            >
              <BookOpen className="w-10 h-10 text-text" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="m-0 font-display font-extrabold text-[32px] tracking-[-0.02em]">Ebooks</h3>
              <p className="m-0 text-[17px] leading-relaxed text-text-muted">
                Guías prácticas, directas y aplicables. Nada de relleno: cada capítulo termina en algo
                concreto que podés hacer hoy.
              </p>
              <ul className="list-none m-0 p-0 flex flex-col gap-3 text-base py-2">
                <CheckItem>Descarga inmediata en PDF</CheckItem>
                <CheckItem>Ejemplos reales y plantillas listas para usar</CheckItem>
                <CheckItem>Leelos en cualquier dispositivo</CheckItem>
              </ul>
              <a href="#catalogo" className={`${btn.ink} self-start`}>Ver ebooks</a>
            </article>
          </div>
        </section>

        {/* ================= CATÁLOGO ================= */}
        <section id="catalogo" className={`${container} py-20 scroll-mt-6`}>
          <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
            <div className="flex flex-col gap-4 max-w-[640px]">
              <Label>Catálogo</Label>
              <h2 className={h2}>Elegí por dónde empezar.</h2>
            </div>
            <p className="m-0 text-base text-text-muted max-w-[380px] leading-relaxed">
              Cada producto resuelve un problema puntual. Si no sabés cuál elegir, escribinos y te
              orientamos.
            </p>
          </div>

          <h3 className="font-display font-bold text-xl mt-0 mb-5">Micro apps</h3>
          <div className="flex flex-wrap gap-5 mb-14">
            {productos === null && <CatalogSkeleton />}
            {productos !== null && apps.length === 0 && (
              <EmptyCard text="Muy pronto, las primeras micro apps." />
            )}
            {apps.map((p) => (
              <ProductCard key={p.slug} p={p} owned={mios.has(p.slug)} />
            ))}
          </div>

          <h3 className="font-display font-bold text-xl mt-0 mb-5">Ebooks</h3>
          <div className="flex flex-wrap gap-5">
            {productos === null && <CatalogSkeleton />}
            {productos !== null && ebooks.length === 0 && (
              <EmptyCard text="Los primeros ebooks están en camino. Anotate abajo y te avisamos apenas salgan." />
            )}
            {ebooks.map((p) => (
              <ProductCard key={p.slug} p={p} owned={mios.has(p.slug)} />
            ))}
          </div>
        </section>

        {/* ================= CÓMO FUNCIONA ================= */}
        <section id="como-funciona" className="border-y border-paper-line bg-white scroll-mt-6">
          <div className={`${container} py-[88px]`}>
            <div className="flex flex-col gap-4 mb-12">
              <Label>Cómo funciona</Label>
              <h2 className={h2}>De la compra al uso, en minutos.</h2>
            </div>
            <ol className="list-none m-0 p-0 flex flex-wrap gap-10">
              {[
                ['01', 'Elegís', 'Encontrá la herramienta o la guía que resuelve lo que necesitás hoy.'],
                ['02', 'Pagás seguro', 'Con tarjeta de crédito, débito o dinero en cuenta, a través de Mercado Pago.'],
                ['03', 'Recibís el acceso', 'Te llega un email con tu usuario para entrar. Sin esperas.'],
              ].map(([n, t, d], i) => (
                <li
                  key={n}
                  className={`flex-[1_1_280px] min-w-0 flex flex-col gap-3.5 border-t-[3px] pt-6 ${i === 2 ? 'border-gold' : 'border-ink'}`}
                >
                  <span className="font-label text-sm text-gold-dark">{n}</span>
                  <h3 className="m-0 font-display font-bold text-2xl">{t}</h3>
                  <p className="m-0 text-base leading-relaxed text-text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ================= POR QUÉ ================= */}
        <section className="bg-ink text-on-ink">
          <div className={`${container} py-[104px] flex flex-wrap gap-14 items-start`}>
            <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-6">
              <Label onDark>Por qué Vértice Lab</Label>
              <h2 className={h2}>Hecho por alguien que vive los mismos problemas que vos.</h2>
              <p className="m-0 text-lg leading-relaxed text-on-ink-muted">
                Vértice Lab nace de gestionar un negocio real todos los días. Cada herramienta y cada guía
                sale de un problema concreto que tuvimos que resolver, y la probamos antes de que llegue a
                tus manos.
              </p>
            </div>
            <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-4">
              {[
                [ArrowUpRight, 'Práctico', 'Pensado para usarse en el momento, no para quedar en una carpeta.'],
                [ShieldCheck, 'Probado', 'Cada producto funciona en un negocio real antes de salir a la venta.'],
                [Gem, `Garantía de ${BRAND.garantiaDias} días`, 'Si no te sirve, te devolvemos el dinero. Sin vueltas.'],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Gem;
                return (
                  <div key={t as string} className="flex gap-5 p-6 bg-ink-2 border border-ink-line rounded-[10px]">
                    <I className="w-6 h-6 text-gold shrink-0" aria-hidden="true" />
                    <div className="flex flex-col gap-1.5">
                      <span className="font-display font-bold text-xl">{t as string}</span>
                      <span className="text-[15px] leading-relaxed text-on-ink-muted">{d as string}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= SUSCRIPCIÓN ================= */}
        <section className={`${container} pt-24 pb-10`}>
          <Suscripcion />
        </section>

        {/* ================= PREGUNTAS ================= */}
        <section id="preguntas" className="max-w-[880px] mx-auto px-6 pt-20 pb-[104px] box-border scroll-mt-6">
          <div className="flex flex-col gap-4 mb-10">
            <Label>Preguntas frecuentes</Label>
            <h2 className={h2}>Lo que nos suelen preguntar.</h2>
          </div>
          <div className="border-t border-paper-line-2">
            {[
              ['¿Cómo recibo lo que compré?', 'Apenas se aprueba el pago te llega un email con tu usuario para entrar a tu panel. Desde ahí abrís tus micro apps y descargás tus ebooks.'],
              ['¿Qué medios de pago aceptan?', 'Tarjeta de crédito, débito y dinero en cuenta de Mercado Pago.'],
              ['¿Las micro apps funcionan en el celular?', 'Sí. Funcionan desde el navegador del celular, la tablet o la computadora, sin instalar nada. Tus datos se guardan en la nube y los ves en todos tus dispositivos.'],
              ['¿Mis datos son privados?', 'Sí. Cada cuenta ve solamente sus propios datos. Nadie más puede acceder a ellos.'],
              ['¿Y si no me sirve?', `Tenés ${BRAND.garantiaDias} días de garantía. Si el producto no es lo que esperabas, escribinos y te devolvemos el dinero.`],
            ].map(([q, a]) => (
              <details key={q} className="border-b border-paper-line-2 py-[22px] group">
                <summary className="font-display font-bold text-[19px] flex justify-between gap-4 min-h-7">
                  {q}
                  <Plus className="w-5 h-5 text-gold-dark shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="mt-3.5 mb-0 text-base leading-relaxed text-text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="flex-[1_1_300px] min-w-0 h-[220px] rounded-[10px] bg-white border border-paper-line animate-pulse" />
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="flex-[1_1_300px] min-w-0 rounded-[10px] border border-dashed border-paper-line-2 p-7 text-text-muted text-[15px] leading-relaxed">
      {text}
    </div>
  );
}

function ProductCard({ p, owned }: { p: Producto; owned: boolean }) {
  const consulta = whatsappLink(`Hola, quiero comprar ${p.nombre} de Vértice Lab.`);
  return (
    <article className="flex-[1_1_300px] max-w-full min-w-0 bg-white border border-paper-line rounded-[10px] p-7 box-border flex flex-col gap-3.5">
      {p.tipo === 'ebook' ? (
        <div className="h-[150px] bg-ink rounded-md p-5 box-border flex flex-col justify-between" aria-hidden="true">
          <div className="w-7 h-1 bg-gold" />
          <span className="font-display font-extrabold text-[22px] text-on-ink leading-[1.05]">{p.nombre}</span>
        </div>
      ) : (
        <span className="self-start font-label text-[11px] tracking-[0.12em] bg-ink text-on-ink px-2.5 py-[5px] rounded">
          MICRO APP
        </span>
      )}
      <h4 className="m-0 font-display font-bold text-2xl tracking-[-0.01em]">{p.nombre}</h4>
      <p className="m-0 text-[15px] leading-relaxed text-text-muted flex-grow">{p.descripcion}</p>
      <div className="flex justify-between items-center border-t border-paper-line pt-4 gap-3 flex-wrap">
        <span className="font-display font-extrabold text-[22px]">{formatearPrecio(p)}</span>
        {owned ? (
          <Link to={p.tipo === 'app' ? `/apps/${p.slug}` : '/mis-apps'} className={`${btn.ink} min-h-[44px] px-[18px] text-[15px]`}>
            {p.tipo === 'app' ? 'Abrir' : 'Descargar'}
          </Link>
        ) : consulta ? (
          <a href={consulta} target="_blank" rel="noopener noreferrer" className={`${btn.gold} min-h-[44px] px-[18px] text-[15px]`}>
            Quiero acceso
          </a>
        ) : (
          <span className="text-sm font-semibold text-gold-dark">Muy pronto</span>
        )}
      </div>
    </article>
  );
}

function Suscripcion() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return setEstado('error');
    setEstado('enviando');
    const { error } = await supabase.from('suscriptores').insert({ email: email.trim().toLowerCase() });
    // 23505 = ya estaba anotado: lo tomamos como éxito
    setEstado(!error || error.code === '23505' ? 'ok' : 'error');
  };

  return (
    <div className="bg-gold text-ink rounded-[14px] px-12 py-14 max-sm:px-6 max-sm:py-10 box-border flex flex-wrap gap-10 items-center justify-between">
      <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-3.5">
        <div className="font-label text-[13px] tracking-[0.14em] uppercase">Novedades</div>
        <h2 className="m-0 font-display font-extrabold text-[clamp(28px,3vw,40px)] leading-[1.1] tracking-[-0.03em]">
          Enterate primero de cada lanzamiento
        </h2>
        <p className="m-0 text-[17px] leading-relaxed">
          Nuevas micro apps, ebooks y precios de lanzamiento. Sin spam, te das de baja cuando quieras.
        </p>
      </div>
      {estado === 'ok' ? (
        <p className="flex-[1_1_360px] m-0 text-lg font-semibold" role="status">
          ¡Listo! Te vamos a avisar a {email}.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex-[1_1_360px] min-w-0 flex flex-col gap-2.5">
          <label htmlFor="lead-email" className="font-semibold text-[15px]">Tu email</label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="lead-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@email.com"
              className="flex-[1_1_220px] min-w-0 min-h-[52px] px-4 border-2 border-ink rounded-md bg-white text-base text-text box-border font-body"
            />
            <button type="submit" disabled={estado === 'enviando'} className={`${btn.ink} min-h-[52px]`}>
              {estado === 'enviando' ? 'Enviando…' : 'Avisarme'}
            </button>
          </div>
          {estado === 'error' && (
            <p className="m-0 text-sm font-semibold" role="alert">
              No pudimos anotarte. Revisá el email y probá de nuevo.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-on-ink-muted">
      <div className={`${container} pt-14 pb-10 flex flex-col gap-10`}>
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex flex-col gap-3.5 max-w-[340px]">
            <Logo />
            <p className="m-0 text-[15px] leading-relaxed">{BRAND.lema}</p>
          </div>
          <div className="flex flex-wrap gap-14 text-[15px]">
            <div className="flex flex-col gap-3">
              <span className="font-label text-xs tracking-[0.12em] text-on-ink">PRODUCTOS</span>
              <a href="#micro-apps" className="text-on-ink-muted no-underline hover:text-on-ink">Micro apps</a>
              <a href="#ebooks" className="text-on-ink-muted no-underline hover:text-on-ink">Ebooks</a>
              <Link to="/mis-apps" className="text-on-ink-muted no-underline hover:text-on-ink">Mis apps</Link>
            </div>
            {(BRAND.whatsapp || BRAND.email || BRAND.instagram) && (
              <div className="flex flex-col gap-3">
                <span className="font-label text-xs tracking-[0.12em] text-on-ink">CONTACTO</span>
                {BRAND.whatsapp && (
                  <a href={`https://wa.me/${BRAND.whatsapp}`} className="text-on-ink-muted no-underline hover:text-on-ink">WhatsApp</a>
                )}
                {BRAND.email && (
                  <a href={`mailto:${BRAND.email}`} className="text-on-ink-muted no-underline hover:text-on-ink">{BRAND.email}</a>
                )}
                {BRAND.instagram && (
                  <a href={`https://instagram.com/${BRAND.instagram.replace('@', '')}`} className="text-on-ink-muted no-underline hover:text-on-ink">{BRAND.instagram}</a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-ink-line pt-6 text-[13px]">
          © {new Date().getFullYear()} Vértice Lab. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
