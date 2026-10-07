import React, { useState } from 'react';
import { MenuItem, Preorder } from '../types/pos';
import { MENU_ITEMS } from '../data/menu';
import { 
  X, 
  Plus, 
  Minus, 
  User, 
  Clock, 
  Check, 
  ClipboardCheck, 
  Sparkles,
  Cookie,
  UtensilsCrossed,
  CupSoda
} from 'lucide-react';
import { playTapSound, playCashRegisterSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSavePreorder: (preorder: Preorder) => void;
  initialName?: string;
  initialItems?: { item: MenuItem; quantity: number }[];
}

export const CreatePreorderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSavePreorder,
  initialName = '',
  initialItems = [],
}) => {
  const [customerName, setCustomerName] = useState(initialName);
  const [pickupTimeNote, setPickupTimeNote] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    MENU_ITEMS.forEach((m) => (init[m.id] = 0));
    initialItems.forEach(({ item, quantity }) => {
      init[item.id] = quantity;
    });
    return init;
  });
  const [isPaidUpfront, setIsPaidUpfront] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CRYPTO'>('QRIS');

  if (!isOpen) return null;

  const totalBill = MENU_ITEMS.reduce(
    (sum, m) => sum + m.price * (quantities[m.id] || 0),
    0
  );
  const totalItemsCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const handleUpdateQty = (itemId: string, delta: number) => {
    playTapSound();
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Harap masukkan nama pemesan preorder.');
      return;
    }
    if (totalItemsCount === 0) {
      alert('Pilih minimal 1 barang pesanan.');
      return;
    }

    playCashRegisterSound();

    const selectedItems = MENU_ITEMS.filter((m) => (quantities[m.id] || 0) > 0).map(
      (m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        quantity: quantities[m.id] || 0,
      })
    );

    const now = new Date();
    const newPreorder: Preorder = {
      id: `PO-${now.getTime().toString().slice(-5)}`,
      customerName: customerName.trim(),
      createdAt: now.toISOString(),
      displayTime: `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      pickupTimeNote: pickupTimeNote.trim() || 'Hari ini',
      items: selectedItems,
      totalItemsCount,
      total: totalBill,
      paymentStatus: isPaidUpfront ? 'PAID' : 'UNPAID',
      paymentMethod: isPaidUpfront ? paymentMethod : undefined,
      status: isPaidUpfront ? 'SIAP_DIAMBIL' : 'BELUM_BAYAR',
      paidAt: isPaidUpfront ? now.toISOString() : undefined,
      syncedToSheets: false,
    };

    onSavePreorder(newPreorder);
    onClose();
  };

  const getItemIcon = (id: string) => {
    switch (id) {
      case 'churros':
        return <Cookie className="w-4 h-4 text-amber-600" />;
      case 'ricebowl':
        return <UtensilsCrossed className="w-4 h-4 text-orange-600" />;
      case 'lemontea':
        return <CupSoda className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Catat Pesanan Pre-order
              </h3>
              <p className="text-xs text-indigo-700">
                Tulis pesanan yang akan diambil nanti
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nama Pemesan Pre-order</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Kak Cindy / Mas Dimas / Ibu Retno"
              className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Pickup time or note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Waktu Estimasi Pengambilan / Catatan</span>
            </label>
            <input
              type="text"
              value={pickupTimeNote}
              onChange={(e) => setPickupTimeNote(e.target.value)}
              placeholder="Contoh: Diambil jam 14.30 / Nasi jangan pedas"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Select Items */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Tulis Pesan Apa Dia (Pencet tombol + / -):
            </span>
            <div className="space-y-2">
              {MENU_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                    (quantities[item.id] || 0) > 0
                      ? 'bg-indigo-50/60 border-indigo-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {getItemIcon(item.id)}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-extrabold text-orange-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-slate-800">
                      {quantities[item.id] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold active:scale-90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment status option */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <span className="block text-xs font-bold text-slate-700">
              Status Pembayaran Pre-order:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaidUpfront(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  !isPaidUpfront
                    ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                🔴 Belum Bayar (Bayar Nanti)
              </button>
              <button
                type="button"
                onClick={() => setIsPaidUpfront(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  isPaidUpfront
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                🟢 Sudah Dibayar (Lunas)
              </button>
            </div>

            {isPaidUpfront && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Metode:</span>
                {(['CASH', 'QRIS', 'CRYPTO'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      paymentMethod === m
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-500">Total Tagihan Pre-order:</span>
            <span className="text-xl font-black text-indigo-700">
              Rp {totalBill.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all active:scale-98"
            >
              <Check className="w-5 h-5" />
              <span>Simpan Catatan Pre-order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
