import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { playDeleteSound, playTapSound } from '../utils/audio';

export interface DeleteTargetInfo {
  type: 'PREORDER' | 'TRANSACTION';
  id: string;
  customerName: string;
  itemsSummary: string;
  total: number;
  time: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  target: DeleteTargetInfo | null;
  onConfirmDelete: (target: DeleteTargetInfo) => void;
}

export const StrictDeleteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  target,
  onConfirmDelete,
}) => {
  const [typedKeyword, setTypedKeyword] = useState('');
  const [agreedCheckbox, setAgreedCheckbox] = useState(false);

  // Reset inputs when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setTypedKeyword('');
      setAgreedCheckbox(false);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const isKeywordMatched = typedKeyword.trim().toUpperCase() === 'HAPUS';
  const isDeleteAllowed = isKeywordMatched && agreedCheckbox;

  const handleExecuteDelete = () => {
    if (!isDeleteAllowed) return;
    playDeleteSound();
    onConfirmDelete(target);
    onClose();
  };

  const handleCancel = () => {
    playTapSound();
    onClose();
  };

  const typeLabel = target.type === 'PREORDER' ? 'Pesanan Pre-order' : 'Transaksi Penjualan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Alert */}
        <div className="p-4 sm:p-5 border-b border-red-100 bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-red-950 text-base sm:text-lg">
                Konfirmasi Hapus Ketat
              </h3>
              <p className="text-xs text-red-700 font-semibold">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-full bg-white hover:bg-red-100 flex items-center justify-center text-slate-500 hover:text-red-700 transition-colors border border-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Detail yang akan dihapus */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Jenis Data:</span>
              <span className="font-bold text-red-600">{typeLabel}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500 font-medium">ID Data:</span>
              <span className="font-mono font-bold">{target.id}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500 font-medium">Nama Pelanggan:</span>
              <span className="font-black text-slate-900">{target.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500 font-medium">Rincian Barang:</span>
              <span className="font-semibold text-right max-w-[200px] truncate">{target.itemsSummary}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 text-slate-900">
              <span className="text-slate-500 font-medium">Total Nilai:</span>
              <span className="font-black text-base text-red-600">
                Rp {target.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Data yang dihapus akan dihilangkan dari pencatatan lokal dan laporan kasir. Pastikan Anda tidak salah menghapus pesanan orang lain.
            </p>
          </div>

          {/* Persetujuan 1: Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={agreedCheckbox}
              onChange={(e) => setAgreedCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-800 leading-tight">
              Saya benar-benar yakin ingin menghapus data {typeLabel.toLowerCase()} ini secara permanen.
            </span>
          </label>

          {/* Persetujuan 2: Ketik "HAPUS" */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Ketik kata <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-black">HAPUS</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              value={typedKeyword}
              onChange={(e) => setTypedKeyword(e.target.value)}
              placeholder="Ketik HAPUS di sini..."
              className={`w-full px-3 py-2 text-sm font-bold rounded-xl border transition-all uppercase placeholder:normal-case ${
                isKeywordMatched
                  ? 'border-red-500 ring-2 ring-red-200 bg-red-50/50 text-red-900'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
          >
            Batal (Amankan)
          </button>

          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={!isDeleteAllowed}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              isDeleteAllowed
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Permanen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
