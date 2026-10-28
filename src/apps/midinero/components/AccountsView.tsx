import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Wallet, 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  Coins, 
  Plus, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Eye,
  Sliders,
  Receipt
} from 'lucide-react';
import { MoneyAccount, AccountType, Transaction, UserSettings } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AccountsViewProps {
  accounts: MoneyAccount[];
  transactions: Transaction[];
  settings: UserSettings;
  onAddAccount: () => void;
  onEditAccount: (account: MoneyAccount) => void;
  onDeleteAccount: (id: string) => void;
  onOpenTransferModal: (initialSourceId?: string) => void;
  onQuickAddTransactionForAccount?: (accountId: string, type: 'ingreso' | 'gasto') => void;
}

const TYPE_FILTERS: { id: AccountType | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'Todas las Cuentas', icon: Wallet },
  { id: 'banco', label: 'Bancos', icon: Building },
  { id: 'billetera', label: 'Billeteras Virtuales', icon: Wallet },
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'cripto', label: 'Cripto', icon: Coins },
  { id: 'tarjeta_credito', label: 'Tarjetas', icon: CreditCard },
];

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  settings,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenTransferModal,
  onQuickAddTransactionForAccount,
}) => {
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [selectedAccountForTxs, setSelectedAccountForTxs] = useState<string | null>(null);

  // Current Month calculations
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Account stats & calculations
  const {
    totalLiquidFunds,
    totalBankFunds,
    totalWalletFunds,
    totalCashFunds,
    totalCryptoFunds,
    totalCreditDebt,
    monthlyIncomes,
    monthlyExpenses,
    remainingBudget,
    percentSpent,
  } = useMemo(() => {
    let liquid = 0;
    let bank = 0;
    let wallet = 0;
    let cash = 0;
    let crypto = 0;
    let creditDebt = 0;

    accounts.forEach((acc) => {
      if (acc.isExcludedFromTotal) return;

      if (acc.type === 'banco') {
        bank += acc.currentBalance;
        liquid += acc.currentBalance;
      } else if (acc.type === 'billetera') {
        wallet += acc.currentBalance;
        liquid += acc.currentBalance;
      } else if (acc.type === 'efectivo') {
        cash += acc.currentBalance;
        liquid += acc.currentBalance;
      } else if (acc.type === 'cripto') {
        crypto += acc.currentBalance;
        liquid += acc.currentBalance;
      } else if (acc.type === 'tarjeta_credito') {
        // Tarjeta saldo suele ser negativo o consumo
        if (acc.currentBalance < 0) {
          creditDebt += Math.abs(acc.currentBalance);
        }
      } else if (acc.type === 'inversion') {
        liquid += acc.currentBalance;
      }
    });

    // Monthly incomes & expenses from all transactions
    const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));
    const mIncomes = monthTxs
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    const mExpenses = monthTxs
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = mIncomes - mExpenses;
    const spentPct = mIncomes > 0 ? Math.min(100, Math.round((mExpenses / mIncomes) * 100)) : 0;

    return {
      totalLiquidFunds: liquid,
      totalBankFunds: bank,
      totalWalletFunds: wallet,
      totalCashFunds: cash,
      totalCryptoFunds: crypto,
      totalCreditDebt: creditDebt,
      monthlyIncomes: mIncomes,
      monthlyExpenses: mExpenses,
      remainingBudget: remaining,
      percentSpent: spentPct,
    };
  }, [accounts, transactions, currentMonthPrefix]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    if (selectedType === 'all') return accounts;
    return accounts.filter((a) => a.type === selectedType);
  }, [accounts, selectedType]);

  // Per-account transaction metrics
  const getAccountMetrics = (accountId: string, initialBal: number) => {
    const accountTxs = transactions.filter((t) => t.accountId === accountId);
    const accountIncomes = accountTxs
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    const accountExpenses = accountTxs
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      txCount: accountTxs.length,
      incomes: accountIncomes,
      expenses: accountExpenses,
      recentTxs: accountTxs.slice(0, 3),
    };
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'banco':
        return Building;
      case 'billetera':
        return Wallet;
      case 'efectivo':
        return Banknote;
      case 'cripto':
        return Coins;
      case 'tarjeta_credito':
        return CreditCard;
      case 'inversion':
        return TrendingUp;
      default:
        return Wallet;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'banco':
        return 'Banco';
      case 'billetera':
        return 'Billetera Virtual';
      case 'efectivo':
        return 'Efectivo';
      case 'cripto':
        return 'Cripto';
      case 'tarjeta_credito':
        return 'Tarjeta Crédito';
      case 'inversion':
        return 'Inversión';
      default:
        return 'Cuenta';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/30">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Cuentas y Billeteras</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Saldos en Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Controla cuánto dinero tienes en bancos, billeteras y efectivo, y cuánto te va quedando
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenTransferModal()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            title="Transferir saldo entre cuentas"
          >
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span>Transferir</span>
          </button>

          <button
            onClick={onAddAccount}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-teal-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta / Billetera</span>
          </button>
        </div>
      </div>

      {/* Control de Gastos & "Cuánto te va quedando" Widget */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Net Total */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Dinero Total Disponible (Patrimonio Líquido)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatCurrency(totalLiquidFunds, settings.currencySymbol)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                repartido en {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
              </span>
            </div>
          </div>

          {/* "Cuánto le va quedando" Progress & Analysis */}
          <div className="flex-1 max-w-xl bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">
                  Flujo del Mes Actual
                </span>
              </div>
              <span className={`text-xs font-extrabold ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {remainingBudget >= 0 ? 'Te quedan: +' : 'Déficit: '}
                {formatCurrency(remainingBudget, settings.currencySymbol)}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${percentSpent}%` }}
                title={`Gastos: ${percentSpent}%`}
              />
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${100 - percentSpent}%` }}
                title={`Disponible: ${100 - percentSpent}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Ingresos: {formatCurrency(monthlyIncomes, settings.currencySymbol)}
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Gastos: {formatCurrency(monthlyExpenses, settings.currencySymbol)} ({percentSpent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Distribution Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Bancos */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">En Bancos</span>
            <Building className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-pink-300 mt-1">
            {formatCurrency(totalBankFunds, settings.currencySymbol)}
          </p>
          <span className="text-[11px] text-slate-500">Cajas de ahorro y cuentas</span>
        </div>

        {/* Billeteras Virtuales */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Billeteras Virtuales</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-300 mt-1">
            {formatCurrency(totalWalletFunds, settings.currencySymbol)}
          </p>
          <span className="text-[11px] text-slate-500">Mercado Pago, PayPal, etc.</span>
        </div>

        {/* Efectivo */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Efectivo en Mano</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
            {formatCurrency(totalCashFunds, settings.currencySymbol)}
          </p>
          <span className="text-[11px] text-slate-500">Billetes físicos disponibles</span>
        </div>

        {/* Tarjetas / Consumos */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Consumos Tarjetas</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-300 mt-1">
            {formatCurrency(totalCreditDebt, settings.currencySymbol)}
          </p>
          <span className="text-[11px] text-slate-500">Pendiente de pago</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_FILTERS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accounts List Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            No hay cuentas de este tipo registradas
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Agrega tus bancos, billeteras de Mercado Pago, PayPal o billetera de efectivo para llevar el control.
          </p>
          <button
            onClick={onAddAccount}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Cuenta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const Icon = getAccountTypeIcon(account.type);
            const metrics = getAccountMetrics(account.id, account.initialBalance);

            return (
              <div
                key={account.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden group"
              >
                {/* Decorative Top Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: account.color || '#06b6d4' }}
                />

                <div>
                  {/* Account Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                        style={{ backgroundColor: account.color || '#06b6d4' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {getAccountTypeLabel(account.type)}
                          </span>
                          {account.accountNumber && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {account.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Excluded Badge */}
                    {account.isExcludedFromTotal && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Excluida
                      </span>
                    )}
                  </div>

                  {/* Balance Display */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                      <span>Saldo Disponible Actual</span>
                      {account.type === 'tarjeta_credito' && account.creditLimit && (
                        <span>Límite: {formatCurrency(account.creditLimit, settings.currencySymbol)}</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-2xl font-black font-mono tracking-tight ${
                        account.currentBalance >= 0 ? 'text-white' : 'text-rose-400'
                      }`}>
                        {formatCurrency(account.currentBalance, settings.currencySymbol)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {account.currency}
                      </span>
                    </div>

                    {/* Breakdown calculation */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Inicial</span>
                        <span className="font-mono text-slate-300 font-semibold">
                          {formatCurrency(account.initialBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block">+ Ingresos</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          +{formatCurrency(metrics.incomes, settings.currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-rose-400 block">- Gastos</span>
                        <span className="font-mono text-rose-400 font-semibold">
                          -{formatCurrency(metrics.expenses, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Description if present */}
                  {account.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/40 px-3 py-2 rounded-xl mb-3 border border-slate-800/40">
                      {account.notes}
                    </p>
                  )}
                </div>

                {/* Footer Quick Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => onOpenTransferModal(account.id)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transferir</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditAccount(account)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Editar cuenta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Eliminar cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
