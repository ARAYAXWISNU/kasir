import React, { useState } from 'react';
import { Preorder, PaymentMethod } from '../types/pos';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  QrCode, 
  Coins, 
  ShoppingBag, 
  User, 
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { playTapSound, playCashRegisterSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  preorders: Preorder[];
  onOpenCreateModal: () => void;
  onPayPreorder: (preorderId: string, method: PaymentMethod) => void;
  onMarkPickedUp: (preorderId: string) => void;
  onDeletePreorder: (preorder: Preorder) => void;
  onViewReceiptForPreorder?: (preorder: Preorder) => void;
}

export const PreorderView: React.FC<Props> = ({
  preorders,
  onOpenCreateModal,
  onPayPreorder,
  onMarkPickedUp,
  onDeletePreorder,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PICKED_UP'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayTarget, setSelectedPayTarget] = useState<string | null>(null);

  const filteredPreorders = preorders.filter((po) => {
    const matchesSearch =
      po.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') {
      return po.status !== 'SUDAH_DIAMBIL';
    }
    if (filter === 'PICKED_UP') {
      return po.status === 'SUDAH_DIAMBIL';
    }
    return true;
  });

  const handleQuickPay = (preorderId: string, method: PaymentMethod) => {
    playCashRegisterSound();
    onPayPreorder(preorderId, method);
    setSelectedPayTarget(null);
  };

  const handlePickUp = (preorderId: string) => {
    playCashRegisterSound();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onMarkPickedUp(preorderId);
  };

  const activeCount = preorders.filter((p) => p.status !== 'SUDAH_DIAMBIL').length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Daftar Pesanan Pre-order
              </h2>
              <p className="text-xs text-slate-500">
                Catatan orang yang sudah pesan apa dia — tinggal pencet bayar & lapor sudah diambil!
              </p>
            </div>
          </div>
        </div>

        {/* Action + Add button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTapSound();
              onOpenCreateModal();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Pre-order Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pemesan atau barang..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ACTIVE'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Perlu Tindakan ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua ({preorders.length})</span>
          </button>
          <button
            onClick={() => setFilter('PICKED_UP')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PICKED_UP'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sudah Diambil</span>
          </button>
        </div>
      </div>

      {/* Preorder List Grid */}
      {filteredPreorders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="font-extrabold text-slate-700 text-sm">
            {filter === 'ACTIVE'
              ? 'Tidak ada pesanan preorder yang menunggu'
              : 'Belum ada data preorder'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gunakan tombol &quot;Tulis Pre-order Baru&quot; atau simpan dari keranjang kasir untuk mencatat pesanan pelanggan duluan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPreorders.map((po) => {
            const isPaid = po.paymentStatus === 'PAID';
            const isPickedUp = po.status === 'SUDAH_DIAMBIL';

            return (
              <div
                key={po.id}
                className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                  isPickedUp
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : isPaid
                    ? 'border-emerald-300 ring-1 ring-emerald-200 shadow-sm'
                    : 'border-amber-300 ring-1 ring-amber-200 shadow-sm'
                }`}
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {po.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeletePreorder(po)}
                          className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Pre-order ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>{po.customerName}</span>
                      </h3>
                    </div>

                    {/* Status badge */}
                    <div className="flex flex-col items-end gap-1">
                      {isPaid ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>LUNAS ({po.paymentMethod || 'PAID'})</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>BELUM BAYAR</span>
                        </span>
                      )}

                      {isPickedUp ? (
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ SUDAH DIAMBIL
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ⏳ MENUNGGU DIAMBIL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waktu & Catatan */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{po.displayTime}</span>
                    </span>
                    {po.pickupTimeNote && (
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {po.pickupTimeNote}
                      </span>
                    )}
                  </div>

                  {/* PESAN APA DIA (List of items written down) */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                      Pesan Apa Dia:
                    </span>
                    <div className="space-y-1">
                      {po.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex justify-between items-center text-xs text-slate-800 font-medium"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-black text-[11px] text-indigo-700">
                              {it.quantity}x
                            </span>
                            <span className="font-bold">{it.name}</span>
                          </div>
                          <span className="font-semibold text-slate-600">
                            Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Total & Actions ("Tinggal bayar lalu ngelaporin kalau sudah diambil") */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-bold">Total Tagihan:</span>
                    <span className="text-lg font-black text-orange-600">
                      Rp {po.total.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* ACTION 1: JIKA BELUM BAYAR -> TINGGAL PENCET BAYAR */}
                  {!isPaid && !isPickedUp && (
                    <div className="space-y-1.5">
                      {selectedPayTarget === po.id ? (
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-2">
                          <span className="text-[11px] font-bold text-amber-900 block">
                            Pencet Metode Pembayaran:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickPay(po.id, 'CASH')}
                              className="py-1.5 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Cash</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickPay(po.id, 'QRIS')}
                              className="py-1.5 px-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 active:scale-95"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QRIS</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickPay(po.id, 'CRYPTO')}
                              className="py-1.5 px-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Kripto</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPayTarget(null)}
                            className="text-[11px] text-slate-500 hover:underline block text-center w-full"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setSelectedPayTarget(po.id);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Pencet Bayar Sekarang</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* ACTION 2: JIKA SUDAH BAYAR DAN BELUM DIAMBIL -> LAPOR SUDAH DIAMBIL */}
                  {isPaid && !isPickedUp && (
                    <button
                      type="button"
                      onClick={() => handlePickUp(po.id)}
                      className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lapor Sudah Diambil Pesanannya</span>
                    </button>
                  )}

                  {/* ACTION 3: JIKA SUDAH DIAMBIL */}
                  {isPickedUp && (
                    <div className="bg-slate-100 p-2.5 rounded-xl text-center space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pesanan Selesai Diambil</span>
                      </div>
                      {po.pickedUpAt && (
                        <p className="text-[11px] text-slate-400">
                          {po.pickedUpAt}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
