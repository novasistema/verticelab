import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowRightLeft, 
  DollarSign, 
  Calendar, 
  FileText, 
  Building, 
  Wallet, 
  Banknote,
  AlertCircle
} from 'lucide-react';
import { MoneyAccount, UserSettings, AccountTransferPayload } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: MoneyAccount[];
  settings: UserSettings;
  initialSourceId?: string;
  onConfirmTransfer: (payload: AccountTransferPayload) => void;
}

export const AccountTransferModal: React.FC<AccountTransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  settings,
  initialSourceId,
  onConfirmTransfer,
}) => {
  const [sourceId, setSourceId] = useState<string>(() => {
    if (initialSourceId) return initialSourceId;
    return accounts[0]?.id || '';
  });

  const [targetId, setTargetId] = useState<string>(() => {
    const candidate = accounts.find((a) => a.id !== (initialSourceId || accounts[0]?.id));
    return candidate ? candidate.id : '';
  });

  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === sourceId);
  const targetAccount = accounts.find((a) => a.id === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError('Debes seleccionar la cuenta de origen y la de destino.');
      return;
    }
    if (sourceId === targetId) {
      setError('La cuenta origen y la cuenta destino deben ser diferentes.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('El monto a transferir debe ser mayor a 0.');
      return;
    }

    if (sourceAccount && sourceAccount.currentBalance < amount && sourceAccount.type !== 'tarjeta_credito') {
      // Warning if insufficient balance, but allow with confirm or let them know
      // In financial apps, accounts might go negative if overdrafted, but let's inform them
    }

    onConfirmTransfer({
      sourceAccountId: sourceId,
      targetAccountId: targetId,
      amount: Number(amount),
      date,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Transferir entre Cuentas</h2>
              <p className="text-xs text-slate-400">
                Pasa dinero de un banco a tu billetera virtual, efectivo o viceversa
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source and Target Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Source Account */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Desde (Sale el dinero)
              </span>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.currentBalance, settings.currencySymbol)})
                  </option>
                ))}
              </select>
              {sourceAccount && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Disponible:</span>
                  <span className={`font-mono font-bold ${sourceAccount.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(sourceAccount.currentBalance, settings.currencySymbol)}
                  </span>
                </div>
              )}
            </div>

            {/* Target Account */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hacia (Entra el dinero)
              </span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === sourceId}>
                    {acc.name} ({formatCurrency(acc.currentBalance, settings.currencySymbol)})
                  </option>
                ))}
              </select>
              {targetAccount && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Saldo actual:</span>
                  <span className={`font-mono font-bold ${targetAccount.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(targetAccount.currentBalance, settings.currencySymbol)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                Monto a Transferir *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Concept / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Motivo o Concepto (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Extracción cajero Banelco, Carga Mercado Pago..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Action buttons */}
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
              <ArrowRightLeft className="w-4 h-4" />
              <span>Confirmar Transferencia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
