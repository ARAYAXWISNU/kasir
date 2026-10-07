import React, { useState } from 'react';
import { Transaction } from '../types/pos';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  TrendingUp, 
  Banknote, 
  QrCode, 
  Coins, 
  UtensilsCrossed, 
  Cookie, 
  CupSoda, 
  Sparkles, 
  Download, 
  RefreshCw,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheetsService';

interface Props {
  transactions: Transaction[];
  spreadsheet: SpreadsheetInfo | null;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export const DailyReportView: React.FC<Props> = ({
  transactions,
  spreadsheet,
  onSyncAll,
  isSyncing,
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTransactions = transactions.filter((tx) => {
    if (dateFilter === 'all') return true;
    return tx.timestamp.startsWith(todayStr);
  });

  // KPI Calculations
  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalTransactionsCount = filteredTransactions.length;
  const totalItemsSold = filteredTransactions.reduce((sum, tx) => sum + tx.totalItemsCount, 0);

  // Payment Breakdown
  const cashTotal = filteredTransactions
    .filter((tx) => tx.paymentMethod === 'CASH')
    .reduce((sum, tx) => sum + tx.total, 0);
  const cashCount = filteredTransactions.filter((tx) => tx.paymentMethod === 'CASH').length;

  const qrisTotal = filteredTransactions
    .filter((tx) => tx.paymentMethod === 'QRIS')
    .reduce((sum, tx) => sum + tx.total, 0);
  const qrisCount = filteredTransactions.filter((tx) => tx.paymentMethod === 'QRIS').length;

  const cryptoTotal = filteredTransactions
    .filter((tx) => tx.paymentMethod === 'CRYPTO')
    .reduce((sum, tx) => sum + tx.total, 0);
  const cryptoCount = filteredTransactions.filter((tx) => tx.paymentMethod === 'CRYPTO').length;

  // Item counts breakdown: Churros, Rice Bowl, Lemon Tea, Paket Hemat
  let churrosCount = 0;
  let churrosRevenue = 0;
  let ricebowlCount = 0;
  let ricebowlRevenue = 0;
  let lemonteaCount = 0;
  let lemonteaRevenue = 0;
  let paketHematCount = 0;
  let paketHematRevenue = 0;

  filteredTransactions.forEach((tx) => {
    tx.items.forEach((item) => {
      if (item.id === 'churros') {
        churrosCount += item.quantity;
        churrosRevenue += item.price * item.quantity;
      } else if (item.id === 'ricebowl') {
        ricebowlCount += item.quantity;
        ricebowlRevenue += item.price * item.quantity;
      } else if (item.id === 'lemontea') {
        lemonteaCount += item.quantity;
        lemonteaRevenue += item.price * item.quantity;
      } else if (item.id === 'paket-hemat') {
        paketHematCount += item.quantity;
        paketHematRevenue += item.price * item.quantity;
      }
    });
  });

  const exportCSV = () => {
    const headers = ['Waktu', 'ID Transaksi', 'Nama Pelanggan', 'Barang', 'Total Qty', 'Total Bayar (IDR)', 'Metode Pembayaran', 'Status'];
    const rows = filteredTransactions.map((tx) => [
      tx.displayTime,
      tx.id,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      `"${tx.items.map((i) => `${i.name} (x${i.quantity})`).join(', ').replace(/"/g, '""')}"`,
      tx.totalItemsCount,
      tx.total,
      tx.paymentMethod,
      'LUNAS',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-kasir-${dateFilter}-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Laporan Penjualan Harian
            </h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Real-time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data rekap barang terjual, nama pembeli, dan metode pembayaran.
          </p>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'today' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'all' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Periode
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sheets'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* Open Google Sheet link */}
          {spreadsheet && (
            <a
              href={spreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Buka di Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-5 rounded-3xl text-white shadow-md shadow-orange-500/20">
          <div className="flex items-center justify-between text-orange-100 mb-2">
            <span className="text-xs font-bold">Total Omset</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-orange-100 mt-1">
            {dateFilter === 'today' ? 'Penjualan hari ini' : 'Total keseluruhan'}
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Total Transaksi</span>
            <ShoppingBag className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalTransactionsCount}{' '}
            <span className="text-sm font-semibold text-slate-500">struk</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {totalItemsSold} total item terjual
          </p>
        </div>

        {/* Tunai / Cash */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Pemasukan Cash</span>
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            Rp {cashTotal.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {cashCount} transaksi tunai
          </p>
        </div>

        {/* QRIS & Kripto */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">QRIS & Kripto</span>
            <div className="flex items-center gap-1">
              <QrCode className="w-4 h-4 text-blue-600" />
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            Rp {(qrisTotal + cryptoTotal).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            QRIS: Rp {qrisTotal.toLocaleString('id-ID')} • Kripto: Rp {cryptoTotal.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Laporan Rincian Barang Terjual (The 3 items + Paket Hemat) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Laporan Rincian Barang Terjual
            </h3>
            <p className="text-xs text-slate-500">
              Analisis penjualan Churros, Rice Bowl, Lemon Tea, dan Paket Hemat
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Total {totalItemsSold} Porsi Terjual
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Churros */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Churros</h4>
                  <span className="text-[11px] text-amber-700 font-bold">@ Rp 7.500</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200 flex justify-between items-baseline">
              <span className="text-2xl font-black text-amber-800">{churrosCount} <span className="text-xs font-normal">porsi</span></span>
              <span className="text-xs font-extrabold text-slate-700">Rp {churrosRevenue.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Rice Bowl */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Rice Bowl Scrambled Egg</h4>
                  <span className="text-[11px] text-orange-700 font-bold">@ Rp 10.000</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-orange-200 flex justify-between items-baseline">
              <span className="text-2xl font-black text-orange-800">{ricebowlCount} <span className="text-xs font-normal">porsi</span></span>
              <span className="text-xs font-extrabold text-slate-700">Rp {ricebowlRevenue.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Lemon Tea */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CupSoda className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Lemon Tea</h4>
                  <span className="text-[11px] text-emerald-700 font-bold">@ Rp 6.000</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-between items-baseline">
              <span className="text-2xl font-black text-emerald-800">{lemonteaCount} <span className="text-xs font-normal">gelas</span></span>
              <span className="text-xs font-extrabold text-slate-700">Rp {lemonteaRevenue.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Paket Hemat */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Paket Hemat</h4>
                  <span className="text-[11px] text-purple-700 font-bold">@ Rp 15.000</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between items-baseline">
              <span className="text-2xl font-black text-purple-800">{paketHematCount} <span className="text-xs font-normal">paket</span></span>
              <span className="text-xs font-extrabold text-slate-700">Rp {paketHematRevenue.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Transaksi Real-Time Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Rincian Pembeli & Transaksi Real-Time
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan nama orang dan barang yang dibeli secara langsung
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {filteredTransactions.length} Catatan
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">Belum ada transaksi pada periode ini</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Lakukan penjualan di menu Kasir POS untuk mencatat otomatis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Barang yang Dibeli</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Total (Rp)</th>
                  <th className="py-3 px-4">Pembayaran</th>
                  <th className="py-3 px-4 text-center">Google Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {tx.displayTime}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {tx.id}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-orange-600">
                      {tx.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {tx.items.map((i) => (
                          <span
                            key={i.id}
                            className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium"
                          >
                            {i.name} ×{i.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {tx.totalItemsCount}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                      Rp {tx.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md ${
                          tx.paymentMethod === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.paymentMethod === 'QRIS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.syncedToSheets ? (
                        <span className="inline-flex items-center text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Tersimpan
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                          Offline
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
