import { Transaction, MonthlySummary } from '../types';

export const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
  const symbolMap: Record<string, string> = {
    ARS: '$',
    USD: '$',
    MXN: '$',
    CLP: '$',
    COP: '$',
    PEN: 'S/.',
    EUR: '€',
  };

  const symbol = symbolMap[currency] || '$';
  
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getMonthName = (yearMonth: string): string => {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
};

export const calculateMonthlyStats = (transactions: Transaction[]): MonthlySummary[] => {
  const monthsMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach((tx) => {
    const monthKey = tx.date.substring(0, 7); // 'YYYY-MM'
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, { income: 0, expense: 0 });
    }

    const current = monthsMap.get(monthKey)!;
    if (tx.type === 'ingreso') {
      current.income += tx.amount;
    } else {
      current.expense += tx.amount;
    }
  });

  // Sort months chronologically
  const sortedKeys = Array.from(monthsMap.keys()).sort();

  return sortedKeys.map((monthKey) => {
    const data = monthsMap.get(monthKey)!;
    const realSavings = data.income - data.expense;
    const savingsRate = data.income > 0 ? Math.max(0, (realSavings / data.income) * 100) : 0;

    return {
      monthKey,
      monthName: getMonthName(monthKey),
      income: data.income,
      expense: data.expense,
      realSavings,
      savingsRate: Number(savingsRate.toFixed(1)),
    };
  });
};
