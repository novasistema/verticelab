import React from 'react';

export interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'auto' | 'light' | 'dark' | 'image-only' | 'full-banner';
}

export const ControlLogo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'auto',
}) => {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7',
      title: 'text-base tracking-wide',
      subtitle: 'text-[8px]',
      gap: 'gap-2',
    },
    md: {
      box: 'w-9 h-9',
      title: 'text-xl tracking-wider',
      subtitle: 'text-[9px]',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'w-12 h-12',
      title: 'text-2xl tracking-widest',
      subtitle: 'text-[11px]',
      gap: 'gap-3',
    },
    xl: {
      box: 'w-16 h-16',
      title: 'text-3xl tracking-widest',
      subtitle: 'text-xs',
      gap: 'gap-3.5',
    },
  };

  const currentSize = sizeMap[size];

  // If full banner is requested, display the complete original logo banner
  if (variant === 'full-banner') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img
          src="/assets/aistudio/logo_control_0bd5bb22.jpg"
          alt="CONTROL - Finanzas Personales"
          className="rounded-2xl shadow-xl border border-teal-500/20 max-w-full object-contain"
        />
      </div>
    );
  }

  // Text color based on theme
  const textColorClass =
    variant === 'light'
      ? 'text-slate-900'
      : variant === 'dark'
      ? 'text-white'
      : 'text-slate-900 dark:text-white';

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* Circular Emblem extracted from the high-res logo */}
      <div
        className={`${currentSize.box} relative rounded-xl overflow-hidden shadow-md shadow-teal-950/40 border border-teal-500/30 bg-slate-900 shrink-0 group transition-transform hover:scale-105`}
      >
        <img
          src="/assets/aistudio/logo_control_0bd5bb22.jpg"
          alt="CONTROL"
          className="w-full h-full object-cover object-[center_36%] scale-[1.38]"
          loading="eager"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
      </div>

      {showText && variant !== 'image-only' && (
        <div className="flex flex-col leading-none select-none">
          <div className={`font-black ${currentSize.title} flex items-center`}>
            <span className="text-teal-400">CON</span>
            <span className={textColorClass}>TROL</span>
          </div>
          <span
            className={`font-bold uppercase tracking-wider text-teal-400/90 ${currentSize.subtitle} mt-0.5`}
          >
            Finanzas Personales
          </span>
        </div>
      )}
    </div>
  );
};

// Backwards compatibility alias
export const MiDineroLogo = ControlLogo;
export default ControlLogo;
