import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function LogoMark({ size = 30, dark = true }: { size?: number; dark?: boolean }) {
  const stroke = dark ? '#F2F3F5' : '#14171C';
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M3 26 L15 5 L27 26" fill="none" stroke={stroke} strokeWidth="2.6" />
      <path d="M9.5 26 L15 16 L20.5 26" fill="none" stroke={stroke} strokeWidth="2.6" opacity="0.45" />
      <circle cx="15" cy="5" r="3.4" fill="#E3A82B" />
    </svg>
  );
}

export function Logo({ to = '/', dark = true }: { to?: string; dark?: boolean }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 no-underline ${dark ? 'text-on-ink' : 'text-text'}`}
      aria-label="Vértice Lab, inicio"
    >
      <LogoMark dark={dark} />
      <span className="font-display text-[21px] font-extrabold tracking-[-0.02em]">
        Vértice
        <span className={`font-medium ${dark ? 'text-on-ink-muted' : 'text-text-muted'}`}> Lab</span>
      </span>
    </Link>
  );
}

export function Label({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <div
      className={`font-label text-[13px] tracking-[0.14em] uppercase ${onDark ? 'text-gold' : 'text-gold-dark'}`}
    >
      {children}
    </div>
  );
}

export function FullScreenMessage({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-on-ink font-body flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-md">
        <LogoMark size={44} />
        {title && <h1 className="font-display text-2xl font-extrabold tracking-tight m-0">{title}</h1>}
        {children}
      </div>
    </div>
  );
}

export function LoadingScreen({ text = 'Cargando…' }: { text?: string }) {
  return (
    <FullScreenMessage>
      <p className="flex items-center gap-2 text-on-ink-muted text-sm m-0" role="status">
        <Loader2 className="w-4 h-4 animate-spin text-gold" aria-hidden="true" />
        {text}
      </p>
    </FullScreenMessage>
  );
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-md min-h-[48px] px-6 no-underline transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0';

export const btn = {
  gold: `${base} bg-gold text-ink hover:bg-[#f0b844]`,
  ink: `${base} bg-ink text-on-ink hover:bg-[#1f2630]`,
  ghostDark: `${base} bg-transparent text-on-ink border-[1.5px] border-solid border-ink-line-2 hover:border-on-ink-muted`,
  ghostLight: `${base} bg-transparent text-text border-[1.5px] border-solid border-paper-line-2 hover:border-text-muted`,
};
