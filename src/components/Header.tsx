import React from 'react';
import { User } from 'firebase/auth';
import { 
  Store, 
  FileSpreadsheet, 
  Volume2, 
  VolumeX, 
  History, 
  BarChart3, 
  ShoppingCart, 
  ClipboardList,
  ExternalLink, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Settings 
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SpreadsheetInfo } from '../services/sheetsService';

interface Props {
  activeTab: 'pos' | 'preorder' | 'history' | 'report';
  setActiveTab: (tab: 'pos' | 'preorder' | 'history' | 'report') => void;
  user: User | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  spreadsheet: SpreadsheetInfo | null;
  hasWebhook?: boolean;
  isSyncing: boolean;
  offlineQueueCount: number;
  preorderCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  openSettings: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  user,
  authLoading,
  onSignIn,
  onSignOut,
  spreadsheet,
  hasWebhook,
  isSyncing,
  offlineQueueCount,
  preorderCount,
  soundEnabled,
  toggleSound,
  openSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  Kasir Kilat POS
                </h1>
                <span className="text-[11px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Fast Touch
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Churros • Rice Bowl • Lemon Tea • Paket Hemat
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeTab === 'pos'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir</span>
            </button>
            <button
              onClick={() => setActiveTab('preorder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all relative ${
                activeTab === 'preorder'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Pre-order</span>
              {preorderCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {preorderCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeTab === 'report'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan</span>
            </button>
          </nav>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2">
            {/* Google Sheets Status Pill */}
            {hasWebhook ? (
              <div className="hidden lg:flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Auto-Sync Webhook</span>
                {spreadsheet && (
                  <a
                    href={spreadsheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-1 text-emerald-700 hover:text-emerald-950 font-bold hover:underline"
                    title="Buka Spreadsheet di Tab Baru"
                  >
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            ) : user && spreadsheet ? (
              <div className="hidden lg:flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Sheets Terhubung</span>
                <a
                  href={spreadsheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center ml-1 text-emerald-700 hover:text-emerald-950 font-bold hover:underline"
                  title="Buka Spreadsheet di Tab Baru"
                >
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={openSettings}
                className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full font-medium transition-colors"
                title="Buka Pengaturan Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Sheet Siap</span>
              </button>
            )}

            {/* Offline queue warning */}
            {offlineQueueCount > 0 && (
              <button
                onClick={openSettings}
                className="flex items-center gap-1 text-xs bg-amber-500 text-white font-bold px-2.5 py-1 rounded-full animate-pulse shadow-xs"
                title={`${offlineQueueCount} transaksi antre untuk disinkronkan ke Google Sheets`}
              >
                <span>{offlineQueueCount} Antrean</span>
              </button>
            )}

            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={soundEnabled ? 'Matikan Suara Klik' : 'Nyalakan Suara Klik'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={openSettings}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Pengaturan Google Sheets & Database"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Google Auth Button */}
            <GoogleSignInButton
              user={user}
              loading={authLoading}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
