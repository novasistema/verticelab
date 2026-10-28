import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  ArrowRight,
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Zap,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeftRight,
  Clock,
  UtensilsCrossed,
  Tag,
  Building,
  Banknote
} from 'lucide-react';
import { 
  Transaction, 
  CategoryBudget, 
  SavingsGoal, 
  UserSettings, 
  Category, 
  MoneyAccount 
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES, getCategoryById } from '../data/categories';

interface DashboardProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  settings: UserSettings;
  categories?: Category[];
  accounts?: MoneyAccount[];
  onOpenAddModal: (type?: 'ingreso' | 'gasto') => void;
  onOpenAiModal: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenTransferModal?: (sourceGoalId?: string) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  UtensilsCrossed,
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Wallet,
  TrendingUp,
  Zap,
  MoreHorizontal,
  Tag,
};

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budgets,
  savingsGoals,
  settings,
  categories = DEFAULT_CATEGORIES,
  accounts = [],
  onOpenAddModal,
  onOpenAiModal,
  onNavigateTab,
  onOpenTransferModal,
}) => {
  const currentMonthKey = new Date().toISOString().substring(0, 7); // '2026-08'

  // Filter current month transactions
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthKey));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'gasto')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const realSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (realSavings / totalIncome) * 100) : 0;

  // All time balance calculation
  const allTimeBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'ingreso' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  // Check budget alerts
  const budgetAlerts = budgets.map((b) => {
    const spentInCat = currentMonthTxs
      .filter((t) => t.type === 'gasto' && t.categoryId === b.categoryId)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const cat = getCategoryById(b.categoryId);
    const percentage = b.limit > 0 ? (spentInCat / b.limit) * 100 : 0;

    return {
      category: cat,
      limit: b.limit,
      spent: spentInCat,
      percentage,
      isExceeded: spentInCat > b.limit,
      isWarning: percentage >= settings.budgetAlertThreshold && spentInCat <= b.limit,
    };
  }).filter((b) => b.isExceeded || b.isWarning);

  // Top expense categories breakdown for current month
  const categoryExpensesMap = new Map<string, number>();
  currentMonthTxs
    .filter((t) => t.type === 'gasto')
    .forEach((t) => {
      categoryExpensesMap.set(
        t.categoryId,
        (categoryExpensesMap.get(t.categoryId) || 0) + t.amount
      );
    });

  const topCategories = Array.from(categoryExpensesMap.entries())
    .map(([catId, amount]) => ({
      category: getCategoryById(catId),
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const recentTxs = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Real-time Badge & Top Bar Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            Resumen de Finanzas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Control preciso de ingresos, gastos y ahorro diario
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20 w-fit">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Sincronizado en tiempo real</span>
        </div>
      </div>

      {/* Budget Exceeded / Warning Banners */}
      {settings.enableAlerts && budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
                alert.isExceeded
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.isExceeded ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div className="flex-1 text-xs sm:text-sm">
                <span className="font-bold">
                  {alert.isExceeded ? '⚠️ Presupuesto Excedido:' : '⚡ Alerta de Límite:'}{' '}
                </span>
                Has gastado{' '}
                <span className="font-bold">{formatCurrency(alert.spent, settings.currency)}</span> de{' '}
                <span className="font-bold">{formatCurrency(alert.limit, settings.currency)}</span> en{' '}
                <span className="underline font-bold">{alert.category.name}</span> (
                {alert.percentage.toFixed(0)}%).
              </div>
              <button
                onClick={() => onNavigateTab('presupuestos')}
                className="text-xs font-bold underline shrink-0 hover:opacity-80"
              >
                Ajustar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Balance Total */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Balance Global</span>
            <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {formatCurrency(allTimeBalance, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Acumulado histórico</p>
          </div>
        </div>

        {/* Ingresos Mes */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Ingresos (Mes)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              +{formatCurrency(totalIncome, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Entradas de dinero</p>
          </div>
        </div>

        {/* Gastos Mes */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Gastos (Mes)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
              -{formatCurrency(totalExpense, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Salidas registradas</p>
          </div>
        </div>

        {/* Ahorro Real */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Ahorro Real</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-teal-300 tracking-tight">
              {formatCurrency(realSavings, settings.currency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                {savingsRate.toFixed(1)}% tasa
              </span>
              <span className="text-[10px] text-slate-500">disp. libre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onOpenAddModal('ingreso')}
          className="p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          + Ingreso
        </button>

        <button
          onClick={() => onOpenAddModal('gasto')}
          className="p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          + Gasto
        </button>

        <button
          onClick={onOpenAiModal}
          className="p-3 bg-gradient-to-r from-teal-900/60 to-cyan-900/60 hover:from-teal-800/80 hover:to-cyan-800/80 border border-teal-500/40 text-teal-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4 text-teal-300" />
          IA / Escanear Ticket
        </button>

        <button
          onClick={() => onNavigateTab('ahorros')}
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <PiggyBank className="w-4 h-4 text-teal-400" />
          Metas de Ahorro
        </button>
      </div>

      {/* Cuentas y Billeteras Snapshot (¿Cuánto tienes y cuánto te va quedando?) */}
      {accounts && accounts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  Cuentas, Billeteras & Disponibilidad
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                    {accounts.length} Cuentas Activas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total disponible en tus bancos, billeteras virtuales y efectivo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('cuentas')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto hover:underline"
              >
                Ver Cuentas y Totales <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {accounts.slice(0, 4).map((acc) => (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('cuentas')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-semibold truncate mr-1">{acc.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                </div>
                <div className="text-base font-black font-mono text-white">
                  {formatCurrency(acc.currentBalance, settings.currency)}
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                  {acc.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Category Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Where is money going? Category Breakdown */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              ¿Dónde se va el dinero?
            </h3>
            <button
              onClick={() => onNavigateTab('informes')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Ver Informes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-400">Distribución de gastos este mes</p>

          <div className="space-y-3 pt-1">
            {topCategories.length > 0 ? (
              topCategories.map((item, idx) => {
                const IconComp = CATEGORY_ICONS[item.category.icon] || MoreHorizontal;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-200">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.category.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{item.category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-100 font-bold">
                          {formatCurrency(item.amount, settings.currency)}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-1.5">
                          ({item.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: item.category.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No hay gastos registrados en este periodo.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">Últimos Registros</h3>
            <button
              onClick={() => onNavigateTab('transacciones')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Ver Todo ({transactions.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentTxs.map((tx) => {
              const category = getCategoryById(tx.categoryId);
              const IconComp = CATEGORY_ICONS[category.icon] || MoreHorizontal;

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="capitalize">{category.name}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="capitalize text-slate-500">{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-extrabold ${
                        tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'ingreso' ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Savings Goals Snapshot */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Metas de Ahorro & Inversión
            </h3>
            <p className="text-xs text-slate-400">Progreso acumulado hacia tus objetivos</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenTransferModal && savingsGoals.length > 0 && (
              <button
                id="btn-dashboard-transfer-cajas"
                onClick={() => onOpenTransferModal()}
                className="text-xs font-bold text-teal-300 hover:text-teal-200 bg-teal-950/50 hover:bg-teal-900/70 border border-teal-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-sm"
                title="Transferir fondos entre cajas de ahorro"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Transferir
              </button>
            )}
            <button
              onClick={() => onNavigateTab('ahorros')}
              className="text-xs font-bold text-teal-400 hover:underline"
            >
              Gestionar Metas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {savingsGoals.map((goal) => {
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const isInv = goal.isInvestment && goal.investmentDetails;
            const inv = goal.investmentDetails;

            return (
              <div
                key={goal.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{goal.title}</span>
                    {isInv && (
                      <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                        {inv?.ticker} EN VIVO
                      </span>
                    )}
                  </div>
                  <span className="text-teal-400 font-extrabold">{pct.toFixed(0)}%</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-teal-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span className="text-slate-200 font-bold">
                    {formatCurrency(goal.currentAmount, settings.currency)}
                  </span>
                  <span className="text-slate-500">
                    de {formatCurrency(goal.targetAmount, settings.currency)}
                  </span>
                </div>

                {isInv && inv && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between">
                    <span>
                      {inv.quantity} {inv.ticker}
                    </span>
                    <span className="text-teal-300 font-mono">
                      ${inv.currentUnitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '---'} c/u
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
