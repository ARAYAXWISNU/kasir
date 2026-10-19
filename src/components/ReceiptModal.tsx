import React, { useState } from 'react';
import { Transaction } from '../types/pos';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  PlusCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Store 
} from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onNewOrder: () => void;
  sheetUrl?: string;
}

export const ReceiptModal: React.FC<Props> = ({
  isOpen,
  transaction,
  onClose,
  onNewOrder,
  sheetUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
=================================
       KASIR KILAT RESTO
=================================
No. Transaksi : ${transaction.id}
Waktu         : ${transaction.displayTime}
Pelanggan     : ${transaction.customerName}
---------------------------------
${transaction.items.map((i) => `${i.name} (x${i.quantity}) - Rp ${(i.price * i.quantity).toLocaleString('id-ID')}`).join('\n')}
---------------------------------
TOTAL         : Rp ${transaction.total.toLocaleString('id-ID')}
Metode Bayar  : ${transaction.paymentMethod}
Status        : LUNAS
=================================
Terima kasih atas kunjungan Anda!
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base">
                Transaksi Berhasil!
              </h3>
              <p className="text-xs text-emerald-700">Pesanan telah tercatat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body (Printable area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Store branding */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-1.5 font-black text-sm text-slate-900">
                <Store className="w-4 h-4 text-orange-600" />
                <span>KASIR KILAT RESTO</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Pencatatan Penjualan & POS Otomatis
              </p>
            </div>

            {/* Meta info */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{transaction.displayTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold text-orange-600">{transaction.customerName}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
              {transaction.items.map((it) => (
                <div key={it.id} className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="font-bold block">{it.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {it.quantity} × Rp {it.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-bold text-right">
                    Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline font-black text-sm text-slate-900">
                <span>TOTAL:</span>
                <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Metode Bayar:</span>
                <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                  {transaction.paymentMethod}
                </span>
              </div>

              {transaction.paymentMethod === 'CASH' && transaction.paymentDetails?.cashGiven && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Uang Diterima:</span>
                    <span>Rp {transaction.paymentDetails.cashGiven.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                    <span>Kembalian:</span>
                    <span>Rp {(transaction.paymentDetails.cashChange || 0).toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}

              {transaction.paymentMethod === 'QRIS' && transaction.paymentDetails?.qrisRef && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Ref QRIS:</span>
                  <span>{transaction.paymentDetails.qrisRef}</span>
                </div>
              )}

              {transaction.paymentMethod === 'CRYPTO' && transaction.paymentDetails?.cryptoCurrency && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Aset:</span>
                  <span>{transaction.paymentDetails.cryptoCurrency}</span>
                </div>
              )}
            </div>

            {/* Google Sheets Sync status pill */}
            <div className="pt-2 border-t border-dashed border-slate-300 text-center">
              {transaction.syncedToSheets ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-sans font-semibold">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Tersimpan di Google Sheets</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-sans font-semibold">
                  <span>Tersimpan di Penyimpanan Lokal (Offline)</span>
                </span>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
              Terima kasih telah berkunjung!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-colors"
            title="Salin Rincian Teks"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onNewOrder();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
