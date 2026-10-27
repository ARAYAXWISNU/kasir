import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Database,
  CloudUpload,
  Copy,
  ChevronDown,
  ChevronUp,
  Link2,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { 
  SpreadsheetInfo, 
  TARGET_SPREADSHEET_ID, 
  TARGET_SPREADSHEET_URL,
  TARGET_SPREADSHEET_TITLE,
  getStoredWebhookUrl, 
  setStoredWebhookUrl, 
  testWebhookConnection 
} from '../services/sheetsService';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/appsScriptCode';
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
  onWebhookUpdated?: (url: string) => void;
}

export const SheetsSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  spreadsheet,
  onSyncOfflineQueue,
  offlineQueueCount,
  isSyncing,
  onGoogleSignIn,
  onWebhookUpdated,
}) => {
  const [webhookInput, setWebhookInput] = useState(() => getStoredWebhookUrl());
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTestWebhook = async () => {
    const trimmed = webhookInput.trim();
    if (!trimmed) {
      setStoredWebhookUrl('');
      if (onWebhookUpdated) onWebhookUpdated('');
      setStatusMsg({ text: 'Webhook URL dikosongkan. Pengiriman via webhook dimatikan.', type: 'success' });
      return;
    }

    setTestingWebhook(true);
    setStatusMsg(null);
    try {
      const result = await testWebhookConnection(trimmed);
      if (result.ok) {
        setStoredWebhookUrl(trimmed);
        if (onWebhookUpdated) onWebhookUpdated(trimmed);
        setStatusMsg({ 
          text: 'Webhook berhasil disimpan dan terhubung! Sekarang SEMUA pembayaran dari HP / PC / akun mana pun otomatis masuk ke Google Sheet target.', 
          type: 'success' 
        });
      } else {
        setStatusMsg({ text: result.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Gagal menghubungi Webhook', type: 'error' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSyncOffline = async () => {
    setLoadingAction(true);
    setStatusMsg(null);
    try {
      await onSyncOfflineQueue();
      setStatusMsg({ text: 'Semua antrean offline berhasil disinkronkan ke Google Sheets!', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Gagal menyinkronkan antrean', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  const currentSheetId = spreadsheet?.id || TARGET_SPREADSHEET_ID;
  const currentSheetUrl = spreadsheet?.url || TARGET_SPREADSHEET_URL;
  const hasActiveWebhook = Boolean(getStoredWebhookUrl());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Sinkronisasi Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Otomatis masuk tanpa kecuali (beda akun & beda perangkat)
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
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMsg.text}</span>
            </div>
          )}

          {/* Target Spreadsheet Info Box (LOCKED to TARGET_SPREADSHEET_ID) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Target Spreadsheet Utama
              </span>
              <a
                href={currentSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/80 space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {TARGET_SPREADSHEET_TITLE}
                </h4>
              </div>
              <p className="text-[11px] font-mono text-slate-500 break-all pl-6">
                ID: {currentSheetId}
              </p>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Semua transaksi pembayaran sukses otomatis disalurkan ke tab <span className="font-bold">Transaksi</span> di Google Sheet ini.
            </p>
          </div>

          {/* Webhook Google Apps Script Section */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Webhook Universal (Semua Perangkat & Akun)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kirim data langsung tanpa harus login akun Google di setiap HP/PC kasir
                  </p>
                </div>
              </div>
              {hasActiveWebhook ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  AKTIF
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200">
                  OPSIONAL
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                URL Google Apps Script Web App:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white font-mono"
                  />
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleSaveAndTestWebhook}
                  disabled={testingWebhook}
                  className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors disabled:bg-slate-300 shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  {testingWebhook ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <span>Simpan & Tes</span>
                  )}
                </button>
              </div>
            </div>

            {/* Toggle Panduan Pasang */}
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between text-xs font-bold text-orange-700 hover:text-orange-800 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Cara Pasang Google Apps Script (Hanya 1 Menit)
                </span>
                {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showGuide && (
                <div className="mt-3 p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3 text-xs text-slate-700">
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed font-medium">
                    <li>
                      Buka Google Sheet:{' '}
                      <a
                        href={currentSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-700 underline font-bold"
                      >
                        {TARGET_SPREADSHEET_TITLE}
                      </a>
                    </li>
                    <li>
                      Di menu atas Google Sheets, klik <span className="font-bold">Ekstensi (Extensions) &gt; Apps Script</span>.
                    </li>
                    <li>
                      Hapus semua kode di sana, lalu klik tombol di bawah ini untuk menyalin kode Webhook Kasir:
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleCopyScript}
                          className="px-3 py-1.5 bg-white border border-orange-300 hover:bg-orange-100 text-orange-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          {copiedScript ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kode Berhasil Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Kode Apps Script Kasir</span>
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                    <li>
                      Tempel (Paste) kode tadi ke editor Apps Script, lalu klik <span className="font-bold">Simpan (Ctrl+S)</span>.
                    </li>
                    <li>
                      Klik tombol biru <span className="font-bold">Terapkan (Deploy) &gt; Penerapan baru (New deployment)</span>.
                    </li>
                    <li>
                      Pilih jenis <span className="font-bold">Aplikasi Web (Web app)</span>:
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600">
                        <li>Jalankan sebagai (Execute as): <span className="font-semibold text-slate-800">Saya (Me)</span></li>
                        <li>Akses (Who has access): <span className="font-bold text-orange-700">Siapa saja (Anyone)</span></li>
                      </ul>
                    </li>
                    <li>
                      Klik <span className="font-bold">Terapkan</span>, berikan izin akses jika diminta, lalu salin URL Aplikasi Web (/exec) dan tempelkan ke kolom Webhook di atas.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* User Auth Status (OAuth Alternative) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Koneksi Akun Google (OAuth):
            </span>
            {!user ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Jika tidak menggunakan Webhook, Anda dapat masuk dengan akun Google untuk sinkronisasi via Google Sheets API resmi.
                </p>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-2xs text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                  <span>Masuk dengan Google</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-600">Akun Login:</span>
                <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {user.email}
                </span>
              </div>
            )}
          </div>

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
                Ada {offlineQueueCount} transaksi yang menunggu untuk disinkronkan ke Google Sheet target.
              </p>
              <button
                type="button"
                onClick={handleSyncOffline}
                disabled={loadingAction || isSyncing}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:bg-slate-300 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction ? 'animate-spin' : ''}`} />
                <span>Kirim Semua Antrean ke Google Sheets</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-xs text-white transition-colors shadow-xs"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
