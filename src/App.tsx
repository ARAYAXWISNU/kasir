import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  MenuItem, 
  CartItem, 
  Transaction, 
  PaymentMethod, 
  Category,
  Preorder
} from './types/pos';
import { MENU_ITEMS } from './data/menu';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './services/firebase';
import { 
  SpreadsheetInfo, 
  SPREADSHEET_STORAGE_KEY, 
  SPREADSHEET_TITLE_KEY, 
  getExistingSpreadsheet, 
  createPosSpreadsheet, 
  appendTransactionToSheet, 
  batchAppendTransactionsToSheet,
  appendPreorderPickupToSheet
} from './services/sheetsService';
import { isSoundEnabled, setSoundEnabled, playTapSound } from './utils/audio';

import { Header } from './components/Header';
import { MenuCard } from './components/MenuCard';
import { CartSidebar } from './components/CartSidebar';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DailyReportView } from './components/DailyReportView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { SheetsSettingsModal } from './components/SheetsSettingsModal';
import { PreorderView } from './components/PreorderView';
import { CreatePreorderModal } from './components/CreatePreorderModal';
import { StrictDeleteModal, DeleteTargetInfo } from './components/StrictDeleteModal';
import { 
  Cookie, 
  UtensilsCrossed, 
  CupSoda, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  FileSpreadsheet
} from 'lucide-react';

const TRANSACTIONS_KEY = 'kasir_pos_transactions_v1';
const OFFLINE_QUEUE_KEY = 'kasir_pos_offline_queue_v1';
const PREORDERS_KEY = 'kasir_pos_preorders_v1';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'preorder' | 'history' | 'report'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ALL');

  // Cart & POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [offlineQueue, setOfflineQueue] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Preorders state (persisted with initial sample preorders for quick demonstration)
  const [preorders, setPreorders] = useState<Preorder[]>(() => {
    try {
      const saved = localStorage.getItem(PREORDERS_KEY);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'PO-101',
          customerName: 'Kak Cindy (Preorder WA)',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          displayTime: 'Hari ini, 11:30',
          pickupTimeNote: 'Diambil jam 12:45 (Minta sambal terpisah)',
          items: [
            { id: 'paket-hemat', name: 'Paket Hemat (Rice Bowl Scrambled Egg + Lemon Tea)', price: 15000, quantity: 2 },
            { id: 'churros', name: 'Churros Renyah', price: 7500, quantity: 1 },
          ],
          totalItemsCount: 3,
          total: 37500,
          paymentStatus: 'UNPAID',
          status: 'BELUM_BAYAR',
          syncedToSheets: false,
        },
        {
          id: 'PO-102',
          customerName: 'Mas Dimas (Preorder Kantor)',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          displayTime: 'Hari ini, 12:15',
          pickupTimeNote: 'Diambil jam 13:00 (Sudah transfer QRIS)',
          items: [
            { id: 'ricebowl', name: 'Rice Bowl Scrambled Egg', price: 10000, quantity: 2 },
            { id: 'lemontea', name: 'Lemon Tea Segar', price: 6000, quantity: 2 },
          ],
          totalItemsCount: 4,
          total: 32000,
          paymentStatus: 'PAID',
          paymentMethod: 'QRIS',
          status: 'SIAP_DIAMBIL',
          paidAt: new Date(Date.now() - 1800000).toISOString(),
          syncedToSheets: true,
        },
      ];
    } catch {
      return [];
    }
  });

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreatePreorderModalOpen, setIsCreatePreorderModalOpen] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);

  // Auth & Sheets State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Persist transactions
  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }, [transactions]);

  // Persist offline queue
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch (e) {
      console.error('Failed to save offline queue to localStorage', e);
    }
  }, [offlineQueue]);

  // Persist preorders
  useEffect(() => {
    try {
      localStorage.setItem(PREORDERS_KEY, JSON.stringify(preorders));
    } catch (e) {
      console.error('Failed to save preorders to localStorage', e);
    }
  }, [preorders]);

  // Load / Setup Google Spreadsheet after auth
  const setupSpreadsheetForUser = useCallback(async (token: string) => {
    setIsSyncing(true);
    try {
      const savedId = localStorage.getItem(SPREADSHEET_STORAGE_KEY);
      if (savedId) {
        const existing = await getExistingSpreadsheet(token, savedId);
        if (existing) {
          setSpreadsheet(existing);
          setIsSyncing(false);
          return existing;
        }
      }

      // If no valid existing spreadsheet, create a new one automatically
      const newSheet = await createPosSpreadsheet(token);
      setSpreadsheet(newSheet);
      setBannerNotice(`Google Spreadsheet "${newSheet.title}" terhubung & siap digunakan!`);
      setTimeout(() => setBannerNotice(null), 5000);
      setIsSyncing(false);
      return newSheet;
    } catch (err) {
      console.error('Error configuring spreadsheet:', err);
      setIsSyncing(false);
      return null;
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authenticatedUser, token) => {
        setUser(authenticatedUser);
        await setupSpreadsheetForUser(token);
      },
      () => {
        setUser(null);
        setSpreadsheet(null);
      }
    );
    return () => unsubscribe();
  }, [setupSpreadsheetForUser]);

  // Sound toggle
  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
  };

  // Google Sign In Handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        await setupSpreadsheetForUser(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      alert(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setSpreadsheet(null);
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Quick Preset order button ("Tinggal pencet")
  const handleQuickPreset = (itemId: string) => {
    playTapSound();
    const item = MENU_ITEMS.find((m) => m.id === itemId);
    if (item) {
      handleAddToCart(item);
    }
  };

  // Payment Confirmation & Google Sheets Sync
  const handleConfirmPayment = async (paymentData: {
    method: PaymentMethod;
    details: {
      cashGiven?: number;
      cashChange?: number;
      qrisRef?: string;
      cryptoCurrency?: string;
      cryptoTxHash?: string;
    };
  }) => {
    const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
    const total = subtotal;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newTx: Transaction = {
      id: `TRX-${now.getTime().toString().slice(-6)}`,
      timestamp: now.toISOString(),
      displayTime: `${dateFormatted}, ${timeFormatted}`,
      customerName: customerName.trim() || 'Pelanggan Umum',
      items: cart.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
      })),
      totalItemsCount,
      subtotal,
      tax: 0,
      total,
      paymentMethod: paymentData.method,
      paymentDetails: paymentData.details,
      orderType: 'DIRECT',
      syncedToSheets: false,
    };

    // Close payment modal
    setIsPaymentModalOpen(false);

    // Try syncing to Google Sheets if logged in & spreadsheet ready
    const token = await getAccessToken();
    if (token && spreadsheet) {
      setIsSyncing(true);
      try {
        await appendTransactionToSheet(token, spreadsheet.id, newTx);
        newTx.syncedToSheets = true;
      } catch (err) {
        console.warn('Sheets sync failed, queuing offline:', err);
        setOfflineQueue((q) => [newTx, ...q]);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setOfflineQueue((q) => [newTx, ...q]);
    }

    // Save to transactions list
    setTransactions((prev) => [newTx, ...prev]);
    setLatestTransaction(newTx);
    setIsReceiptModalOpen(true);

    // Reset cart and customer name for next transaction
    setCart([]);
    setCustomerName('');
  };

  // Convert current cart directly into Preorder
  const handleSaveCurrentCartAsPreorder = () => {
    if (cart.length === 0) return;
    setIsCreatePreorderModalOpen(true);
  };

  // Save Preorder handler
  const handleSavePreorder = async (newPo: Preorder) => {
    setPreorders((prev) => [newPo, ...prev]);

    // If already paid upfront, record as transaction too
    if (newPo.paymentStatus === 'PAID') {
      const now = new Date();
      const newTx: Transaction = {
        id: newPo.id,
        timestamp: newPo.createdAt,
        displayTime: newPo.displayTime,
        customerName: newPo.customerName,
        items: newPo.items,
        totalItemsCount: newPo.totalItemsCount,
        subtotal: newPo.total,
        tax: 0,
        total: newPo.total,
        paymentMethod: newPo.paymentMethod || 'QRIS',
        orderType: 'PREORDER',
        pickupStatus: 'MENUNGGU_DIAMBIL',
        note: `Pre-order: ${newPo.pickupTimeNote || 'Lunas dimuka'}`,
        syncedToSheets: false,
      };

      const token = await getAccessToken();
      if (token && spreadsheet) {
        setIsSyncing(true);
        try {
          await appendTransactionToSheet(token, spreadsheet.id, newTx);
          newTx.syncedToSheets = true;
        } catch {
          setOfflineQueue((q) => [newTx, ...q]);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setOfflineQueue((q) => [newTx, ...q]);
      }

      setTransactions((prev) => [newTx, ...prev]);
    }

    // Clear cart if saved from cart
    setCart([]);
    setCustomerName('');

    setBannerNotice(`Pesanan Pre-order "${newPo.customerName}" berhasil dicatat!`);
    setTimeout(() => setBannerNotice(null), 4000);
    setActiveTab('preorder');
  };

  // Pay an existing Preorder ("Tinggal Bayar")
  const handlePayPreorder = async (preorderId: string, method: PaymentMethod) => {
    const target = preorders.find((p) => p.id === preorderId);
    if (!target) return;

    const now = new Date();
    const paidTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Update preorder state
    setPreorders((prev) =>
      prev.map((p) =>
        p.id === preorderId
          ? {
              ...p,
              paymentStatus: 'PAID',
              paymentMethod: method,
              status: 'SIAP_DIAMBIL',
              paidAt: now.toISOString(),
            }
          : p
      )
    );

    // Record transaction
    const newTx: Transaction = {
      id: target.id,
      timestamp: now.toISOString(),
      displayTime: `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, ${paidTime}`,
      customerName: target.customerName,
      items: target.items,
      totalItemsCount: target.totalItemsCount,
      subtotal: target.total,
      tax: 0,
      total: target.total,
      paymentMethod: method,
      orderType: 'PREORDER',
      pickupStatus: 'MENUNGGU_DIAMBIL',
      note: `Pre-order: ${target.pickupTimeNote || 'Lunas'}`,
      syncedToSheets: false,
    };

    const token = await getAccessToken();
    if (token && spreadsheet) {
      setIsSyncing(true);
      try {
        await appendTransactionToSheet(token, spreadsheet.id, newTx);
        newTx.syncedToSheets = true;
      } catch {
        setOfflineQueue((q) => [newTx, ...q]);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setOfflineQueue((q) => [newTx, ...q]);
    }

    setTransactions((prev) => [newTx, ...prev]);
    setLatestTransaction(newTx);
    setIsReceiptModalOpen(true);

    setBannerNotice(`Pre-order ${target.customerName} lunas (${method})! Siap diambil pemesan.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Mark Preorder as Picked Up ("Ngelaporin kalau sudah diambil pesanannya")
  const handleMarkPickedUp = async (preorderId: string) => {
    const target = preorders.find((p) => p.id === preorderId);
    if (!target) return;

    const now = new Date();
    const pickupTimeStr = `Diambil pada ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`;

    // Update Preorders
    setPreorders((prev) =>
      prev.map((p) =>
        p.id === preorderId
          ? {
              ...p,
              status: 'SUDAH_DIAMBIL',
              pickedUpAt: pickupTimeStr,
            }
          : p
      )
    );

    // Update transaction pickup status
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === target.id
          ? {
              ...t,
              pickupStatus: 'SUDAH_DIAMBIL',
              pickedUpTime: pickupTimeStr,
            }
          : t
      )
    );

    // Report pickup to Google Sheets
    const token = await getAccessToken();
    if (token && spreadsheet) {
      setIsSyncing(true);
      try {
        const itemsSummary = target.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
        await appendPreorderPickupToSheet(token, spreadsheet.id, {
          id: target.id,
          customerName: target.customerName,
          itemsSummary,
          totalItemsCount: target.totalItemsCount,
          total: target.total,
          paymentMethod: target.paymentMethod || 'LUNAS',
          pickedUpAt: pickupTimeStr,
          note: target.pickupTimeNote,
        });
      } catch (err) {
        console.warn('Failed to report pickup to sheets:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    setBannerNotice(`✓ Pesanan ${target.customerName} dilaporkan SUDAH DIAMBIL! Tercatat di Google Sheets.`);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // Strict Delete Request Handlers
  const handleRequestDeletePreorder = (po: Preorder) => {
    const itemsSummary = po.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
    setDeleteTarget({
      type: 'PREORDER',
      id: po.id,
      customerName: po.customerName,
      itemsSummary,
      total: po.total,
      time: po.displayTime,
    });
    setIsDeleteModalOpen(true);
  };

  const handleRequestDeleteTransaction = (tx: Transaction) => {
    const itemsSummary = tx.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
    setDeleteTarget({
      type: 'TRANSACTION',
      id: tx.id,
      customerName: tx.customerName,
      itemsSummary,
      total: tx.total,
      time: tx.displayTime,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (target: DeleteTargetInfo) => {
    if (target.type === 'PREORDER') {
      setPreorders((prev) => prev.filter((p) => p.id !== target.id));
      setBannerNotice(`Pesanan Pre-order "${target.customerName}" (${target.id}) berhasil dihapus.`);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== target.id));
      setOfflineQueue((prev) => prev.filter((t) => t.id !== target.id));
      setBannerNotice(`Data Transaksi "${target.id}" (${target.customerName}) berhasil dihapus.`);
    }
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Sync all pending offline queue transactions to Google Sheets
  const handleSyncOfflineQueue = async () => {
    const token = await getAccessToken();
    if (!token || !spreadsheet) {
      throw new Error('Harap hubungkan akun Google Sheets terlebih dahulu.');
    }
    if (offlineQueue.length === 0) return;

    setIsSyncing(true);
    try {
      const ok = await batchAppendTransactionsToSheet(token, spreadsheet.id, offlineQueue);
      if (ok) {
        const syncedIds = new Set(offlineQueue.map((tx) => tx.id));
        setTransactions((prev) =>
          prev.map((tx) => (syncedIds.has(tx.id) ? { ...tx, syncedToSheets: true } : tx))
        );
        setOfflineQueue([]);
        setBannerNotice('Semua transaksi offline berhasil disinkronkan ke Google Sheets!');
        setTimeout(() => setBannerNotice(null), 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Create brand new sheet from settings modal
  const handleCreateNewSheet = async (title?: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Harap masuk dengan Google terlebih dahulu.');
    const created = await createPosSpreadsheet(token, title);
    setSpreadsheet(created);
  };

  // Connect existing sheet from settings modal
  const handleConnectExistingSheet = async (id: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Harap masuk dengan Google terlebih dahulu.');
    const existing = await getExistingSpreadsheet(token, id);
    if (!existing) {
      throw new Error('Spreadsheet dengan ID tersebut tidak ditemukan atau tidak memiliki akses.');
    }
    setSpreadsheet(existing);
    localStorage.setItem(SPREADSHEET_STORAGE_KEY, existing.id);
    localStorage.setItem(SPREADSHEET_TITLE_KEY, existing.title);
  };

  // Filtered menu
  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const activePreordersCount = preorders.filter((p) => p.status !== 'SUDAH_DIAMBIL').length;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        spreadsheet={spreadsheet}
        isSyncing={isSyncing}
        offlineQueueCount={offlineQueue.length}
        preorderCount={activePreordersCount}
        soundEnabled={soundActive}
        toggleSound={toggleSound}
        openSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Banner Notice */}
      {bannerNotice && (
        <div className="bg-emerald-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in sticky top-[57px] z-20 shadow-md">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        {/* TAB 1: KASIR POS (TOUCH INTERFACE) */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {/* Left 8 columns: Menu & Quick Touch Buttons */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              {/* Quick 1-Touch Combo Row (Tinggal Pencet-Pencet) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Tombol Pencet Kilat (1 Sentuhan Langsung Masuk)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Sentuh tombol untuk tambah pesanan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('paket-hemat')}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span className="truncate">+ Paket Hemat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset('churros')}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <Cookie className="w-4 h-4 shrink-0" />
                    <span className="truncate">+ Churros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset('ricebowl')}
                    className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <UtensilsCrossed className="w-4 h-4 shrink-0" />
                    <span className="truncate">+ Rice Bowl</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset('lemontea')}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <CupSoda className="w-4 h-4 shrink-0" />
                    <span className="truncate">+ Lemon Tea</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory('ALL');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua Menu (4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory('COMBO');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === 'COMBO'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paket Hemat Promo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory('FOOD');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === 'FOOD'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Makanan (Churros & Rice Bowl)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory('DRINK');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === 'DRINK'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CupSoda className="w-3.5 h-3.5" />
                  <span>Minuman (Lemon Tea)</span>
                </button>
              </div>

              {/* Main Menu Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const cartItem = cart.find((c) => c.item.id === item.id);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  return (
                    <MenuCard
                      key={item.id}
                      item={item}
                      quantityInCart={quantity}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                    />
                  );
                })}
              </div>

              {/* Google Sheets Connection Prompt when not logged in */}
              {!user && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Simpan Database Otomatis ke Google Sheets
                      </h4>
                      <p className="text-slate-600">
                        Masuk dengan Google agar setiap transaksi kasir & preorder langsung tersimpan real-time ke spreadsheet Anda.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={authLoading}
                    className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors shadow-xs"
                  >
                    Hubungkan Google Sheets
                  </button>
                </div>
              )}
            </div>

            {/* Right 4 columns: Order Summary & Checkout */}
            <div className="lg:col-span-4 h-full">
              <CartSidebar
                cart={cart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                onSaveAsPreorder={handleSaveCurrentCartAsPreorder}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PRE-ORDER MANAGEMENT */}
        {activeTab === 'preorder' && (
          <PreorderView
            preorders={preorders}
            onOpenCreateModal={() => setIsCreatePreorderModalOpen(true)}
            onPayPreorder={handlePayPreorder}
            onMarkPickedUp={handleMarkPickedUp}
            onDeletePreorder={handleRequestDeletePreorder}
          />
        )}

        {/* TAB 3: RIWAYAT TRANSAKSI */}
        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={transactions}
            onSelectReceipt={(tx) => {
              setLatestTransaction(tx);
              setIsReceiptModalOpen(true);
            }}
            onDeleteTransaction={handleRequestDeleteTransaction}
            spreadsheetUrl={spreadsheet?.url}
          />
        )}

        {/* TAB 4: LAPORAN HARIAN */}
        {activeTab === 'report' && (
          <DailyReportView
            transactions={transactions}
            spreadsheet={spreadsheet}
            onSyncAll={handleSyncOfflineQueue}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        customerName={customerName}
        setCustomerName={setCustomerName}
        initialPaymentMethod={selectedPayment}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        transaction={latestTransaction}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setLatestTransaction(null);
          setActiveTab('pos');
        }}
        onNewOrder={() => {
          setIsReceiptModalOpen(false);
          setLatestTransaction(null);
          setActiveTab('pos');
        }}
        sheetUrl={spreadsheet?.url}
      />

      {/* Create Preorder Modal */}
      <CreatePreorderModal
        isOpen={isCreatePreorderModalOpen}
        onClose={() => setIsCreatePreorderModalOpen(false)}
        onSavePreorder={handleSavePreorder}
        initialName={customerName}
        initialItems={cart}
      />

      {/* Strict Delete Confirmation Modal */}
      <StrictDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        target={deleteTarget}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Google Sheets Settings Modal */}
      <SheetsSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        spreadsheet={spreadsheet}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={handleConnectExistingSheet}
        onSyncOfflineQueue={handleSyncOfflineQueue}
        offlineQueueCount={offlineQueue.length}
        isSyncing={isSyncing}
        onGoogleSignIn={handleSignIn}
      />
    </div>
  );
}
