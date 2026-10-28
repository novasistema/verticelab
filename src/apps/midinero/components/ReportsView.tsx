import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  PieChart as PieIcon, 
  Calendar,
  Filter,
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Wallet,
  Zap,
  MoreHorizontal,
  UtensilsCrossed,
  Tag,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Transaction, UserSettings, Category } from '../types';
import { calculateMonthlyStats, formatCurrency, getMonthName } from '../utils/formatters';
import { DEFAULT_CATEGORIES, getCategoryById } from '../data/categories';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: UserSettings;
  categories?: Category[];
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

// Generates harmonious, distinctive shades for subcategories based on parent category color
const getSubcategoryColor = (baseHex: string, index: number, total: number) => {
  if (total <= 1) return baseHex;
  const factors = [1, 0.82, 0.65, 0.5, 0.92, 0.74, 0.58, 0.42];
  const factor = factors[index % factors.length];
  
  let c = baseHex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  
  r = Math.min(255, Math.floor(r * factor + (index % 2 === 1 ? 25 : 0)));
  g = Math.min(255, Math.floor(g * factor + (index % 3 === 1 ? 20 : 0)));
  b = Math.min(255, Math.floor(b * factor + (index % 2 === 0 ? 30 : 0)));

  return `rgb(${r}, ${g}, ${b})`;
};

type ChartMode = 'concentric' | 'categories' | 'subcategories' | 'drilldown';

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  transactions, 
  settings,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [breakdownView, setBreakdownView] = useState<'categorias' | 'subcategorias'>('categorias');
  const [chartMode, setChartMode] = useState<ChartMode>('concentric');
  const [selectedCatForDrilldown, setSelectedCatForDrilldown] = useState<string>('');
  const [hoveredSlice, setHoveredSlice] = useState<{
    name: string;
    value: number;
    percentage: number;
    count?: number;
    parentCategory?: string;
  } | null>(null);

  // Monthly summary calculation
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(transactions);
  }, [transactions]);

  // Available months list for selector
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => months.add(tx.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions based on month selection
  const filteredTxs = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Total expenses
  const totalExpense = useMemo(() => {
    return filteredTxs
      .filter((t) => t.type === 'gasto')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTxs]);

  // Category breakdown for pie chart & detailed table
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === 'gasto');

    const map = new Map<string, { total: number; count: number }>();
    expenses.forEach((tx) => {
      const current = map.get(tx.categoryId) || { total: 0, count: 0 };
      map.set(tx.categoryId, {
        total: current.total + tx.amount,
        count: current.count + 1,
      });
    });

    return Array.from(map.entries())
      .map(([catId, data]) => ({
        category: getCategoryById(catId, categories),
        total: data.total,
        count: data.count,
        avg: data.count > 0 ? data.total / data.count : 0,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, totalExpense, categories]);

  // Subcategory breakdown
  const subcategoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === 'gasto');
    const map = new Map<string, { catId: string; subcategory: string; total: number; count: number }>();

    expenses.forEach((tx) => {
      const subcat = tx.subcategory?.trim() || 'General / Sin Subcategoría';
      const key = `${tx.categoryId}__${subcat.toLowerCase()}`;
      const current = map.get(key) || { catId: tx.categoryId, subcategory: subcat, total: 0, count: 0 };
      current.total += tx.amount;
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        category: getCategoryById(item.catId, categories),
        subcategory: item.subcategory,
        total: item.total,
        count: item.count,
        avg: item.count > 0 ? item.total / item.count : 0,
        percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, totalExpense, categories]);

  // Default drilldown category to the first one with expenses if unset
  React.useEffect(() => {
    if (categoryBreakdown.length > 0 && (!selectedCatForDrilldown || !categoryBreakdown.some(c => c.category.id === selectedCatForDrilldown))) {
      setSelectedCatForDrilldown(categoryBreakdown[0].category.id);
    }
  }, [categoryBreakdown, selectedCatForDrilldown]);

  // Circular Chart Data Preparation:
  // 1. Categories Data
  const categoryPieData = useMemo(() => {
    return categoryBreakdown.map((c) => ({
      name: c.category.name,
      value: c.total,
      color: c.category.color,
      count: c.count,
      percentage: c.percentage,
      categoryId: c.category.id,
      type: 'category' as const,
    }));
  }, [categoryBreakdown]);

  // 2. Subcategories Data (grouped according to categoryBreakdown order for concentric harmony)
  const subcategoryPieData = useMemo(() => {
    const list: Array<{
      name: string;
      value: number;
      color: string;
      count: number;
      percentage: number;
      parentCategory: string;
      parentCategoryId: string;
      type: 'subcategory';
    }> = [];

    categoryBreakdown.forEach((catRow) => {
      const subsForCat = subcategoryBreakdown.filter(
        (sub) => sub.category.id === catRow.category.id
      );

      subsForCat.forEach((sub, idx) => {
        const color = getSubcategoryColor(catRow.category.color, idx, subsForCat.length);
        list.push({
          name: sub.subcategory,
          value: sub.total,
          color,
          count: sub.count,
          percentage: sub.percentage,
          parentCategory: catRow.category.name,
          parentCategoryId: catRow.category.id,
          type: 'subcategory',
        });
      });
    });

    return list;
  }, [categoryBreakdown, subcategoryBreakdown]);

  // 3. Drilldown Data (for a specific selected category)
  const drilldownData = useMemo(() => {
    if (!selectedCatForDrilldown) return [];
    const subs = subcategoryBreakdown.filter((s) => s.category.id === selectedCatForDrilldown);
    const catTotal = subs.reduce((acc, curr) => acc + curr.total, 0);

    return subs.map((s, idx) => ({
      name: s.subcategory,
      value: s.total,
      count: s.count,
      color: getSubcategoryColor(s.category.color, idx, subs.length),
      percentage: catTotal > 0 ? (s.total / catTotal) * 100 : 0,
      overallPercentage: s.percentage,
      parentCategory: s.category.name,
      parentCategoryId: s.category.id,
      type: 'subcategory' as const,
    }));
  }, [selectedCatForDrilldown, subcategoryBreakdown]);

  // Active drilldown category object
  const activeDrilldownCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCatForDrilldown) || categoryBreakdown[0]?.category;
  }, [categories, selectedCatForDrilldown, categoryBreakdown]);

  // Totals for header
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const realSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (realSavings / totalIncome) * 100) : 0;

  // Custom Tooltip for Circular Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isSubcat = data.type === 'subcategory' || !!data.parentCategory;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md z-50">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: data.color || payload[0].fill }}
            />
            <span className="font-extrabold text-white text-sm">{data.name}</span>
          </div>
          {isSubcat && data.parentCategory && (
            <div className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
              <span>Categoría:</span>
              <span className="text-slate-200">{data.parentCategory}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 text-slate-300 pt-1.5 border-t border-slate-800">
            <span className="text-slate-400">Gasto:</span>
            <span className="font-black text-rose-400">
              {formatCurrency(data.value, settings.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span className="text-slate-400">% de Gastos:</span>
            <span className="font-bold text-teal-300">
              {(data.percentage || 0).toFixed(1)}%
            </span>
          </div>
          {data.count && (
            <div className="flex justify-between gap-4 text-slate-400 text-[11px]">
              <span>Registros:</span>
              <span className="font-medium text-slate-200">{data.count}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-teal-400" /> Informes y Métricas Financieras
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Evolución de ingresos vs. gastos, tasa de ahorro real y análisis de subcategorías
          </p>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-semibold cursor-pointer"
          >
            <option value="all">Histórico Completo</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Ingresos Totales</span>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">
            +{formatCurrency(totalIncome, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Gastos Totales</span>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1">
            -{formatCurrency(totalExpense, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Ahorro Real Neto</span>
          <div className={`text-lg sm:text-2xl font-black mt-1 ${realSavings >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
            {formatCurrency(realSavings, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Tasa de Ahorro</span>
          <div className="text-lg sm:text-2xl font-black text-teal-400 mt-1">
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Evolution Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-teal-400" /> Ingresos vs. Gastos Mensuales
          </h3>
          <p className="text-xs text-slate-400">Comparativa histórica de flujo de caja</p>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val) => [formatCurrency(Number(val), settings.currency), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CIRCULAR CHART WITH RECHARTS: CATEGORIES & SUBCATEGORIES */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        {/* Header and Chart View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-teal-400" /> Gráfico Circular de Gastos
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Recharts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualiza la distribución porcentual y montos por categorías principales y subcategorías
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setChartMode('concentric');
                setHoveredSlice(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartMode === 'concentric'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Doble anillo: Categorías (anillo interior) y Subcategorías (anillo exterior)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Doble Anillo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChartMode('categories');
                setHoveredSlice(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartMode === 'categories'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Categorías</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChartMode('subcategories');
                setHoveredSlice(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartMode === 'subcategories'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Subcategorías</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChartMode('drilldown');
                setHoveredSlice(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartMode === 'drilldown'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Explorar en detalle las subcategorías de una categoría específica"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Por Categoría</span>
            </button>
          </div>
        </div>

        {/* Drilldown Category Picker (when in 'drilldown' mode) */}
        {chartMode === 'drilldown' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-400" /> Seleccionar Categoría:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categoryBreakdown.map((cat) => {
                const isSelected = selectedCatForDrilldown === cat.category.id;
                const Icon = CATEGORY_ICONS[cat.category.icon] || Tag;
                return (
                  <button
                    key={cat.category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCatForDrilldown(cat.category.id);
                      setHoveredSlice(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.category.color }}
                    />
                    <span>{cat.category.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({formatCurrency(cat.total, settings.currency)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart + Legend Container */}
        {categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Circular Chart Canvas */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px] sm:min-h-[340px]">
              <div className="w-full h-80 sm:h-88">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* Concentric Double Ring Mode */}
                    {chartMode === 'concentric' && (
                      <>
                        {/* Inner Ring: Main Categories */}
                        <Pie
                          data={categoryPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={82}
                          paddingAngle={2}
                          onMouseEnter={(data) => setHoveredSlice(data as any)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell
                              key={`cat-cell-${index}`}
                              fill={entry.color}
                              stroke="#090d16"
                              strokeWidth={2}
                              className="cursor-pointer transition-opacity hover:opacity-85"
                            />
                          ))}
                        </Pie>

                        {/* Outer Ring: Subcategories */}
                        <Pie
                          data={subcategoryPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={88}
                          outerRadius={122}
                          paddingAngle={1}
                          onMouseEnter={(data) => setHoveredSlice(data as any)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          {subcategoryPieData.map((entry, index) => (
                            <Cell
                              key={`sub-cell-${index}`}
                              fill={entry.color}
                              stroke="#090d16"
                              strokeWidth={1.5}
                              className="cursor-pointer transition-opacity hover:opacity-85"
                            />
                          ))}
                        </Pie>
                      </>
                    )}

                    {/* Single Ring: Categories Only */}
                    {chartMode === 'categories' && (
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={118}
                        paddingAngle={3}
                        onMouseEnter={(data) => setHoveredSlice(data as any)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell
                            key={`cat-only-${index}`}
                            fill={entry.color}
                            stroke="#090d16"
                            strokeWidth={2}
                            className="cursor-pointer transition-opacity hover:opacity-85"
                          />
                        ))}
                      </Pie>
                    )}

                    {/* Single Ring: Subcategories Only */}
                    {chartMode === 'subcategories' && (
                      <Pie
                        data={subcategoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={118}
                        paddingAngle={2}
                        onMouseEnter={(data) => setHoveredSlice(data as any)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        {subcategoryPieData.map((entry, index) => (
                          <Cell
                            key={`sub-only-${index}`}
                            fill={entry.color}
                            stroke="#090d16"
                            strokeWidth={1.5}
                            className="cursor-pointer transition-opacity hover:opacity-85"
                          />
                        ))}
                      </Pie>
                    )}

                    {/* Single Ring: Drilldown to Selected Category Subcategories */}
                    {chartMode === 'drilldown' && (
                      <Pie
                        data={drilldownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={118}
                        paddingAngle={2}
                        onMouseEnter={(data) => setHoveredSlice(data as any)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        {drilldownData.map((entry, index) => (
                          <Cell
                            key={`drill-cell-${index}`}
                            fill={entry.color}
                            stroke="#090d16"
                            strokeWidth={2}
                            className="cursor-pointer transition-opacity hover:opacity-85"
                          />
                        ))}
                      </Pie>
                    )}

                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[130px]">
                  {hoveredSlice ? hoveredSlice.name : chartMode === 'drilldown' ? activeDrilldownCategory?.name || 'Categoría' : 'Total Gastos'}
                </span>
                <span className="text-base sm:text-lg font-black text-white mt-0.5">
                  {formatCurrency(
                    hoveredSlice
                      ? hoveredSlice.value
                      : chartMode === 'drilldown'
                      ? drilldownData.reduce((acc, curr) => acc + curr.value, 0)
                      : totalExpense,
                    settings.currency
                  )}
                </span>
                <span className="text-[11px] font-bold text-teal-400">
                  {hoveredSlice
                    ? `${(hoveredSlice.percentage || 0).toFixed(1)}%`
                    : chartMode === 'drilldown'
                    ? `${drilldownData.length} subcategorías`
                    : `${categoryBreakdown.length} categorías`}
                </span>
              </div>
            </div>

            {/* Interactive Legend and Summary Breakdown */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
                  {chartMode === 'drilldown'
                    ? `Subcategorías de ${activeDrilldownCategory?.name || ''}`
                    : chartMode === 'subcategories'
                    ? 'Todas las Subcategorías'
                    : chartMode === 'concentric'
                    ? 'Categorías (Centro) y Subcategorías (Exterior)'
                    : 'Categorías Principales'}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {chartMode === 'concentric'
                    ? `${categoryBreakdown.length} cat. / ${subcategoryBreakdown.length} subcat.`
                    : chartMode === 'drilldown'
                    ? `${drilldownData.length} elementos`
                    : `${categoryBreakdown.length} categorías`}
                </span>
              </div>

              {/* Legend List with Scrollbar */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {chartMode === 'drilldown' ? (
                  drilldownData.length > 0 ? (
                    drilldownData.map((item, idx) => (
                      <div
                        key={item.name + idx}
                        onMouseEnter={() => setHoveredSlice(item)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                          hoveredSlice?.name === item.name
                            ? 'bg-slate-800/80 border-teal-500/50 shadow'
                            : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <div className="text-xs font-extrabold text-slate-100">
                            {formatCurrency(item.value, settings.currency)}
                          </div>
                          <div className="text-[10px] font-bold text-teal-400">
                            {item.percentage.toFixed(1)}% del grupo
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      No hay gastos en esta categoría
                    </div>
                  )
                ) : chartMode === 'subcategories' ? (
                  subcategoryPieData.map((item, idx) => (
                    <div
                      key={item.name + item.parentCategory + idx}
                      onMouseEnter={() => setHoveredSlice(item)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                        hoveredSlice?.name === item.name
                          ? 'bg-slate-800/80 border-teal-500/50 shadow'
                          : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate">
                            {item.parentCategory}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <div className="text-xs font-extrabold text-slate-100">
                          {formatCurrency(item.value, settings.currency)}
                        </div>
                        <div className="text-[10px] font-bold text-teal-400">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  categoryBreakdown.map((row) => {
                    const IconComp = CATEGORY_ICONS[row.category.icon] || Tag;
                    const subsCount = subcategoryBreakdown.filter(s => s.category.id === row.category.id).length;
                    return (
                      <div
                        key={row.category.id}
                        onMouseEnter={() =>
                          setHoveredSlice({
                            name: row.category.name,
                            value: row.total,
                            percentage: row.percentage,
                            count: row.count,
                          })
                        }
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => {
                          setSelectedCatForDrilldown(row.category.id);
                          setChartMode('drilldown');
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border group ${
                          hoveredSlice?.name === row.category.name
                            ? 'bg-slate-800/80 border-teal-500/50 shadow'
                            : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800/60'
                        }`}
                        title="Haz clic para ver las subcategorías de esta categoría"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: row.category.color }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-teal-300 transition-colors">
                              {row.category.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {subsCount} {subsCount === 1 ? 'subcategoría' : 'subcategorías'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2 flex items-center gap-2">
                          <div>
                            <div className="text-xs font-extrabold text-slate-100">
                              {formatCurrency(row.total, settings.currency)}
                            </div>
                            <div className="text-[10px] font-bold text-teal-400">
                              {row.percentage.toFixed(1)}%
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Explanatory note */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  {chartMode === 'concentric'
                    ? 'El anillo interior muestra las categorías principales y el exterior sus subcategorías. Pasa el cursor para ver detalles.'
                    : 'Pasa el cursor por cualquier porción para destacar montos y porcentajes en el centro.'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <PieIcon className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
            <span>No se encontraron registros de gastos para el período seleccionado.</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DETAILED DATA TABLE BREAKDOWN (CATEGORÍAS VS. SUBCATEGORÍAS) */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              Desglose Detallado en Tabla
            </h3>
            <p className="text-xs text-slate-400">
              Análisis cuantitativo por categorías principales y subcategorías específicas
            </p>
          </div>

          {/* Toggle Categorías vs. Subcategorías */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setBreakdownView('categorias')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                breakdownView === 'categorias'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Categorías
            </button>
            <button
              type="button"
              onClick={() => setBreakdownView('subcategorias')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                breakdownView === 'subcategorias'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Subcategorías
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {breakdownView === 'categorias' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                  <th className="pb-3 pl-2">Categoría Principal</th>
                  <th className="pb-3 text-right">Monto Total</th>
                  <th className="pb-3 text-right">Nº Compras</th>
                  <th className="pb-3 text-right">% Del Total</th>
                  <th className="pb-3 text-right pr-2">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {categoryBreakdown.map((row) => {
                  const IconComp = CATEGORY_ICONS[row.category.icon] || Tag;
                  return (
                    <tr key={row.category.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 pl-2 flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: row.category.color }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-200">{row.category.name}</span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-100">
                        {formatCurrency(row.total, settings.currency)}
                      </td>
                      <td className="py-3 text-right text-slate-400 font-semibold">
                        {row.count}
                      </td>
                      <td className="py-3 text-right text-teal-400 font-bold">
                        {row.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right pr-2 text-slate-400 font-medium">
                        {formatCurrency(row.avg, settings.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Subcategories Breakdown Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                  <th className="pb-3 pl-2">Subcategoría</th>
                  <th className="pb-3">Categoría Padre</th>
                  <th className="pb-3 text-right">Monto Total</th>
                  <th className="pb-3 text-right">Registros</th>
                  <th className="pb-3 text-right pr-2">% Gastos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {subcategoryBreakdown.map((row, idx) => {
                  return (
                    <tr key={row.category.id + row.subcategory + idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 pl-2">
                        <span className="font-bold text-slate-100 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          {row.subcategory}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        <span 
                          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${row.category.color}20`, color: row.category.color }}
                        >
                          {row.category.name}
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-100">
                        {formatCurrency(row.total, settings.currency)}
                      </td>
                      <td className="py-3 text-right text-slate-400 font-semibold">
                        {row.count}
                      </td>
                      <td className="py-3 text-right pr-2 text-teal-400 font-bold">
                        {row.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
