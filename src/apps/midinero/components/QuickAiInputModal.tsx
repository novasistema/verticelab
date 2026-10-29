import React, { useRef, useState } from 'react';
import { Sparkles, Camera, X, Check, Loader2, UploadCloud } from 'lucide-react';
import { Transaction, CategoryId, PaymentMethod, TransactionType } from '../types';
import { CATEGORIES } from '../data/categories';

import { supabase } from '../../../platform/supabase';

interface QuickAiInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const QuickAiInputModal: React.FC<QuickAiInputModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedTx, setDetectedTx] = useState<Omit<Transaction, 'id'> | null>(null);
  const [fromAi, setFromAi] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Llama a la función segura del servidor (/api/gemini). Devuelve null si no se pudo.
  const askAi = async (payload: { prompt?: string; imageBase64?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return null;
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ app: 'midinero', ...payload }),
    });
    if (!response.ok) return null;
    const resJson = await response.json();
    const d = resJson?.data;
    if (!d || !Number(d.amount)) return null;
    return {
      type: d.type === 'ingreso' ? 'ingreso' : 'gasto',
      amount: Number(d.amount) || 0,
      categoryId: CATEGORIES.some((c) => c.id === d.categoryId) ? d.categoryId : 'otros',
      description: d.description || payload.prompt || 'Ticket escaneado',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: d.paymentMethod || 'tarjeta',
      notes: d.notes || 'Analizado con IA',
    } as Omit<Transaction, 'id'>;
  };

  // Achica la foto antes de enviarla (más rápido y dentro del límite del servidor).
  const imageToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('imagen'));
      };
      img.src = url;
    });

  const fallbackLocalParser = (text: string) => {
    const lower = text.toLowerCase();
    
    // Determine Type
    let type: TransactionType = 'gasto';
    if (lower.includes('ingreso') || lower.includes('cobro') || lower.includes('salario') || lower.includes('nomina') || lower.includes('bonus') || lower.includes('venta')) {
      type = 'ingreso';
    }

    // Extract Amount
    // Acepta formatos como 12500, 12.500, 12.500,50 o 18.50
    const amountMatch = text.match(/\d[\d.,]*/);
    let amount = 0;
    if (amountMatch) {
      let raw = amountMatch[0].replace(/[.,]$/, '');
      if (raw.includes(',') && raw.includes('.')) raw = raw.replace(/\./g, '').replace(',', '.');
      else if (raw.includes(',')) raw = /,\d{3}$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
      else if (/\.\d{3}(\.|$)/.test(raw)) raw = raw.replace(/\./g, '');
      amount = parseFloat(raw) || 0;
    }

    // Determine Category
    let categoryId: CategoryId = 'otros';
    if (lower.includes('super') || lower.includes('mercadona') || lower.includes('carrefour') || lower.includes('comida') || lower.includes('compra')) {
      categoryId = 'supermercado';
    } else if (lower.includes('farmacia') || lower.includes('medicina') || lower.includes('salud') || lower.includes('pastillas')) {
      categoryId = 'farmacia';
    } else if (lower.includes('impuesto') || lower.includes('irpf') || lower.includes('tasas') || lower.includes('autonomo') || lower.includes('hacienda')) {
      categoryId = 'impuestos';
    } else if (lower.includes('ocio') || lower.includes('cine') || lower.includes('cena') || lower.includes('bar') || lower.includes('restaurante') || lower.includes('fiesta')) {
      categoryId = 'ocio';
    } else if (lower.includes('transporte') || lower.includes('gasolina') || lower.includes('metro') || lower.includes('bus') || lower.includes('uber') || lower.includes('taxi')) {
      categoryId = 'transporte';
    } else if (lower.includes('alquiler') || lower.includes('luz') || lower.includes('agua') || lower.includes('gas') || lower.includes('piso')) {
      categoryId = 'vivienda';
    } else if (type === 'ingreso' && (lower.includes('nomina') || lower.includes('salario') || lower.includes('trabajo'))) {
      categoryId = 'salario';
    } else if (type === 'ingreso' && (lower.includes('invers') || lower.includes('dividend') || lower.includes('interes'))) {
      categoryId = 'inversiones';
    }

    // Payment method
    let paymentMethod: PaymentMethod = 'tarjeta';
    if (lower.includes('bizum')) paymentMethod = 'bizum';
    else if (lower.includes('efectivo') || lower.includes('cash')) paymentMethod = 'efectivo';
    else if (lower.includes('transferencia') || lower.includes('banco')) paymentMethod = 'transferencia';

    const today = new Date().toISOString().split('T')[0];

    return {
      type,
      amount,
      categoryId,
      description: text,
      date: today,
      paymentMethod,
      notes: 'Analizado con el asistente inteligente IA',
    };
  };

  const handleParseText = async () => {
    if (!inputText.trim()) return;
    setError('');
    setIsProcessing(true);
    try {
      const tx = await askAi({ prompt: inputText });
      if (tx) {
        setFromAi(true);
        setDetectedTx(tx);
        setIsProcessing(false);
        return;
      }
    } catch {
      // sin conexión con la IA: seguimos con el analizador local
    }
    setFromAi(false);
    setDetectedTx(fallbackLocalParser(inputText));
    setIsProcessing(false);
  };

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setIsProcessing(true);
    try {
      const imageBase64 = await imageToBase64(file);
      const tx = await askAi({
        imageBase64,
        prompt: 'Analiza este ticket o comprobante de compra y extrae el total pagado y el comercio.',
      });
      if (tx) {
        setFromAi(true);
        setDetectedTx(tx);
      } else {
        setError('No pudimos leer el ticket. Probá con una foto más nítida y con buena luz, o escribí el gasto.');
      }
    } catch {
      setError('No pudimos procesar la imagen. Probá de nuevo o escribí el gasto.');
    }
    setIsProcessing(false);
  };

  const handleConfirm = () => {
    if (detectedTx) {
      onAddTransaction(detectedTx);
      onClose();
      setDetectedTx(null);
      setInputText('');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Registro Rápido con IA</h3>
              <p className="text-xs text-slate-400">Escribe en lenguaje natural o sube un ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!detectedTx ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Escribe lo que gastaste o ingresaste:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ej: Gasté $12.500 en el supermercado con tarjeta..."
                  className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleParseText}
                  disabled={!inputText.trim() || isProcessing}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Procesar Texto
                    </>
                  )}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleReceiptFile}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isProcessing}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition flex items-center gap-2 border border-slate-700"
                  title="Sacar o subir una foto del ticket"
                >
                  <Camera className="w-4 h-4 text-teal-400" />
                  Escanear Ticket
                </button>
              </div>

              {error && (
                <p role="alert" className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3">
                  {error}
                </p>
              )}

              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <p className="text-xs font-semibold text-slate-400 mb-1">Ejemplos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '$4200 supermercado en tarjeta',
                    'Pago impuestos $18000',
                    'Cena ocio $2500 transferencia',
                    'Farmacia $1230',
                    'Cobré el sueldo $850000',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(example)}
                      className="text-[11px] bg-slate-800/80 hover:bg-teal-900/40 text-slate-300 hover:text-teal-300 px-2.5 py-1 rounded-lg border border-slate-700/50 transition"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-teal-950/30 border border-teal-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-teal-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> {fromAi ? 'Datos detectados con IA' : 'Revisá los datos antes de guardar'}
                  </span>
                  <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20">
                    {detectedTx.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-400">Monto:</span>
                    <p className="text-lg font-bold text-slate-100">$ {detectedTx.amount.toFixed(2)}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Categoría:</span>
                    <p className="text-sm font-semibold text-slate-200 capitalize">
                      {CATEGORIES.find((c) => c.id === detectedTx.categoryId)?.name}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-slate-400">Concepto:</span>
                    <p className="text-sm text-slate-200">{detectedTx.description}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Método de Pago:</span>
                    <p className="text-sm text-slate-200 capitalize">{detectedTx.paymentMethod}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Fecha:</span>
                    <p className="text-sm text-slate-200">{detectedTx.date}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetectedTx(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Volver a Editar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar Registro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
