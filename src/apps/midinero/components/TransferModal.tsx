import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  ArrowRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  X, 
  PiggyBank, 
  Wallet, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Palmtree,
  Target
} from 'lucide-react';
import { SavingsGoal, UserSettings, TransferSavingsPayload, TransferSavingsType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  settings: UserSettings;
  initialSourceGoalId?: string;
  onConfirmTransfer: (payload: TransferSavingsPayload) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  goals,
  settings,
  initialSourceGoalId,
  onConfirmTransfer,
}) => {
  const [transferType, setTransferType] = useState<TransferSavingsType>('between_goals');
  const [sourceGoalId, setSourceGoalId] = useState<string>('');
  const [targetGoalId, setTargetGoalId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [recordTransaction, setRecordTransaction] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Initialize or reset selections when modal opens or initialSourceGoalId changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().substring(0, 10));

      if (goals.length > 0) {
        const defaultSource = initialSourceGoalId 
          ? goals.find(g => g.id === initialSourceGoalId)?.id || goals[0].id
          : goals[0].id;
        setSourceGoalId(defaultSource);

        const possibleTargets = goals.filter(g => g.id !== defaultSource);
        if (possibleTargets.length > 0) {
          setTargetGoalId(possibleTargets[0].id);
        } else {
          setTargetGoalId('');
        }
      }
    }
  }, [isOpen, initialSourceGoalId, goals]);

  // Adjust target whenever source changes to ensure they are distinct
  const handleSourceChange = (newSourceId: string) => {
    setSourceGoalId(newSourceId);
    setError('');
    if (transferType === 'between_goals' && targetGoalId === newSourceId) {
      const another = goals.find(g => g.id !== newSourceId);
      if (another) setTargetGoalId(another.id);
    }
  };

  if (!isOpen) return null;

  const sourceGoal = goals.find(g => g.id === sourceGoalId);
  const targetGoal = goals.find(g => g.id === targetGoalId);

  const numAmount = parseFloat(amount) || 0;
  const sourceAvailable = sourceGoal ? sourceGoal.currentAmount : 0;

  const handlePercentageClick = (pct: number) => {
    if (!sourceGoal) return;
    const calc = ((sourceGoal.currentAmount * pct) / 100);
    setAmount(calc > 0 ? calc.toFixed(2) : '');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0 || isNaN(numAmount)) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (transferType === 'between_goals') {
      if (!sourceGoalId || !targetGoalId) {
        setError('Debes seleccionar la caja de origen y la caja de destino.');
        return;
      }
      if (sourceGoalId === targetGoalId) {
        setError('La caja de origen y de destino no pueden ser la misma.');
        return;
      }
      if (numAmount > sourceAvailable) {
        setError(`El monto supera el saldo disponible (${formatCurrency(sourceAvailable, settings.currency)}) de la caja de origen.`);
        return;
      }
    } else if (transferType === 'to_main_account') {
      if (!sourceGoalId) {
        setError('Debes seleccionar la caja de ahorro de origen.');
        return;
      }
      if (numAmount > sourceAvailable) {
        setError(`El monto supera el saldo disponible (${formatCurrency(sourceAvailable, settings.currency)}) de la caja.`);
        return;
      }
    } else if (transferType === 'from_main_account') {
      if (!targetGoalId) {
        setError('Debes seleccionar la caja de ahorro de destino.');
        return;
      }
    }

    onConfirmTransfer({
      type: transferType,
      sourceGoalId: transferType !== 'from_main_account' ? sourceGoalId : undefined,
      targetGoalId: transferType !== 'to_main_account' ? targetGoalId : undefined,
      amount: numAmount,
      date,
      notes: notes.trim() || undefined,
      recordTransaction,
    });

    onClose();
  };

  // Preview calculations
  const previewSourceRemaining = sourceGoal ? Math.max(0, sourceGoal.currentAmount - numAmount) : 0;
  const previewTargetNewTotal = targetGoal ? targetGoal.currentAmount + numAmount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="modal-transfer-cajas"
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Transferir de Cajas de Ahorro
              </h3>
              <p className="text-[11px] text-slate-400">
                Moviliza y reasigna fondos entre tus fondos y cuentas
              </p>
            </div>
          </div>
          <button
            id="btn-close-transfer-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Transfer Type Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-tab-between-goals"
                onClick={() => {
                  setTransferType('between_goals');
                  setError('');
                }}
                className={`py-2 px-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  transferType === 'between_goals'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Entre Cajas
              </button>

              <button
                type="button"
                id="btn-tab-to-main"
                onClick={() => {
                  setTransferType('to_main_account');
                  setError('');
                }}
                className={`py-2 px-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  transferType === 'to_main_account'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                A Saldo Libre
              </button>

              <button
                type="button"
                id="btn-tab-from-main"
                onClick={() => {
                  setTransferType('from_main_account');
                  setError('');
                }}
                className={`py-2 px-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  transferType === 'from_main_account'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
                Desde Saldo
              </button>
            </div>
          </div>

          {/* Conditional Origin & Destination Blocks */}
          {transferType === 'between_goals' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Source Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Caja de Origen (De)
                </label>
                <select
                  id="select-transfer-source-goal"
                  value={sourceGoalId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatCurrency(g.currentAmount, settings.currency)})
                    </option>
                  ))}
                </select>
                {sourceGoal && (
                  <p className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Disponible:</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(sourceGoal.currentAmount, settings.currency)}
                    </span>
                  </p>
                )}
              </div>

              {/* Destination Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Caja de Destino (Hacia)
                </label>
                <select
                  id="select-transfer-target-goal"
                  value={targetGoalId}
                  onChange={(e) => {
                    setTargetGoalId(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {goals
                    .filter((g) => g.id !== sourceGoalId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({formatCurrency(g.currentAmount, settings.currency)})
                      </option>
                    ))}
                </select>
                {targetGoal && (
                  <p className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Actual:</span>
                    <span className="font-bold text-teal-300">
                      {formatCurrency(targetGoal.currentAmount, settings.currency)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {transferType === 'to_main_account' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-teal-400" />
                  Caja de Ahorro a Retirar
                </label>
                <select
                  id="select-transfer-source-goal-to-main"
                  value={sourceGoalId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatCurrency(g.currentAmount, settings.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Destino del capital:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> Cuenta Principal (Saldo Disponible)
                </span>
              </div>
            </div>
          )}

          {transferType === 'from_main_account' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
                <span>Origen del capital:</span>
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-teal-400" /> Cuenta Principal (Saldo Disponible)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-teal-400" />
                  Caja de Ahorro a Aportar
                </label>
                <select
                  id="select-transfer-target-goal-from-main"
                  value={targetGoalId}
                  onChange={(e) => {
                    setTargetGoalId(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatCurrency(g.currentAmount, settings.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount input & Quick Percentage Chips */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">
                Monto a Transferir
              </label>
              {transferType !== 'from_main_account' && sourceGoal && (
                <span className="text-[11px] text-slate-400">
                  Máximo: <strong className="text-slate-200">{formatCurrency(sourceAvailable, settings.currency)}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                {settings.currencySymbol}
              </span>
              <input
                id="input-transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-lg font-black text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick chips if transferring from a box */}
            {transferType !== 'from_main_account' && sourceAvailable > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-500">Rápido:</span>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageClick(pct)}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {pct === 100 ? 'Todo (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Balance Preview Card */}
          {numAmount > 0 && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Balance Resultante
              </span>

              {transferType === 'between_goals' && sourceGoal && targetGoal && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block truncate">{sourceGoal.title}:</span>
                    <span className="font-extrabold text-rose-300">
                      {formatCurrency(previewSourceRemaining, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">(-{formatCurrency(numAmount, settings.currency)})</span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block truncate">{targetGoal.title}:</span>
                    <span className="font-extrabold text-emerald-300">
                      {formatCurrency(previewTargetNewTotal, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">(+{formatCurrency(numAmount, settings.currency)})</span>
                  </div>
                </div>
              )}

              {transferType === 'to_main_account' && sourceGoal && (
                <div className="text-xs flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 truncate">{sourceGoal.title} quedará en:</span>
                  <span className="font-extrabold text-rose-300">
                    {formatCurrency(previewSourceRemaining, settings.currency)}
                  </span>
                </div>
              )}

              {transferType === 'from_main_account' && targetGoal && (
                <div className="text-xs flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 truncate">{targetGoal.title} acumulará:</span>
                  <span className="font-extrabold text-emerald-300">
                    {formatCurrency(previewTargetNewTotal, settings.currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Date and Concept */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha de Transferencia
              </label>
              <input
                id="input-transfer-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Concepto / Nota (Opcional)
              </label>
              <input
                id="input-transfer-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Reasignación, fondo de viaje..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Checkbox: Record in Transactions list */}
          <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60 cursor-pointer hover:bg-slate-950/70 transition">
            <input
              id="checkbox-record-transaction"
              type="checkbox"
              checked={recordTransaction}
              onChange={(e) => setRecordTransaction(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700"
            />
            <span className="text-xs text-slate-300 font-medium">
              Registrar este movimiento en el historial general de transacciones
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              id="btn-cancel-transfer"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-transfer"
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-900/30"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Confirmar Transferencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
