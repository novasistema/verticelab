import { Category } from '../types';
import { appStorage } from '../../../platform/cloudStore';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'comida',
    name: 'Comida',
    icon: 'UtensilsCrossed',
    color: '#10b981',
    defaultType: 'gasto',
    subcategories: [
      'Supermercado',
      'Restaurantes',
      'Delivery',
      'Cafetería / Desayunos',
      'Carnicería / Verdulería',
    ],
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: 'HeartPulse',
    color: '#ec4899',
    defaultType: 'gasto',
    subcategories: [
      'Farmacia',
      'Médico',
      'Dentista',
      'Seguro de Salud',
      'Laboratorio / Óptica',
    ],
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: 'Bus',
    color: '#3b82f6',
    defaultType: 'gasto',
    subcategories: [
      'Gasolina',
      'Público',
      'Mantenimiento / Taller',
      'Peajes y Parking',
      'Taxi / VTC',
    ],
  },
  {
    id: 'impuestos',
    name: 'Impuestos',
    icon: 'Receipt',
    color: '#ef4444',
    defaultType: 'gasto',
    subcategories: [
      'IRPF / Ganancias',
      'IVA',
      'Tasas Municipales',
      'Patente / Rodados',
      'Bienes Personales',
      'Impuestos Estatales',
    ],
  },
  {
    id: 'ocio',
    name: 'Ocio',
    icon: 'PartyPopper',
    color: '#f59e0b',
    defaultType: 'gasto',
    subcategories: [
      'Restaurantes y Bares',
      'Cine y Eventos',
      'Viajes y Salidas',
      'Streaming y Hobbies',
      'Gimnasio y Deportes',
    ],
  },
  {
    id: 'vivienda',
    name: 'Vivienda',
    icon: 'Home',
    color: '#8b5cf6',
    defaultType: 'gasto',
    subcategories: [
      'Alquiler / Hipoteca',
      'Luz / Electricidad',
      'Gas',
      'Agua',
      'Internet y Telefonía',
      'Mantenimiento Hogar',
    ],
  },
  {
    id: 'servicios',
    name: 'Servicios y Tecnología',
    icon: 'Zap',
    color: '#6366f1',
    defaultType: 'gasto',
    subcategories: [
      'Suscripciones',
      'Software',
      'Telefonía Celular',
      'Seguros',
    ],
  },
  {
    id: 'otros',
    name: 'Otros Gastos',
    icon: 'MoreHorizontal',
    color: '#64748b',
    defaultType: 'gasto',
    subcategories: [
      'Varios',
      'Imprevistos',
      'Donaciones y Regalos',
    ],
  },
  {
    id: 'salario',
    name: 'Salario e Ingresos',
    icon: 'Wallet',
    color: '#14b8a6',
    defaultType: 'ingreso',
    subcategories: [
      'Nómina Mensual',
      'Honorarios Freelance',
      'Aguinaldo / Bono',
      'Venta Ocasional',
    ],
  },
  {
    id: 'inversiones',
    name: 'Inversiones y Rendimientos',
    icon: 'TrendingUp',
    color: '#06b6d4',
    defaultType: 'ingreso',
    subcategories: [
      'Dividendos',
      'Intereses de Bonos',
      'Criptomonedas',
      'Rendimientos Fondos',
      'Ganancia de Capital',
    ],
  },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

const CATEGORIES_STORAGE_KEY = 'midinero_custom_categories_v2';

export const loadStoredCategories = (): Category[] => {
  try {
    const raw = appStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed: Category[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;

    // Merge any missing default categories or subcategories
    const merged = DEFAULT_CATEGORIES.map(def => {
      const existing = parsed.find(p => p.id === def.id || (def.id === 'comida' && p.id === 'supermercado') || (def.id === 'salud' && p.id === 'farmacia'));
      if (!existing) return def;

      // Combine subcategories uniquely
      const combinedSubcats = Array.from(new Set([...(existing.subcategories || []), ...(def.subcategories || [])]));
      return {
        ...def,
        ...existing,
        id: def.id, // normalize
        subcategories: combinedSubcats,
      };
    });

    // Add any custom categories created by user
    parsed.forEach(p => {
      if (p.isCustom && !merged.some(m => m.id === p.id)) {
        merged.push(p);
      }
    });

    return merged;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveStoredCategories = (categories: Category[]): void => {
  try {
    appStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories', err);
  }
};

export const getCategoryById = (id: string, customList?: Category[]): Category => {
  const list = customList && customList.length > 0 ? customList : DEFAULT_CATEGORIES;

  // Handle aliases for backward compatibility
  const normalizedId = id === 'supermercado' ? 'comida' : id === 'farmacia' ? 'salud' : id;

  const found = list.find(c => c.id === normalizedId || c.id === id);
  if (found) return found;

  // If not found in custom list, check defaults
  const fallback = DEFAULT_CATEGORIES.find(c => c.id === normalizedId || c.id === id);
  if (fallback) return fallback;

  return {
    id: id || 'otros',
    name: id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Otros',
    icon: 'MoreHorizontal',
    color: '#64748b',
    defaultType: 'gasto',
    subcategories: ['General', 'Varios'],
  };
};
