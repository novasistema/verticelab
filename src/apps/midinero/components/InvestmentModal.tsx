import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Coins, 
  Landmark, 
  Building2, 
  Gem,
  AlertCircle
} from 'lucide-react';
import { SavingsGoal, UserSettings, InvestmentAssetType, InvestmentDetails } from '../types';
import { POPULAR_ASSETS, fetchLiveMarketPrice, AssetPreset } from '../services/marketPrices';
import { formatCurrency } from '../utils/formatters';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvestment: (goalData: Omit<SavingsGoal, 'id'>, existingId?: string) => void;
  editingGoal?: SavingsGoal | null;
  settings: UserSettings;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSaveInvestment,
  editingGoal,
  settings,
}) => {
  const [assetType, setAssetType] = useState<InvestmentAssetType>('crypto');
  const [selectedPresetTicker, setSelectedPresetTicker] = useState<string>('BTC');
  const [customTicker, setCustomTicker] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('0.05');
  const [unitBuyPrice, setUnitBuyPrice] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('5000');
  const [targetDate, setTargetDate] = useState<string>('2027-12-31');
  const [notes, setNotes] = useState<string>('');

  // Live Quote State
  const [liveUnitPrice, setLiveUnitPrice] = useState<number>(0);
  const [liveChange24h, setLiveChange24h] = useState<number>(0);
  const [liveSource, setLiveSource] = useState<string>('');
  const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load existing goal or defaults on open
  useEffect(() => {
    if (!isOpen) return;

    if (editingGoal && editingGoal.isInvestment && editingGoal.investmentDetails) {
      const inv = editingGoal.investmentDetails;
      setAssetType(inv.assetType);
      const isPreset = POPULAR_ASSETS.some((a) => a.ticker === inv.ticker);
      if (isPreset) {
        setSelectedPresetTicker(inv.ticker);
        setCustomTicker('');
      } else {
        setSelectedPresetTicker('CUSTOM');
        setCustomTicker(inv.ticker);
      }
      setTitle(editingGoal.title);
      setQuantity(inv.quantity.toString());
      setUnitBuyPrice(inv.unitBuyPrice ? inv.unitBuyPrice.toString() : '');
      setTargetAmount(editingGoal.targetAmount.toString());
      setTargetDate(editingGoal.targetDate || '2027-12-31');
      setNotes(editingGoal.notes || '');
      setLiveUnitPrice(inv.currentUnitPrice);
      setLiveChange24h(inv.change24hPercent || 0);
      setLiveSource(inv.sourceName);
    } else {
      // Default to Bitcoin on Binance
      setAssetType('crypto');
      setSelectedPresetTicker('BTC');
      setCustomTicker('');
      setTitle('Bitcoin (Binance)');
      setQuantity('0.02');
      setUnitBuyPrice('65000');
      setTargetAmount('5000');
      setTargetDate('2027-12-31');
      setNotes('Custodia en Binance. Cotización en tiempo real.');
      // Fetch initial price
      handleFetchQuote('BTC', 'crypto');
    }
  }, [isOpen, editingGoal]);

  const activeTicker = selectedPresetTicker === 'CUSTOM' ? customTicker.toUpperCase().trim() : selectedPresetTicker;

  const handleFetchQuote = async (tickerToFetch: string, typeToFetch: InvestmentAssetType) => {
    if (!tickerToFetch) return;
    setIsFetchingPrice(true);
    setFetchError(null);

    try {
      const quote = await fetchLiveMarketPrice(tickerToFetch, typeToFetch);
      setLiveUnitPrice(quote.price);
      setLiveChange24h(quote.change24h);
      setLiveSource(quote.source);
    } catch {
      setFetchError('No se pudo conectar con el proveedor de precios en vivo');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handlePresetSelect = (preset: AssetPreset) => {
    setSelectedPresetTicker(preset.ticker);
    setAssetType(preset.type);
    setTitle(`${preset.name} (${preset.ticker})`);
    if (!notes) {
      setNotes(preset.description);
    }
    handleFetchQuote(preset.ticker, preset.type);
  };

  const parsedQty = parseFloat(quantity) || 0;
  const computedCurrentTotal = Number((parsedQty * (liveUnitPrice || 0)).toFixed(2));
  const parsedBuyPrice = parseFloat(unitBuyPrice) || 0;
  const costBasis = parsedQty * parsedBuyPrice;
  const pnlDollar = costBasis > 0 ? computedCurrentTotal - costBasis : 0;
  const pnlPercent = costBasis > 0 ? (pnlDollar / costBasis) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicker) {
      setFetchError('Ingresa un símbolo o ticker válido (ej. BTC, TLT, SPY)');
      return;
    }

    if (parsedQty <= 0) {
      setFetchError('Ingresa una cantidad mayor a 0');
      return;
    }

    const parsedTarget = parseFloat(targetAmount) || Math.max(1000, computedCurrentTotal * 1.5);

    const investmentDetails: InvestmentDetails = {
      assetType,
      ticker: activeTicker,
      assetName: title.trim() || activeTicker,
      quantity: parsedQty,
      unitBuyPrice: parsedBuyPrice > 0 ? parsedBuyPrice : undefined,
      currentUnitPrice: liveUnitPrice || (POPULAR_ASSETS.find((a) => a.ticker === activeTicker)?.defaultPrice || 100),
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      change24hPercent: liveChange24h,
      sourceName: liveSource || (assetType === 'crypto' ? 'Binance Live API' : 'Mercado al Momento'),
    };

    const color =
      assetType === 'crypto' ? '#f59e0b' : assetType === 'bono' ? '#0284c7' : assetType === 'metal' ? '#eab308' : '#06b6d4';

    const goalData: Omit<SavingsGoal, 'id'> = {
      title: title.trim() || `${activeTicker} Inversión`,
      targetAmount: parsedTarget,
      currentAmount: computedCurrentTotal,
      targetDate: targetDate || '2027-12-31',
      category: 'inversion',
      color,
      icon: 'TrendingUp',
      notes: notes.trim() || undefined,
      isInvestment: true,
      investmentDetails,
    };

    onSaveInvestment(goalData, editingGoal?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {editingGoal ? 'Editar Inversión / Posición' : 'Nueva Inversión con Cotización en Vivo'}
              </h3>
              <p className="text-xs text-slate-400">
                Seguimiento de Bitcoin en Binance, Bonos y Acciones en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Asset Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Tipo de Inversión
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssetType('crypto');
                  setSelectedPresetTicker('BTC');
                  handlePresetSelect(POPULAR_ASSETS.find((a) => a.ticker === 'BTC')!);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  assetType === 'crypto'
                    ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Cripto (Binance)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssetType('bono');
                  setSelectedPresetTicker('TLT');
                  handlePresetSelect(POPULAR_ASSETS.find((a) => a.ticker === 'TLT')!);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  assetType === 'bono'
                    ? 'border-sky-500/50 bg-sky-950/30 text-sky-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Landmark className="w-4 h-4 text-sky-400" />
                <span>Bonos al Momento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssetType('accion');
                  setSelectedPresetTicker('SPY');
                  handlePresetSelect(POPULAR_ASSETS.find((a) => a.ticker === 'SPY')!);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  assetType === 'accion'
                    ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Acciones / ETFs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssetType('metal');
                  setSelectedPresetTicker('PAXG');
                  handlePresetSelect(POPULAR_ASSETS.find((a) => a.ticker === 'PAXG')!);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                  assetType === 'metal'
                    ? 'border-yellow-500/50 bg-yellow-950/30 text-yellow-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Gem className="w-4 h-4 text-yellow-400" />
                <span>Oro / Metales</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons for this Asset Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Seleccionar Activo o Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ASSETS.filter((a) => a.type === assetType).map((preset) => (
                <button
                  key={preset.ticker}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                    selectedPresetTicker === preset.ticker
                      ? 'border-teal-500 bg-teal-950/40 text-teal-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">{preset.ticker}</span>
                  <span className="text-[10px] opacity-70 truncate max-w-[100px]">{preset.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPresetTicker('CUSTOM')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectedPresetTicker === 'CUSTOM'
                    ? 'border-teal-500 bg-teal-950/40 text-teal-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                + Otro Ticker
              </button>
            </div>

            {selectedPresetTicker === 'CUSTOM' && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: ETH, NVDA, AL30, AAPL..."
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 uppercase font-mono font-bold focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => handleFetchQuote(customTicker, assetType)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl text-xs transition"
                >
                  Cotizar
                </button>
              </div>
            )}
          </div>

          {/* Live Quote Card Banner */}
          <div className="bg-slate-950 border border-teal-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400">Cotización en Vivo:</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-teal-950 text-teal-300 border border-teal-800/60">
                  {liveSource || (assetType === 'crypto' ? 'Binance' : 'Mercado en Vivo')}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-100">
                  ${liveUnitPrice ? liveUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">USD / unidad</span>
                {liveChange24h !== 0 && (
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      liveChange24h >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {liveChange24h >= 0 ? '+' : ''}
                    {liveChange24h.toFixed(2)}% (24h)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFetchQuote(activeTicker, assetType)}
              disabled={isFetchingPrice || !activeTicker}
              className="py-2 px-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPrice ? 'animate-spin' : ''}`} />
              {isFetchingPrice ? 'Consultando...' : 'Actualizar Cotización'}
            </button>
          </div>

          {fetchError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Name & Target Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nombre de la Caja / Inversión
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Mi Bitcoin en Binance"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Meta u Objetivo de Capital ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Holdings: Quantity & Cost Basis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Cantidad Poseída ({activeTicker || 'Unidades'})
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 0.05"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-teal-300 focus:outline-none focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {assetType === 'crypto' ? 'Criptomonedas / Fracciones' : 'Títulos / Bonos / Acciones'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Precio de Compra Promedio ($ USD) <span className="text-slate-500">(Opcional)</span>
              </label>
              <input
                type="number"
                step="any"
                value={unitBuyPrice}
                onChange={(e) => setUnitBuyPrice(e.target.value)}
                placeholder="Ej: 64000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Calcula automáticamente ganancia o pérdida (PnL)
              </span>
            </div>
          </div>

          {/* Real-Time Total Calculation Preview */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Valor Total en Cartera Actual:</span>
              <span className="text-lg font-black text-teal-300">
                ${computedCurrentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            {costBasis > 0 && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Rendimiento Estimado (PnL):</span>
                <span className={`font-bold ${pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pnlDollar >= 0 ? '+' : ''}${pnlDollar.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}
                  {pnlPercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Notas de Estrategia o Plataforma
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cartera Binance Spot, rebalancear a fin de año..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-900/30"
            >
              <Check className="w-4 h-4" />
              {editingGoal ? 'Guardar Cambios' : 'Crear Caja de Inversión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
