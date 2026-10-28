import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  ArrowUpDown,
  RotateCcw,
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
  Layers
} from 'lucide-react';
import { Transaction, CategoryId, UserSettings, Category, MoneyAccount } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES, getCategoryById } from '../data/categories';

interface TransactionsViewProps {
  transactions: Transaction[];
  settings: UserSettings;
  categories?: Category[];
  accounts?: MoneyAccount[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onClearAllTransactions?: () => void;
  onOpenCategoriesModal?: () => void;
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

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  settings,
  categories = DEFAULT_CATEGORIES,
  accounts = [],
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onClearAllTransactions,
  onOpenCategoriesModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Compute available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      // Collect all unique subcategories from all categories and transactions
      const set = new Set<string>();
      categories.forEach(c => c.subcategories.forEach(s => set.add(s)));
      transactions.forEach(t => {
        if (t.subcategory) set.add(t.subcategory);
      });
      return Array.from(set).sort();
    } else {
      const cat = categories.find(c => c.id === selectedCategory || (selectedCategory === 'comida' && c.id === 'supermercado') || (selectedCategory === 'salud' && c.id === 'farmacia'));
      return cat ? cat.subcategories : [];
    }
  }, [selectedCategory, categories, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search text
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.subcategory && tx.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter (handling aliases)
      const matchesCategory =
        selectedCategory === 'all' ||
        tx.categoryId === selectedCategory ||
        (selectedCategory === 'comida' && tx.categoryId === 'supermercado') ||
        (selectedCategory === 'salud' && tx.categoryId === 'farmacia');

      // Subcategory filter
      const matchesSubcategory =
        selectedSubcategory === 'all' ||
        (tx.subcategory && tx.subcategory.toLowerCase() === selectedSubcategory.toLowerCase());

      // Type filter
      const matchesType = selectedType === 'all' || tx.type === selectedType;

      // Payment method filter
      const matchesPayment =
        selectedPayment === 'all' || tx.paymentMethod === selectedPayment;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesType && matchesPayment;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
  }, [transactions, searchTerm, selectedCategory, selectedSubcategory, selectedType, selectedPayment, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Subcategoría', 'Descripción', 'Monto ($)', 'Método de Pago', 'Notas'];
    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.type,
      getCategoryById(tx.categoryId, categories).name,
      `"${(tx.subcategory || '').replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.paymentMethod,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Control_Registros_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100">Registros de Transacciones</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Historial con subcategorías detalladas (Comida, Salud, Transporte, Impuestos, Ocio...)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCategoriesModal && (
            <button
              onClick={onOpenCategoriesModal}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700"
              title="Administrar categorías y subcategorías personalizadas"
            >
              <Layers className="w-4 h-4 text-teal-400" />
              Subcategorías
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-4 h-4 text-teal-400" />
            CSV
          </button>

          <button
            onClick={onAddTransaction}
            className="py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-teal-900/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, subcategoría (ej. Supermercado, Farmacia, Gasolina, IRPF)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all'); // Reset subcategory when category changes
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter (Requested Feature) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Subcategoría</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todas las subcat.</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Ingresos y Gastos</option>
              <option value="gasto">Solo Gastos</option>
              <option value="ingreso">Solo Ingresos</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Forma de Pago</label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todos los métodos</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="bizum">Bizum</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Ordenar Por</label>
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-teal-500"
              >
                <option value="date">Fecha</option>
                <option value="amount">Monto ($)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl"
                title="Cambiar orden"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>
            Mostrando {filteredTransactions.length} de {transactions.length} registros
          </span>
          {onClearAllTransactions && transactions.length > 0 && (
            <button
              id="btn-clear-all-transactions-view"
              onClick={onClearAllTransactions}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-[11px] font-medium border border-rose-500/20"
              title="Borrar todas las transacciones para iniciar desde cero"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar todas ({transactions.length})
            </button>
          )}
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {filteredTransactions.map((tx) => {
              const category = getCategoryById(tx.categoryId, categories);
              const IconComp = CATEGORY_ICONS[category.icon] || Tag;
              const matchingAccount = accounts.find(a => a.id === tx.accountId);

              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition group"
                >
                  {/* Left: Icon + Category + Description + Subcategory */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
                      style={{ backgroundColor: category.color }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                          {tx.description}
                        </span>
                        {tx.subcategory && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-teal-950/70 border border-teal-600/30 text-teal-300 font-semibold">
                            <Tag className="w-2.5 h-2.5" />
                            {tx.subcategory}
                          </span>
                        )}
                        {matchingAccount && (
                          <span 
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold text-slate-200 border"
                            style={{ borderColor: `${matchingAccount.color}66`, backgroundColor: `${matchingAccount.color}22` }}
                          >
                            <Wallet className="w-2.5 h-2.5" />
                            {matchingAccount.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-300">{category.name}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="capitalize text-slate-400">{tx.paymentMethod}</span>
                        {tx.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px] italic text-slate-500">
                              {tx.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-black ${
                          tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'ingreso' ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition"
                        title="Editar registro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Filter className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-semibold">No se encontraron transacciones con los filtros seleccionados</p>
            <p className="text-xs text-slate-600">Prueba ajustando la búsqueda, categoría o subcategoría</p>
          </div>
        )}
      </div>
    </div>
  );
};
