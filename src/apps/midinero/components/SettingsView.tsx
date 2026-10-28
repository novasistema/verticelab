import React from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Moon, 
  Sun, 
  Bell, 
  RefreshCw, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check,
  Layers,
  Tag,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  onClearAllData?: () => void;
  onOpenCategoriesModal?: () => void;
  userEmail?: string;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
  onClearAllData,
  onOpenCategoriesModal,
  userEmail,
  onLogout,
}) => {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-teal-400" /> Configuración de la Aplicación
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Personaliza moneda, categorías y subcategorías, alertas, tema y copias de seguridad
        </p>
      </div>

      {/* User Session & License Card */}
      {userEmail && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E3A82B]/10 text-[#E3A82B] border border-[#E3A82B]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Sesión Activa</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Licencia Activa
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">{userEmail}</p>
              <p className="text-[11px] text-slate-400">Vértice Lab • Mi Dinero (app_slug: midinero)</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 transition flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          )}
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs">
          Preferencia de Divisa & Apariencia
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Moneda Principal</label>
            <select
              value={settings.currency}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  currency: e.target.value,
                  currencySymbol: e.target.value === 'EUR' ? '€' : e.target.value === 'PEN' ? 'S/.' : '$',
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ARS">Peso Argentino ($ ARS)</option>
              <option value="USD">Dólar ($ USD)</option>
              <option value="MXN">Peso Mexicano ($ MXN)</option>
              <option value="COP">Peso Colombiano ($ COP)</option>
              <option value="CLP">Peso Chileno ($ CLP)</option>
              <option value="EUR">Euro (€ EUR)</option>
              <option value="PEN">Sol Peruano (S/. PEN)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Modo de Color</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                  settings.theme === 'dark'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" /> Modo Oscuro
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                  settings.theme === 'light'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" /> Modo Claro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Subcategories Quick Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" /> Clasificación y Subcategorías Personalizadas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra las subcategorías en Comida, Salud, Transporte, Impuestos, Ocio y crea nuevas categorías
            </p>
          </div>

          {onOpenCategoriesModal && (
            <button
              onClick={onOpenCategoriesModal}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Tag className="w-3.5 h-3.5" />
              Gestionar Subcategorías
            </button>
          )}
        </div>
      </div>

      {/* Budget Alerts Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" /> Alertas de Presupuesto Excedido
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-200">Activar Alertas de Límite</p>
            <p className="text-xs text-slate-400">Notificar en pantalla al acercarse o superar presupuestos</p>
          </div>
          <input
            type="checkbox"
            checked={settings.enableAlerts}
            onChange={(e) => onUpdateSettings({ ...settings, enableAlerts: e.target.checked })}
            className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Umbral de Alerta Temprana (% del Presupuesto)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="50"
              max="100"
              value={settings.budgetAlertThreshold}
              onChange={(e) =>
                onUpdateSettings({ ...settings, budgetAlertThreshold: parseInt(e.target.value, 10) })
              }
              className="flex-1 accent-teal-500"
            />
            <span className="text-sm font-bold text-teal-400 w-12 text-right">
              {settings.budgetAlertThreshold}%
            </span>
          </div>
        </div>
      </div>

      {/* Backup & Data Sync Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-teal-400" /> Copia de Seguridad & Gestión de Datos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            id="btn-export-json"
            onClick={onExportData}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Descargar Copia JSON
          </button>

          <label
            id="btn-import-json"
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            Restaurar Copia JSON
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>

          <button
            id="btn-reset-factory-data"
            onClick={onResetData}
            className="p-3 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            title="Restablece datos de muestra de fábrica con moneda y categorías predeterminadas"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer Datos de Fábrica
          </button>

          {onClearAllData && (
            <button
              id="btn-clear-all-data-scratch"
              onClick={onClearAllData}
              className="p-3 bg-rose-950/40 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              title="Elimina todos los datos existentes para empezar completamente vacío desde cero"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Borrar Todo / Empezar de Cero
            </button>
          )}
        </div>
      </div>

      {/* Brand & App Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 sm:w-28 rounded-2xl overflow-hidden shadow-lg border border-teal-500/30 bg-slate-950 shrink-0">
          <img
            src="/assets/aistudio/logo_control_0bd5bb22.jpg"
            alt="CONTROL Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xl sm:text-2xl font-black text-white tracking-wider">
              CONTROL
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase border border-teal-500/30">
              v2.5 Oficial
            </span>
          </div>
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Finanzas Personales
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plataforma integral para administrar tus finanzas personales, billeteras virtuales y cuentas bancarias, presupuestos por categorías y subcategorías, metas de ahorro e inversiones, e informes detallados.
          </p>
        </div>
      </div>
    </div>
  );
};
