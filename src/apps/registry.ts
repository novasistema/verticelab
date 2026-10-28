import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Lo que la plataforma le pasa a cada app al abrirla. */
export interface AppProps {
  userEmail: string;
  onLogout: () => void;
}

export interface AppDefinition {
  slug: string;
  nombre: string;
  /** Prefijo de las claves que la app usaba en el navegador, para ofrecer migrarlas a la nube. */
  prefijoLocal?: string;
  component: LazyExoticComponent<ComponentType<AppProps>>;
}

/**
 * Registro de micro apps. Para sumar una app nueva:
 * 1. Crear su carpeta en src/apps/<slug>/ con un App.tsx que reciba AppProps.
 * 2. Agregarla acá.
 * 3. Cargar el producto en la tabla "productos" de Supabase con el mismo slug.
 */
export const APPS: Record<string, AppDefinition> = {
  midinero: {
    slug: 'midinero',
    nombre: 'Mi Dinero',
    prefijoLocal: 'midinero_',
    component: lazy(() => import('./midinero/App')),
  },
};
