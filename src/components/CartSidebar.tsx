import React from 'react';
import { CartItem, PaymentMethod } from '../types/pos';
import { 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Banknote, 
  QrCode, 
  Coins, 
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { playTapSound, playDeleteSound } from '../utils/audio';

interface Props {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  selectedPayment: PaymentMethod;
  setSelectedPayment: (method: PaymentMethod) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenPaymentModal: () => void;
  onSaveAsPreorder: () => void;
}

export const CartSidebar: React.FC<Props> = ({
  cart,
  customerName,
  setCustomerName,
  selectedPayment,
  setSelectedPayment,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenPaymentModal,
  onSaveAsPreorder,
}) => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  const handlePaymentSelect = (method: PaymentMethod) => {
    playTapSound();
    setSelectedPayment(method);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm">Keranjang Pesanan</h2>
            <p className="text-[11px] text-slate-500">{totalItems} item dipilih</p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playDeleteSound();
              onClearCart();
            }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
            title="Kosongkan keranjang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Customer Name Section (No table 1 / table 2 buttons) */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-orange-500" />
            <span>Nama Pelanggan</span>
            <span className="text-orange-500 text-xs">*</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">Untuk nota & preorder</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ketik nama pemesan di sini..."
            className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
          />
          {customerName && (
            <button
              type="button"
              onClick={() => setCustomerName('')}
              className="absolute right-2.5 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[320px] lg:max-h-none">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Belum ada item pesanan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Sentuh atau klik menu di sebelah kiri untuk menambah ke kasir.
            </p>
          </div>
        ) : (
          cart.map(({ item, quantity }) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50 hover:bg-orange-50/40 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {item.name}
                  </h4>
                  {item.category === 'COMBO' && (
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-slate-500">
                    Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400">×</span>
                  <span className="text-xs font-black text-orange-600">
                    Rp {(item.price * quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Stepper + Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onUpdateQuantity(item.id, -1);
                  }}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-black text-xs text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onUpdateQuantity(item.id, 1);
                  }}
                  className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-bold active:scale-90 transition-transform shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playDeleteSound();
                    onRemoveItem(item.id);
                  }}
                  className="w-7 h-7 ml-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                  title="Hapus dari pesanan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Payment Method & Checkout Trigger */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
        {/* Payment Method Selector */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-1.5">
            Pilihan Metode Pembayaran:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePaymentSelect('CASH')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                selectedPayment === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash / Tunai</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentSelect('QRIS')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                selectedPayment === 'QRIS'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentSelect('CRYPTO')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                selectedPayment === 'CRYPTO'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Kripto</span>
            </button>
          </div>
        </div>

        {/* Subtotal & Total Bill */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal ({totalItems} barang)</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
            <span className="font-extrabold text-slate-800 text-sm">Total Tagihan</span>
            <span className="font-black text-slate-900 text-xl text-orange-600">
              Rp {subtotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Dual Actions: Preorder or Direct Payment */}
        <div className="grid grid-cols-1 gap-2">
          {/* Main Direct Checkout */}
          <button
            type="button"
            onClick={onOpenPaymentModal}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
              cart.length > 0
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Bayar Langsung</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Save As Pre-Order Button */}
          <button
            type="button"
            onClick={onSaveAsPreorder}
            disabled={cart.length === 0}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all active:scale-98 ${
              cart.length > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>Simpan Sebagai Pesanan Pre-order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
