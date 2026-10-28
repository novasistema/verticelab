import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  PiggyBank, 
  TrendingUp, 
  Plus, 
  ShieldCheck, 
  Palmtree, 
  Target, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  ArrowUpRight, 
  ArrowLeftRight,
  RefreshCw,
  Coins,
  Landmark,
  Building2,
  Gem,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SavingsGoal, UserSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { InvestmentModal } from './InvestmentModal';
import { refreshGoalInvestmentPrice, refreshAllInvestmentGoals } from '../services/marketPrices';

interface SavingsViewProps {
  goals: SavingsGoal[];
  settings: UserSettings;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onOpenTransferModal?: (sourceGoalId?: string) => void;
  onUpdateAllGoals?: (goals: SavingsGoal[]) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  goals,
  settings,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onOpenTransferModal,
  onUpdateAllGoals,
}) => {
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestmentGoal, setEditingInvestmentGoal] = useState<SavingsGoal | null>(null);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Live Refresh state
  const [refreshingGoalId, setRefreshingGoalId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Form State (Traditional Goal)
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<SavingsGoal['category']>('emergencia');
  const [notes, setNotes] = useState('');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) return;

    onAddGoal({
      title: title.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate: targetDate || '2026-12-31',
      category,
      color: category === 'inversion' ? '#06b6d4' : category === 'emergencia' ? '#14b8a6' : '#f59e0b',
      icon: category === 'inversion' ? 'TrendingUp' : category === 'emergencia' ? 'ShieldCheck' : 'Target',
      notes: notes.trim() || undefined,
    });

    if (parsedCurrent >= parsedTarget) {
      triggerConfetti();
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setCategory('emergencia');
    setNotes('');
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal) return;

    const val = parseFloat(depositAmount);
    if (isNaN(val) || val === 0) return;

    const newAmount = Math.max(0, depositModalGoal.currentAmount + val);
    const updatedGoal = { ...depositModalGoal, currentAmount: newAmount };

    onUpdateGoal(updatedGoal);

    if (newAmount >= depositModalGoal.targetAmount && depositModalGoal.currentAmount < depositModalGoal.targetAmount) {
      triggerConfetti();
    }

    setDepositModalGoal(null);
    setDepositAmount('');
  };

  // Live Refresh Handlers
  const handleRefreshSingleGoal = async (goal: SavingsGoal) => {
    if (!goal.isInvestment) return;
    setRefreshingGoalId(goal.id);
    try {
      const updated = await refreshGoalInvestmentPrice(goal);
      onUpdateGoal(updated);
      setSyncFeedback(`Cotización de ${goal.title} actualizada al momento`);
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (e) {
      console.error('Error al actualizar cotización:', e);
    } finally {
      setRefreshingGoalId(null);
    }
  };

  const handleRefreshAllInvestments = async () => {
    setIsSyncingAll(true);
    try {
      const { updatedGoals, count } = await refreshAllInvestmentGoals(goals);
      if (onUpdateAllGoals) {
        onUpdateAllGoals(updatedGoals);
      } else {
        updatedGoals.forEach((ug) => {
          if (ug.isInvestment) onUpdateGoal(ug);
        });
      }
      setLastSyncTime(new Date());
      setSyncFeedback(`¡Sincronizado! Se actualizaron ${count} activos en tiempo real (Binance y Bonos)`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e) {
      console.error('Error al sincronizar cotizaciones:', e);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSaveInvestment = (goalData: Omit<SavingsGoal, 'id'>, existingId?: string) => {
    if (existingId) {
      onUpdateGoal({
        ...goalData,
        id: existingId,
      });
    } else {
      onAddGoal(goalData);
    }
    setEditingInvestmentGoal(null);
  };

  // Calculations
  const totalSavedAllGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetAllGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  const investmentGoals = goals.filter((g) => g.isInvestment && g.investmentDetails);
  const totalInvestedPortfolio = investmentGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalCostBasis = investmentGoals.reduce((acc, g) => {
    const inv = g.investmentDetails!;
    return acc + (inv.unitBuyPrice ? inv.quantity * inv.unitBuyPrice : g.currentAmount);
  }, 0);
  const totalPnLDollar = totalCostBasis > 0 ? totalInvestedPortfolio - totalCostBasis : 0;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnLDollar / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title & Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              Módulo de Ahorros e Inversión
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
              En Vivo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cajas de ahorro, fondos de emergencia y cotizaciones en tiempo real (Binance y Bonos)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Live Quotes Button */}
          {investmentGoals.length > 0 && (
            <button
              id="btn-sync-all-investments"
              onClick={handleRefreshAllInvestments}
              disabled={isSyncingAll}
              className="py-2.5 px-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-cyan-900/20"
              title="Actualizar cotización de Bitcoin en Binance, Bonos y Acciones"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Actualizando...' : 'Actualizar Cotizaciones'}</span>
            </button>
          )}

          {/* New Live Investment Button */}
          <button
            id="btn-new-investment"
            onClick={() => {
              setEditingInvestmentGoal(null);
              setIsInvestmentModalOpen(true);
            }}
            className="py-2.5 px-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-amber-900/20"
            title="Añadir inversión con seguimiento automático de precio (Bitcoin, Bonos, Acciones)"
          >
            <Coins className="w-4 h-4" />
            + Nueva Inversión en Vivo
          </button>

          {/* Transfer button */}
          {onOpenTransferModal && (
            <button
              id="btn-header-transfer-cajas"
              onClick={() => onOpenTransferModal()}
              disabled={goals.length === 0}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-teal-300 font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5"
              title="Transferir fondos entre cajas de ahorro o con tu cuenta principal"
            >
              <ArrowLeftRight className="w-4 h-4 text-teal-400" />
              Transferir
            </button>
          )}

          {/* Traditional Goal */}
          <button
            id="btn-header-new-goal"
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Meta Tradicional
          </button>
        </div>
      </div>

      {/* Sync feedback notification banner */}
      {syncFeedback && (
        <div className="bg-teal-950/60 border border-teal-500/40 text-teal-200 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between gap-2 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <span className="text-[10px] text-teal-400/80 font-mono">
            {lastSyncTime?.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* KPI Overview (Including Live Investments) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total General */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total en Metas & Cajas</span>
            <div className="text-2xl font-black text-teal-300 mt-0.5">
              {formatCurrency(totalSavedAllGoals, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalTargetAllGoals > 0
                ? `${((totalSavedAllGoals / totalTargetAllGoals) * 100).toFixed(0)}% del objetivo acumulado`
                : 'Sin metas creadas'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

        {/* Portfolio Inversiones en Vivo */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Cartera de Inversión</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                {investmentGoals.length} Activo(s)
              </span>
            </div>
            <div className="text-2xl font-black text-slate-100 mt-0.5">
              {formatCurrency(totalInvestedPortfolio, settings.currency)}
            </div>
            {totalCostBasis > 0 ? (
              <p
                className={`text-[11px] font-bold mt-0.5 ${
                  totalPnLDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalPnLDollar >= 0 ? '+' : ''}
                {formatCurrency(totalPnLDollar, settings.currency)} ({totalPnLPercent >= 0 ? '+' : ''}
                {totalPnLPercent.toFixed(1)}%) Rendimiento
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5">Actualizado al instante</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Objetivo Total */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Objetivo Total de Capital</span>
            <div className="text-2xl font-black text-slate-100 mt-0.5">
              {formatCurrency(totalTargetAllGoals, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{goals.length} Meta(s) / Cajas en seguimiento</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Section Header: Activos de Inversión & Cajas de Ahorro */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <span>Tus Cajas y Posiciones de Inversión</span>
          <span className="text-xs font-normal text-slate-500">({goals.length})</span>
        </h2>
        {lastSyncTime && investmentGoals.length > 0 && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Última cotización: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const isInv = goal.isInvestment && goal.investmentDetails;
          const inv = goal.investmentDetails;

          // PnL calculation for investment card
          const costBasis = isInv && inv?.unitBuyPrice ? inv.quantity * inv.unitBuyPrice : 0;
          const pnlDollar = costBasis > 0 ? goal.currentAmount - costBasis : 0;
          const pnlPercent = costBasis > 0 ? (pnlDollar / costBasis) * 100 : 0;

          return (
            <div
              key={goal.id}
              className={`bg-slate-900 border p-5 rounded-2xl space-y-4 relative flex flex-col justify-between transition ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                  : isInv
                  ? 'border-slate-800 hover:border-slate-700 bg-gradient-to-b from-slate-900 to-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow"
                      style={{ backgroundColor: goal.color }}
                    >
                      {isInv ? (
                        inv?.assetType === 'crypto' ? (
                          <Coins className="w-5 h-5 text-white" />
                        ) : inv?.assetType === 'bono' ? (
                          <Landmark className="w-5 h-5 text-white" />
                        ) : inv?.assetType === 'metal' ? (
                          <Gem className="w-5 h-5 text-white" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-white" />
                        )
                      ) : goal.category === 'inversion' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : goal.category === 'emergencia' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Palmtree className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{goal.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isInv ? (
                          <span
                            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                              inv?.assetType === 'crypto'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                                : inv?.assetType === 'bono'
                                ? 'bg-sky-950/80 text-sky-300 border-sky-600/40'
                                : inv?.assetType === 'metal'
                                ? 'bg-yellow-950/80 text-yellow-300 border-yellow-600/40'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40'
                            }`}
                          >
                            {inv?.ticker} • {inv?.sourceName}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-teal-400">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isInv && (
                      <button
                        onClick={() => {
                          setEditingInvestmentGoal(goal);
                          setIsInvestmentModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition"
                        title="Editar posición de inversión"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Investment Detailed Live Quote Banner */}
                {isInv && inv && (
                  <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Cantidad en Custodia:</span>
                      <span className="font-mono font-bold text-slate-100">
                        {inv.quantity} {inv.ticker}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Precio de Mercado al Momento:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-300">
                          ${inv.currentUnitPrice ? inv.currentUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '---'}
                        </span>
                        {inv.change24hPercent !== undefined && inv.change24hPercent !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                              inv.change24hPercent >= 0
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {inv.change24hPercent >= 0 ? '+' : ''}
                            {inv.change24hPercent.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {costBasis > 0 && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400">Rendimiento (PnL):</span>
                        <span
                          className={`font-bold ${
                            pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {pnlDollar >= 0 ? '+' : ''}${pnlDollar.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}
                          {pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                    )}

                    {/* Single Goal Refresh Button */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500">
                        {inv.lastUpdated ? `Cotizado: ${new Date(inv.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'En vivo'}
                      </span>
                      <button
                        onClick={() => handleRefreshSingleGoal(goal)}
                        disabled={refreshingGoalId === goal.id}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingGoalId === goal.id ? 'animate-spin' : ''}`} />
                        <span>{refreshingGoalId === goal.id ? 'Consultando...' : 'Actualizar Cotización'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Progreso a la meta:</span>
                    <span className="font-extrabold text-teal-300">{pct.toFixed(0)}%</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-teal-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-1">
                    <span className="text-slate-100 font-bold">
                      {formatCurrency(goal.currentAmount, settings.currency)}
                    </span>
                    <span className="text-slate-400">
                      de {formatCurrency(goal.targetAmount, settings.currency)}
                    </span>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-slate-400 italic mt-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  id={`btn-card-transfer-${goal.id}`}
                  onClick={() => onOpenTransferModal && onOpenTransferModal(goal.id)}
                  className="py-2 px-2 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/30 text-teal-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  title="Transferir saldo de esta caja hacia otra caja o cuenta"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
                  Transferir
                </button>

                <button
                  id={`btn-card-deposit-${goal.id}`}
                  onClick={() => setDepositModalGoal(goal)}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                  title="Aportación o retiro rápido"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
                  Aporte / Retiro
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Modal (Create / Edit) */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setEditingInvestmentGoal(null);
        }}
        onSaveInvestment={handleSaveInvestment}
        editingGoal={editingInvestmentGoal}
        settings={settings}
      />

      {/* Modal: Traditional New Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-slate-100">Nueva Meta de Ahorro Tradicional</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Fondo de Emergencia, Vacaciones, Coche..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monto Objetivo ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monto Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría de Meta</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SavingsGoal['category'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="emergencia">Fondo de Emergencia</option>
                  <option value="vacaciones">Vacaciones / Viajes</option>
                  <option value="meta_personal">Meta Personal / Compra</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas Opcionales</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Estrategia o meta mensual..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-300">¿Quieres cotización en tiempo real?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsInvestmentModalOpen(true);
                  }}
                  className="font-bold text-amber-400 hover:underline"
                >
                  Crear Inversión en Vivo →
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition"
              >
                Crear Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit / Withdraw Contribution */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-slate-100">Aportación a {depositModalGoal.title}</h3>
              <button
                onClick={() => setDepositModalGoal(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Monto de Aportación ($)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Usa número positivo para sumar capital o negativo para retirar.
                </p>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ej: 150.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-lg font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

