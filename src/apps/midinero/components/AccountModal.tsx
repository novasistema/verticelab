import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  Wallet, 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  Coins, 
  Check, 
  DollarSign, 
  Hash, 
  FileText 
} from 'lucide-react';
import { MoneyAccount, AccountType, UserSettings } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<MoneyAccount, 'id' | 'createdAt'> | MoneyAccount) => void;
  initialData?: MoneyAccount | null;
  settings: UserSettings;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: any; defaultColor: string; description: string }[] = [
  { 
    type: 'banco', 
    label: 'Cuenta Bancaria', 
    icon: Building, 
    defaultColor: '#ec4899',
    description: 'Caja de ahorro, cuenta corriente o nómina'
  },
  { 
    type: 'billetera', 
    label: 'Billetera Virtual', 
    icon: Wallet, 
    defaultColor: '#06b6d4',
    description: 'Mercado Pago, PayPal, Ualá, Revolut'
  },
  { 
    type: 'efectivo', 
    label: 'Billetera Efectivo', 
    icon: Banknote, 
    defaultColor: '#10b981',
    description: 'Billetes en mano, billetera física o alcancía'
  },
  { 
    type: 'cripto', 
    label: 'Cripto / Exchange', 
    icon: Coins, 
    defaultColor: '#f59e0b',
    description: 'Binance, Lemon, MetaMask, custodia USDT/BTC'
  },
  { 
    type: 'tarjeta_credito', 
    label: 'Tarjeta de Crédito', 
    icon: CreditCard, 
    defaultColor: '#8b5cf6',
    description: 'Límite disponible y consumos mensuales'
  },
  { 
    type: 'inversion', 
    label: 'Cuenta Broker / Inversión', 
    icon: TrendingUp, 
    defaultColor: '#3b82f6',
    description: 'Fondo de inversión, bonos, acciones'
  },
];

const PRESET_COLORS = [
  '#ec4899', '#06b6d4', '#10b981', '#3b82f6', 
  '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#64748b'
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  settings,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('banco');
  const [initialBalance, setInitialBalance] = useState<number | ''>(0);
  const [currentBalance, setCurrentBalance] = useState<number | ''>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#ec4899');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isExcludedFromTotal, setIsExcludedFromTotal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setInitialBalance(initialData.initialBalance);
      setCurrentBalance(initialData.currentBalance);
      setAccountNumber(initialData.accountNumber || '');
      setColor(initialData.color || '#ec4899');
      setCreditLimit(initialData.creditLimit !== undefined ? initialData.creditLimit : '');
      setNotes(initialData.notes || '');
      setIsExcludedFromTotal(!!initialData.isExcludedFromTotal);
    } else {
      setName('');
      setType('banco');
      setInitialBalance(0);
      setCurrentBalance(0);
      setAccountNumber('');
      setColor('#ec4899');
      setCreditLimit('');
      setNotes('');
      setIsExcludedFromTotal(false);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la cuenta o billetera.');
      return;
    }

    const initBal = typeof initialBalance === 'number' ? initialBalance : 0;
    const currBal = typeof currentBalance === 'number' ? currentBalance : initBal;

    const payload = {
      name: name.trim(),
      type,
      initialBalance: initBal,
      currentBalance: currBal,
      currency: settings.currency || 'ARS',
      accountNumber: accountNumber.trim() || undefined,
      color,
      notes: notes.trim() || undefined,
      isExcludedFromTotal,
      creditLimit: type === 'tarjeta_credito' && typeof creditLimit === 'number' ? creditLimit : undefined,
      ...(initialData ? { id: initialData.id, createdAt: initialData.createdAt } : {}),
    };

    onSave(payload as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'Editar Cuenta o Billetera' : 'Nueva Cuenta de Dinero'}
              </h2>
              <p className="text-xs text-slate-400">
                Registra bancos, efectivo o billeteras para controlar tus saldos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Account Type Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Cuenta / Billetera
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setType(item.type);
                      setColor(item.defaultColor);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div 
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shadow-sm"
                        style={{ backgroundColor: item.defaultColor }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Alias/Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre de la Cuenta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Banco Santander, Mercado Pago"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Dígitos o Alias (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. • 4120 o control.mp"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                Saldo Inicial ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setInitialBalance(val);
                  if (!initialData) {
                    setCurrentBalance(val);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Saldo con el que comienzas a registrar
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Saldo Actual ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Monto disponible en este momento
              </span>
            </div>
          </div>

          {/* If credit card: credit limit */}
          {type === 'tarjeta_credito' && (
            <div>
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                Límite de Crédito Total ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ej. 2500"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Color Identificativo
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre cierre, banco emisor, CBU..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
            />
          </div>

          {/* Exclude from total checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isExcludedFromTotal}
              onChange={(e) => setIsExcludedFromTotal(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-medium">
              Excluir del saldo total disponible (útil para cuentas bloqueadas o fondos congelados)
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-900/30 transition flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
