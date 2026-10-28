import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
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
  UtensilsCrossed,
  Tag,
  Check
} from 'lucide-react';
import { Transaction, CategoryId, PaymentMethod, TransactionType, Category, MoneyAccount } from '../types';
import { DEFAULT_CATEGORIES } from '../data/categories';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'> | Transaction) => void;
  initialData?: Transaction | null;
  categories?: Category[];
  accounts?: MoneyAccount[];
  onAddSubcategory?: (categoryId: string, subcategory: string) => void;
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = DEFAULT_CATEGORIES,
  accounts = [],
  onAddSubcategory,
}) => {
  const [type, setType] = useState<TransactionType>('gasto');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<CategoryId>('comida');
  const [description, setDescription] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta');
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Inline custom subcategory state
  const [isAddingNewSubcat, setIsAddingNewSubcat] = useState(false);
  const [newSubcatText, setNewSubcatText] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setDescription(initialData.description);
      setSubcategory(initialData.subcategory || '');
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setAccountId(initialData.accountId || '');
      setNotes(initialData.notes || '');
    } else {
      setType('gasto');
      setAmount('');
      const defaultCat = categories.find(c => c.defaultType === 'gasto') || categories[0];
      setCategoryId(defaultCat ? defaultCat.id : 'comida');
      setDescription('');
      setSubcategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('tarjeta');
      setAccountId('');
      setNotes('');
    }
    setIsAddingNewSubcat(false);
    setNewSubcatText('');
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === categoryId) || 
    categories.find(c => (categoryId === 'supermercado' && c.id === 'comida') || (categoryId === 'farmacia' && c.id === 'salud')) ||
    categories[0];

  const availableSubcategories = currentCategory?.subcategories || [];

  const handleCreateInlineSubcat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubcatText.trim();
    if (!trimmed) return;

    if (onAddSubcategory && currentCategory) {
      onAddSubcategory(currentCategory.id, trimmed);
    }
    setSubcategory(trimmed);
    setNewSubcatText('');
    setIsAddingNewSubcat(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      type,
      amount: parsedAmount,
      categoryId,
      description: description.trim() || (type === 'ingreso' ? 'Ingreso' : 'Gasto'),
      subcategory: subcategory.trim() || undefined,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod,
      accountId: accountId || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload as Transaction);
    onClose();
  };

  const filteredCategories = categories.filter(c => c.defaultType === type || c.id === 'otros');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="font-bold text-lg text-slate-100">
            {initialData ? 'Editar Registro' : 'Nuevo Registro de Dinero'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('gasto');
                if (type !== 'gasto') {
                  const firstExpenseCat = categories.find(c => c.defaultType === 'gasto') || categories[0];
                  setCategoryId(firstExpenseCat ? firstExpenseCat.id : 'comida');
                  setSubcategory('');
                }
              }}
              className={`py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === 'gasto'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setType('ingreso');
                if (type !== 'ingreso') {
                  const firstIncomeCat = categories.find(c => c.defaultType === 'ingreso') || categories[0];
                  setCategoryId(firstIncomeCat ? firstIncomeCat.id : 'salario');
                  setSubcategory('');
                }
              }}
              className={`py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === 'ingreso'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Monto / Cantidad ($)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-2xl font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                $
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categoría Principal
              </label>
              <span className="text-[11px] text-teal-400 font-semibold">
                {currentCategory?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat.icon] || Tag;
                const isSelected = categoryId === cat.id || (cat.id === 'comida' && categoryId === 'supermercado') || (cat.id === 'salud' && categoryId === 'farmacia');

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setSubcategory('');
                      setIsAddingNewSubcat(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Selector & Creator (Requested feature) */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                Subcategoría de {currentCategory?.name}
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewSubcat(!isAddingNewSubcat)}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {isAddingNewSubcat ? 'Cerrar' : '+ Nueva'}
              </button>
            </div>

            {/* Inline Subcategory Creator */}
            {isAddingNewSubcat && (
              <div className="flex gap-1.5 p-2 bg-slate-900 rounded-lg border border-teal-500/40 animate-fadeIn">
                <input
                  type="text"
                  autoFocus
                  value={newSubcatText}
                  onChange={(e) => setNewSubcatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateInlineSubcat();
                    }
                  }}
                  placeholder={`Nueva subcategoría en ${currentCategory?.name}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => handleCreateInlineSubcat()}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-md transition flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Crear
                </button>
              </div>
            )}

            {/* Available Subcategory Chips */}
            {availableSubcategories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableSubcategories.map((sub) => {
                  const isSelected = subcategory.toLowerCase() === sub.toLowerCase();
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubcategory(isSelected ? '' : sub)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500 text-white shadow-sm font-bold'
                          : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                No hay subcategorías aún en {currentCategory?.name}. Usa "+ Nueva" para crear una.
              </p>
            )}

            {/* Manual input fallback */}
            <div className="pt-1">
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="O escribe una subcategoría personalizada..."
                className="w-full bg-slate-900/50 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Concept / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Concepto / Descripción
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra quincenal Mercadona, Farmacia receta, Impuestos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Payment Method & Date in 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="bizum">Bizum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Account / Wallet selector (if accounts exist) */}
          {accounts && accounts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Cuenta o Billetera Asociada</span>
                <span className="text-[10px] text-teal-400 lowercase font-normal">(impacta en su saldo)</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="">(Ninguna / General)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.accountNumber ? `(${acc.accountNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Notas Adicionales (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotaciones relativas a la factura o ticket..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
