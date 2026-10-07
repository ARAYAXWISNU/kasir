import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Database,
  CloudUpload
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheetsService';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  spreadsheet: SpreadsheetInfo | null;
  onCreateNewSheet: (title?: string) => Promise<void>;
  onConnectExistingSheet: (id: string) => Promise<void>;
  onSyncOfflineQueue: () => Promise<void>;
  offlineQueueCount: number;
  isSyncing: boolean;
  onGoogleSignIn: () => void;
}

export const SheetsSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  spreadsheet,
  onCreateNewSheet,
  onConnectExistingSheet,
  onSyncOfflineQueue,
  offlineQueueCount,
  isSyncing,
  onGoogleSignIn,
}) => {
  const [customSheetId, setCustomSheetId] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!user) {
      onGoogleSignIn();
      return;
    }
    setLoadingAction(true);
    setStatusMsg(null);
    try {
      await onCreateNewSheet(newSheetTitle || undefined);
      setStatusMsg({ text: 'Google Spreadsheet berhasil dibuat!', type: 'success' });
      setNewSheetTitle('');
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Gagal membuat spreadsheet', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!customSheetId.trim()) return;
    setLoadingAction(true);
    setStatusMsg(null);
    try {
      await onConnectExistingSheet(customSheetId.trim());
      setStatusMsg({ text: 'Spreadsheet berhasil dihubungkan!', type: 'success' });
      setCustomSheetId('');
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Gagal menemukan spreadsheet', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSyncOffline = async () => {
    setLoadingAction(true);
    setStatusMsg(null);
    try {
      await onSyncOfflineQueue();
      setStatusMsg({ text: 'Semua antrean offline berhasil disinkronkan!', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Gagal menyinkronkan antrean', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                Pengaturan Database Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Integrasi otomatis pencatatan kasir & laporan harian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* User Auth Status */}
          {!user ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-3">
              <p className="font-bold text-amber-900">
                Akun Google belum terhubung
              </p>
              <p className="text-amber-700 leading-relaxed">
                Silakan masuk dengan akun Google Anda terlebih dahulu untuk membuat dan mengelola spreadsheet otomatis di Google Drive Anda.
              </p>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Masuk dengan Google Sekarang
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">Akun Terhubung:</span>
                <span className="bg-white text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          {/* Current Active Spreadsheet */}
          {spreadsheet ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Spreadsheet Aktif:</span>
                <a
                  href={spreadsheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{spreadsheet.title}</span>
                </h4>
                <p className="text-[11px] font-mono text-slate-400 break-all">
                  ID: {spreadsheet.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
              Belum ada Google Spreadsheet yang terhubung. Silakan buat spreadsheet baru di bawah ini.
            </div>
          )}

          {/* Offline Sync Queue */}
          {offlineQueueCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <CloudUpload className="w-4 h-4 text-blue-600" />
                  <span>Antrean Transaksi Offline ({offlineQueueCount})</span>
                </div>
              </div>
              <p className="text-[11px] text-blue-700">
                Ada {offlineQueueCount} transaksi yang dicatat saat offline atau sebelum login. Anda dapat langsung mengirimkannya ke Google Sheets.
              </p>
              <button
                type="button"
                onClick={handleSyncOffline}
                disabled={loadingAction || isSyncing || !user}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:bg-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction ? 'animate-spin' : ''}`} />
                <span>Kirim Semua Antrean ke Google Sheets</span>
              </button>
            </div>
          )}

          {/* Create New Spreadsheet Form */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="block text-xs font-bold text-slate-800">
                Buat Spreadsheet Baru untuk Kasir:
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Nama Spreadsheet (Opsional)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loadingAction}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:bg-slate-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Spreadsheet Kasir Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* Connect by Existing ID */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="block text-xs font-bold text-slate-800">
                Atau Hubungkan ID Spreadsheet yang Sudah Ada:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  placeholder="Tempel Spreadsheet ID di sini..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleConnectExisting}
                  disabled={loadingAction || !customSheetId.trim()}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors disabled:bg-slate-300"
                >
                  Hubungkan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
