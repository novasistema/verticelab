import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  RotateCcw, 
  Tag, 
  Layers, 
  UtensilsCrossed, 
  HeartPulse, 
  Receipt, 
  PartyPopper, 
  Bus, 
  Home, 
  Wallet, 
  TrendingUp, 
  Zap, 
  MoreHorizontal,
  FolderPlus
} from 'lucide-react';
import { Category, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from '../data/categories';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  UtensilsCrossed,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Wallet,
  TrendingUp,
  Zap,
  MoreHorizontal,
};

const COLOR_OPTIONS = [
  '#10b981', '#ec4899', '#ef4444', '#f59e0b', '#3b82f6', 
  '#8b5cf6', '#6366f1', '#14b8a6', '#06b6d4', '#64748b', '#e11d48'
];

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
}) => {
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || 'comida');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [editingSubcatIdx, setEditingSubcatIdx] = useState<number | null>(null);
  const [editingSubcatText, setEditingSubcatText] = useState('');

  // New Category State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('gasto');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatInitialSubcat, setNewCatInitialSubcat] = useState('');

  if (!isOpen) return null;

  const currentCategory = categoryList.find(c => c.id === selectedCatId) || categoryList[0];

  const handleAddSubcategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubcatName.trim();
    if (!trimmed || !currentCategory) return;

    if (currentCategory.subcategories.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSubcatName('');
      return;
    }

    const updated = categoryList.map(cat => {
      if (cat.id === currentCategory.id) {
        return {
          ...cat,
          subcategories: [...cat.subcategories, trimmed],
        };
      }
      return cat;
    });

    setCategoryList(updated);
    onSaveCategories(updated);
    setNewSubcatName('');
  };

  const handleDeleteSubcategory = (subcatToRemove: string) => {
    if (!currentCategory) return;
    const updated = categoryList.map(cat => {
      if (cat.id === currentCategory.id) {
        return {
          ...cat,
          subcategories: cat.subcategories.filter(s => s !== subcatToRemove),
        };
      }
      return cat;
    });

    setCategoryList(updated);
    onSaveCategories(updated);
  };

  const handleStartEditSubcat = (index: number, currentText: string) => {
    setEditingSubcatIdx(index);
    setEditingSubcatText(currentText);
  };

  const handleSaveEditSubcat = () => {
    if (editingSubcatIdx === null || !currentCategory) return;
    const trimmed = editingSubcatText.trim();
    if (!trimmed) {
      setEditingSubcatIdx(null);
      return;
    }

    const updated = categoryList.map(cat => {
      if (cat.id === currentCategory.id) {
        const nextSubcats = [...cat.subcategories];
        nextSubcats[editingSubcatIdx] = trimmed;
        return {
          ...cat,
          subcategories: nextSubcats,
        };
      }
      return cat;
    });

    setCategoryList(updated);
    onSaveCategories(updated);
    setEditingSubcatIdx(null);
    setEditingSubcatText('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;

    const newId = 'custom-' + Date.now();
    const initialSubcats = newCatInitialSubcat.trim()
      ? newCatInitialSubcat.split(',').map(s => s.trim()).filter(Boolean)
      : ['General'];

    const newCat: Category = {
      id: newId,
      name: trimmedName,
      icon: newCatIcon,
      color: newCatColor,
      defaultType: newCatType,
      subcategories: initialSubcats.length > 0 ? initialSubcats : ['General'],
      isCustom: true,
    };

    const nextList = [...categoryList, newCat];
    setCategoryList(nextList);
    onSaveCategories(nextList);
    setSelectedCatId(newId);
    setIsCreatingCategory(false);
    setNewCatName('');
    setNewCatInitialSubcat('');
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar las categorías y subcategorías a sus valores recomendados por defecto?')) {
      setCategoryList(DEFAULT_CATEGORIES);
      onSaveCategories(DEFAULT_CATEGORIES);
      setSelectedCatId(DEFAULT_CATEGORIES[0].id);
    }
  };

  const IconComponent = CATEGORY_ICONS[currentCategory?.icon || ''] || Tag;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Gestión de Categorías y Subcategorías
              </h3>
              <p className="text-xs text-slate-400">
                Organiza tus gastos en Comida, Salud, Transporte, Impuestos, Ocio y más
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Column Categories, Right Column Subcategories */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[360px]">
          {/* Categories Sidebar / Left list */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1">
                Categorías Principales
              </div>
              {categoryList.map(cat => {
                const CatIcon = CATEGORY_ICONS[cat.icon] || Tag;
                const isSelected = cat.id === currentCategory?.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setIsCreatingCategory(false);
                      setEditingSubcatIdx(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-slate-800 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 text-[10px]"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CatIcon className="w-3 h-3" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cat.subcategories.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 mt-2 border-t border-slate-800/80 space-y-1.5">
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="w-full py-2 px-2.5 rounded-xl border border-dashed border-slate-700 hover:border-teal-500/50 hover:bg-teal-500/5 text-slate-300 hover:text-teal-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Nueva Categoría
              </button>

              <button
                onClick={handleResetDefaults}
                className="w-full py-1.5 text-[11px] text-slate-500 hover:text-slate-400 transition flex items-center justify-center gap-1"
                title="Restaurar a valores recomendados"
              >
                <RotateCcw className="w-3 h-3" />
                Valores por defecto
              </button>
            </div>
          </div>

          {/* Right Panel: Subcategories management for selected category */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-900 flex flex-col justify-between">
            {!isCreatingCategory ? (
              <div className="space-y-5">
                {/* Current Category Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                      style={{ backgroundColor: currentCategory?.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                        {currentCategory?.name}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          currentCategory?.defaultType === 'ingreso'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        }`}>
                          {currentCategory?.defaultType}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {currentCategory?.subcategories.length} subcategorías disponibles para clasificar registros
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategory Add Form */}
                <form onSubmit={handleAddSubcategory} className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Agregar Nueva Subcategoría en {currentCategory?.name}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      placeholder={`Ej: ${currentCategory?.id === 'comida' ? 'Supermercado, Restaurantes, Delivery...' : currentCategory?.id === 'salud' ? 'Farmacia, Médico, Dentista...' : currentCategory?.id === 'transporte' ? 'Gasolina, Público, Peajes...' : 'Nombre de la subcategoría'}`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!newSubcatName.trim()}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </form>

                {/* List of Subcategories */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Subcategorías Activas
                  </label>

                  {currentCategory?.subcategories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                      No hay subcategorías registradas en esta categoría. Escribe una arriba para crearla.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCategory?.subcategories.map((subcat, idx) => {
                        const isEditing = editingSubcatIdx === idx;

                        return (
                          <div
                            key={subcat + idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition group"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingSubcatText}
                                  onChange={(e) => setEditingSubcatText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditSubcat();
                                    if (e.key === 'Escape') setEditingSubcatIdx(null);
                                  }}
                                  className="flex-1 bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditSubcat}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950 rounded"
                                  title="Guardar"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubcatIdx(null)}
                                  className="p-1 text-slate-500 hover:bg-slate-800 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 truncate">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: currentCategory.color }}
                                  />
                                  <span className="text-xs font-semibold text-slate-200 truncate">
                                    {subcat}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSubcat(idx, subcat)}
                                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                                    title="Editar nombre de la subcategoría"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubcategory(subcat)}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                                    title="Eliminar subcategoría"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Create New Custom Category Form */
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-teal-400" />
                    Crear Nueva Categoría Personalizada
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Volver
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                      Nombre de la Categoría
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej: Mascotas, Educación, Seguros..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                      Tipo
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setNewCatType('gasto')}
                        className={`py-1 text-xs font-bold rounded-lg transition ${
                          newCatType === 'gasto'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatType('ingreso')}
                        className={`py-1 text-xs font-bold rounded-lg transition ${
                          newCatType === 'ingreso'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ingreso
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    Color Representativo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`w-7 h-7 rounded-lg transition border-2 ${
                          newCatColor === c ? 'border-white scale-110 shadow' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                    Subcategorías Iniciales (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={newCatInitialSubcat}
                    onChange={(e) => setNewCatInitialSubcat(e.target.value)}
                    placeholder="Ej: Veterinaria, Alimento, Accesorios"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-slate-800 mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
