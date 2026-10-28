import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Check, 
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Zap,
  MoreHorizontal,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { CategoryBudget, Transaction, UserSettings, CategoryId } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIES, getCategoryById } from '../data/categories';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  settings: UserSettings;
  onUpdateBudget: (categoryId: CategoryId, limit: number) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Zap,
  MoreHorizontal,
};

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  settings,
  onUpdateBudget,
}) => {
  const currentMonthKey = new Date().toISOString().substring(0, 7); // '2026-08'
  const currentMonthTxs = transactions.filter(
    (t) => t.type === 'gasto' && t.date.startsWith(currentMonthKey)
  );

  const [editingCat, setEditingCat] = useState<CategoryId | null>(null);
  const [tempLimit, setTempLimit] = useState<string>('');

  const handleStartEdit = (categoryId: CategoryId, currentLimit: number) => {
    setEditingCat(categoryId);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveEdit = (categoryId: CategoryId) => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(categoryId, val);
    }
    setEditingCat(null);
  };

  // Combine categories with budget settings
  const budgetList = CATEGORIES.filter((c) => c.defaultType === 'gasto').map((cat) => {
    const budgetObj = budgets.find((b) => b.categoryId === cat.id);
    const limit = budgetObj ? budgetObj.limit : 0;
    const spent = currentMonthTxs
      .filter((t) => t.categoryId === cat.id)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const isExceeded = limit > 0 && spent > limit;
    const isNearLimit = limit > 0 && percentage >= settings.budgetAlertThreshold && !isExceeded;

    return {
      category: cat,
      limit,
      spent,
      percentage,
      isExceeded,
      isNearLimit,
      remaining: Math.max(0, limit - spent),
    };
  });

  const totalBudgeted = budgetList.reduce((acc, b) => acc + b.limit, 0);
  const totalSpentInBudgets = budgetList.reduce((acc, b) => acc + b.spent, 0);
  const exceededCount = budgetList.filter((b) => b.isExceeded).length;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            Presupuestos y Alertas de Exceso
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Establece límites mensuales por categoría y recibe alertas antes de sobrepasarlos
          </p>
        </div>

        {exceededCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold w-fit">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>{exceededCount} Categoría(s) excedidas</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>Presupuestos bajo control</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Presupuesto Mensual Total</span>
          <div className="text-xl font-black text-slate-100 mt-1">
            {formatCurrency(totalBudgeted, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Consumido este mes</span>
          <div className="text-xl font-black text-teal-300 mt-1">
            {formatCurrency(totalSpentInBudgets, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Disponible Total</span>
          <div
            className={`text-xl font-black mt-1 ${
              totalBudgeted - totalSpentInBudgets >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(totalBudgeted - totalSpentInBudgets, settings.currency)}
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetList.map((item) => {
          const IconComp = CATEGORY_ICONS[item.category.icon] || MoreHorizontal;
          const isEditing = editingCat === item.category.id;

          return (
            <div
              key={item.category.id}
              className={`bg-slate-900 border p-4 rounded-2xl transition space-y-3 ${
                item.isExceeded
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : item.isNearLimit
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
                    style={{ backgroundColor: item.category.color }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{item.category.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Gastado:{' '}
                      <span className="font-bold text-slate-200">
                        {formatCurrency(item.spent, settings.currency)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Edit Budget Limit */}
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempLimit}
                      onChange={(e) => setTempLimit(e.target.value)}
                      className="w-20 bg-slate-950 border border-teal-500 rounded-lg p-1 text-xs text-slate-100 font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(item.category.id)}
                      className="p-1 bg-teal-600 text-white rounded-lg hover:bg-teal-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(item.category.id, item.limit)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{item.limit > 0 ? formatCurrency(item.limit, settings.currency) : 'Definir'}</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {item.limit > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-bold ${
                        item.isExceeded
                          ? 'text-rose-400'
                          : item.isNearLimit
                          ? 'text-amber-400'
                          : 'text-teal-400'
                      }`}
                    >
                      {item.percentage.toFixed(0)}% Utilizado
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {item.isExceeded
                        ? `Excedido en ${formatCurrency(item.spent - item.limit, settings.currency)}`
                        : `Quedan ${formatCurrency(item.remaining, settings.currency)}`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isExceeded
                          ? 'bg-rose-500 animate-pulse'
                          : item.isNearLimit
                          ? 'bg-amber-400'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Sin límite asignado. Pulsa 'Definir' para activar las alertas de presupuesto.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
