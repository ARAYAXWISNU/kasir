import React, { useState } from 'react';
import { CartItem, PaymentMethod } from '../types/pos';
import { 
  X, 
  Banknote, 
  QrCode, 
  Coins, 
  CheckCircle2, 
  User, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { playTapSound, playCashRegisterSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  initialPaymentMethod: PaymentMethod;
  onConfirmPayment: (paymentData: {
    method: PaymentMethod;
    details: {
      cashGiven?: number;
      cashChange?: number;
      qrisRef?: string;
      cryptoCurrency?: string;
      cryptoTxHash?: string;
    };
  }) => void;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cart,
  customerName,
  setCustomerName,
  initialPaymentMethod,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>(initialPaymentMethod);
  const totalBill = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  // Cash states
  const [cashGiven, setCashGiven] = useState<number>(totalBill);

  // Crypto states
  const [selectedCrypto, setSelectedCrypto] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // QRIS states
  const [qrisScanned, setQrisScanned] = useState(false);

  if (!isOpen) return null;

  const cryptoRates: Record<string, { rateIdr: number; decimals: number }> = {
    USDT: { rateIdr: 16000, decimals: 2 },
    BTC: { rateIdr: 1050000000, decimals: 6 },
    ETH: { rateIdr: 45000000, decimals: 5 },
    SOL: { rateIdr: 2500000, decimals: 4 },
  };

  const cryptoAmount = (totalBill / cryptoRates[selectedCrypto].rateIdr).toFixed(
    cryptoRates[selectedCrypto].decimals
  );

  const mockCryptoAddresses: Record<string, string> = {
    USDT: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    BTC: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    ETH: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  };

  const cashChange = Math.max(0, cashGiven - totalBill);
  const isCashSufficient = cashGiven >= totalBill;

  const quickCashOptions = [
    { label: 'Uang Pas', amount: totalBill },
    { label: 'Rp 10.000', amount: 10000 },
    { label: 'Rp 15.000', amount: 15000 },
    { label: 'Rp 20.000', amount: 20000 },
    { label: 'Rp 50.000', amount: 50000 },
    { label: 'Rp 100.000', amount: 100000 },
  ];

  const handleCopyCrypto = () => {
    navigator.clipboard.writeText(mockCryptoAddresses[selectedCrypto]);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCompleteTransaction = () => {
    playCashRegisterSound();
    
    // Shoot confetti for celebratory feeling!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    if (method === 'CASH') {
      onConfirmPayment({
        method: 'CASH',
        details: {
          cashGiven,
          cashChange,
        },
      });
    } else if (method === 'QRIS') {
      onConfirmPayment({
        method: 'QRIS',
        details: {
          qrisRef: `QRIS-${Date.now().toString().slice(-6)}`,
        },
      });
    } else {
      onConfirmPayment({
        method: 'CRYPTO',
        details: {
          cryptoCurrency: selectedCrypto,
          cryptoTxHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-black text-slate-900 text-lg sm:text-xl">
              Proses Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              Total Tagihan:{' '}
              <span className="font-extrabold text-orange-600 text-sm">
                Rp {totalBill.toLocaleString('id-ID')}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Customer Name validation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span>Nama Pelanggan</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Budi / Meja 4 / Take Away"
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          {/* Payment Method Switcher Tabs */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Metode Pembayaran:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setMethod('CASH');
                }}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 border-2 transition-all active:scale-95 ${
                  method === 'CASH'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>CASH / TUNAI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setMethod('QRIS');
                }}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 border-2 transition-all active:scale-95 ${
                  method === 'QRIS'
                    ? 'bg-blue-50 text-blue-800 border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>QRIS INSTAN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setMethod('CRYPTO');
                }}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 border-2 transition-all active:scale-95 ${
                  method === 'CRYPTO'
                    ? 'bg-amber-50 text-amber-800 border-amber-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Coins className="w-5 h-5 text-amber-600" />
                <span>KRIPTO (WEB3)</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Screens */}
          {method === 'CASH' && (
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Uang Diterima dari Pelanggan:</span>
                <span className="text-xs text-emerald-700">Pencet nominal cepat:</span>
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCashGiven(opt.amount);
                    }}
                    className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all active:scale-95 ${
                      cashGiven === opt.amount
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom Cash Input */}
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="Ketik jumlah uang tunai..."
                />
              </div>

              {/* Kembalian Display */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Kembalian:</span>
                  <span
                    className={`text-lg font-black ${
                      isCashSufficient ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {isCashSufficient
                      ? `Rp ${cashChange.toLocaleString('id-ID')}`
                      : `Kurang Rp ${(totalBill - cashGiven).toLocaleString('id-ID')}`}
                  </span>
                </div>
                {isCashSufficient && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          )}

          {method === 'QRIS' && (
            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Metode Pembayaran QRIS</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium">Total yang Dibayar via QRIS:</span>
                <div className="text-2xl sm:text-3xl font-black text-blue-700">
                  Rp {totalBill.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  Cukup pencet tombol di bawah untuk langsung menyelesaikan dan mencatat transaksi ke sistem.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCompleteTransaction}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Pencet Selesaikan QRIS (Lunas)</span>
              </button>
            </div>
          )}

          {method === 'CRYPTO' && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Pilih Aset Kripto:</span>
                <span className="text-[11px] text-amber-700 font-semibold">Real-time Web3 Pay</span>
              </div>

              {/* Crypto selector tabs */}
              <div className="grid grid-cols-4 gap-1.5">
                {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedCrypto(coin);
                    }}
                    className={`py-1.5 text-xs font-black rounded-xl border transition-all ${
                      selectedCrypto === coin
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {coin}
                  </button>
                ))}
              </div>

              {/* Crypto Bill info */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Estimasi Pembayaran:</span>
                  <span className="text-base font-black text-amber-600">
                    {cryptoAmount} {selectedCrypto}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold block mb-0.5">Alamat Wallet Kasir:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-2 rounded-lg font-mono text-[10px] break-all text-slate-800">
                    <span className="flex-1">{mockCryptoAddresses[selectedCrypto]}</span>
                    <button
                      type="button"
                      onClick={handleCopyCrypto}
                      className="p-1 text-slate-500 hover:text-amber-600 transition-colors"
                      title="Salin Alamat Wallet"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rincian Pesanan Ringkas */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Rincian Belanja:</span>
            <div className="space-y-1 text-slate-600">
              {cart.map((c) => (
                <div key={c.item.id} className="flex justify-between">
                  <span>{c.item.name} × {c.quantity}</span>
                  <span className="font-semibold">Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Big Action Button */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleCompleteTransaction}
            disabled={method === 'CASH' && !isCashSufficient}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
              method === 'CASH' && !isCashSufficient
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Selesaikan & Simpan Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
