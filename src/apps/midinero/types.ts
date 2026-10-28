export type TransactionType = 'ingreso' | 'gasto';

export type CategoryId = 
  | 'comida'
  | 'supermercado'
  | 'salud'
  | 'farmacia'
  | 'impuestos'
  | 'ocio'
  | 'transporte'
  | 'vivienda'
  | 'salario'
  | 'inversiones'
  | 'servicios'
  | 'otros'
  | string;

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  defaultType: TransactionType;
  subcategories: string[];
  isCustom?: boolean;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  subcategory?: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  accountId?: string; // ID de la cuenta/billetera asociada (banco, efectivo, billetera virtual, etc.)
  tags?: string[];
  notes?: string;
  receiptUrl?: string;
}

export interface CategoryBudget {
  categoryId: CategoryId;
  limit: number;
}

export type InvestmentAssetType = 'crypto' | 'bono' | 'accion' | 'fondo' | 'metal' | 'otro';

export interface InvestmentDetails {
  assetType: InvestmentAssetType;
  ticker: string; // Ej: BTC, ETH, TLT, BND, US10Y, AL30, GD30, SPY, PAXG
  assetName: string; // Ej: Bitcoin, Bono del Tesoro EE.UU. (TLT)
  quantity: number; // Cantidad de monedas, títulos o acciones
  unitBuyPrice?: number; // Precio promedio de compra en USD/moneda base
  currentUnitPrice: number; // Precio unitario de cotización actual
  currency: string; // 'USD', etc.
  lastUpdated: string; // ISO string de última cotización
  change24hPercent?: number; // % cambio en últimas 24h
  sourceName: string; // 'Binance' | 'Coinbase' | 'Mercado Renta Fija' | 'Mercado de Valores' | 'Manual'
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: 'inversion' | 'emergencia' | 'meta_personal' | 'vacaciones' | 'otro';
  color: string;
  icon: string;
  notes?: string;
  isInvestment?: boolean;
  investmentDetails?: InvestmentDetails;
}

export type TransferSavingsType = 'between_goals' | 'to_main_account' | 'from_main_account';

export interface TransferSavingsPayload {
  type: TransferSavingsType;
  sourceGoalId?: string;
  targetGoalId?: string;
  amount: number;
  date: string;
  notes?: string;
  recordTransaction?: boolean;
}

export interface UserSettings {
  currency: string; // 'EUR', 'USD', 'MXN', 'PEN', 'ARS', etc.
  currencySymbol: string;
  theme: 'dark' | 'light';
  budgetAlertThreshold: number; // e.g., 85%
  enableAlerts: boolean;
  autoSyncEnabled: boolean;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  monthName: string;
  income: number;
  expense: number;
  realSavings: number;
  savingsRate: number;
}

// Cuentas de Dinero y Billeteras
export type AccountType = 
  | 'banco' 
  | 'billetera' 
  | 'efectivo' 
  | 'cripto' 
  | 'tarjeta_credito' 
  | 'inversion' 
  | 'otro';

export interface MoneyAccount {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  accountNumber?: string; // Ej: terminación '• 4821' o alias 'midinero.mp'
  color: string;
  icon?: string;
  notes?: string;
  isExcludedFromTotal?: boolean;
  creditLimit?: number; // Para tarjetas de crédito
  createdAt: string;
}

export interface AccountTransferPayload {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  date: string;
  notes?: string;
}

