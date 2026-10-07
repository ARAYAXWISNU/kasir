import React, { useState } from 'react';
import { Transaction } from '../types/pos';
import { 
  Search, 
  Receipt, 
  ExternalLink, 
  FileSpreadsheet, 
  CheckCircle2, 
  Filter,
  User,
  ShoppingBag,
  Trash2
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onSelectReceipt: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  spreadsheetUrl?: string;
}

export const TransactionHistoryView: React.FC<Props> = ({
  transactions,
  onSelectReceipt,
  onDeleteTransaction,
  spreadsheetUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'CASH' | 'QRIS' | 'CRYPTO'>('ALL');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod =
      filterMethod === 'ALL' || tx.paymentMethod === filterMethod;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pelanggan, barang, atau nomor nota..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Filter by payment method */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          {(['ALL', 'CASH', 'QRIS', 'CRYPTO'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setFilterMethod(method)}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                filterMethod === method
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {method === 'ALL' ? 'Semua' : method}
            </button>
          ))}
        </div>

        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Lihat di Sheets</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Transaction List Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="font-extrabold text-slate-700 text-sm">Tidak ada transaksi yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">
            {transactions.length === 0
              ? 'Belum ada transaksi. Silakan input penjualan di menu Kasir.'
              : 'Coba ubah kata kunci pencarian atau filter metode pembayaran.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400 block">
                      {tx.id}
                    </span>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>{tx.customerName}</span>
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      tx.paymentMethod === 'CASH'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.paymentMethod === 'QRIS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tx.paymentMethod}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Waktu: {tx.displayTime}
                </div>

                {/* Items preview */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                  {tx.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-xs text-slate-700">
                      <span>{i.name} ×{i.quantity}</span>
                      <span className="font-semibold text-slate-900">
                        Rp {(i.price * i.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Tagihan</span>
                  <span className="text-base font-black text-orange-600">
                    Rp {tx.total.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {tx.syncedToSheets ? (
                    <span className="text-emerald-600 p-1" title="Tersimpan di Google Sheets">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="text-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50" title="Offline">
                      Offline
                    </span>
                  )}
                  <button
                    onClick={() => onSelectReceipt(tx)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-500 hover:text-white px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Lihat Struk</span>
                  </button>
                  {onDeleteTransaction && (
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus data transaksi ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
