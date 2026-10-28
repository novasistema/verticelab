import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../platform/supabase';
import { useAuth } from '../platform/auth';
import { Logo, btn } from '../platform/ui';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-on-ink font-body flex flex-col">
      <div className="px-6 py-6 max-w-[1200px] w-full mx-auto box-border">
        <Logo />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px] bg-ink-2 border border-ink-line rounded-xl p-8 max-sm:p-6 box-border flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-display font-extrabold text-[28px] tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="m-0 text-on-ink-muted text-[15px] leading-relaxed">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function Field({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  autoComplete,
  trailing,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-on-ink-2">{label}</label>
      <div className="flex items-center gap-2 min-h-[50px] px-3.5 bg-ink border border-ink-line-2 rounded-md focus-within:border-gold">
        <Icon className="w-4 h-4 text-on-ink-muted shrink-0" aria-hidden="true" />
        <input
          id={id}
          type={type}
          required
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-on-ink text-base font-body py-3"
        />
        {trailing}
      </div>
    </div>
  );
}

export function Notice({ kind, children }: { kind: 'error' | 'ok'; children: React.ReactNode }) {
  const Icon = kind === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex gap-2.5 items-start rounded-md px-3.5 py-3 text-sm leading-relaxed border ${
        kind === 'error'
          ? 'bg-[#2a1318] border-[#7a2a36] text-[#ffd5db]'
          : 'bg-[#11261d] border-[#2a6b4f] text-[#c9f2dd]'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { from?: string } | null)?.from || '/mis-apps';

  const [modo, setModo] = useState<'login' | 'olvido'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  if (session) return <Navigate to={destino} replace />;

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setCargando(false);
      setError(
        error.message.toLowerCase().includes('invalid')
          ? 'Email o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
      );
      return;
    }
    // Una sola sesión por cuenta: cerramos las de otros dispositivos.
    await supabase.auth.signOut({ scope: 'others' }).catch(() => undefined);
    navigate(destino, { replace: true });
  };

  const recuperar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setCargando(false);
    if (error) {
      setError('No pudimos enviar el email. Revisá la dirección y probá de nuevo.');
      return;
    }
    setOk('Si el email está registrado, te llega un link para crear una contraseña nueva. Revisá también la carpeta de spam.');
  };

  if (modo === 'olvido') {
    return (
      <AuthShell title="Recuperar contraseña" subtitle="Te mandamos un link para crear una nueva.">
        <form onSubmit={recuperar} className="flex flex-col gap-5">
          {error && <Notice kind="error">{error}</Notice>}
          {ok ? (
            <Notice kind="ok">{ok}</Notice>
          ) : (
            <>
              <Field id="email" label="Email" icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="email" />
              <button type="submit" disabled={cargando} className={btn.gold}>
                {cargando ? 'Enviando…' : 'Enviar link'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setModo('login');
              setOk('');
              setError('');
            }}
            className="bg-transparent border-0 text-gold text-sm font-semibold cursor-pointer self-center min-h-[44px]"
          >
            Volver a ingresar
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Ingresar" subtitle="Entrá con el email y la contraseña que recibiste al comprar.">
      <form onSubmit={ingresar} className="flex flex-col gap-5">
        {!isSupabaseConfigured && (
          <Notice kind="error">Falta configurar Supabase en las variables de entorno.</Notice>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <Field id="email" label="Email" icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          id="password"
          label="Contraseña"
          icon={Lock}
          type={ver ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="bg-transparent border-0 text-on-ink-muted cursor-pointer p-2 -mr-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <button type="submit" disabled={cargando || !isSupabaseConfigured} className={btn.gold}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setModo('olvido');
            setError('');
          }}
          className="bg-transparent border-0 text-gold text-sm font-semibold cursor-pointer self-center min-h-[44px]"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </AuthShell>
  );
}
