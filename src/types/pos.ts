export type PaymentMethod = 'CASH' | 'QRIS' | 'CRYPTO';

export type Category = 'ALL' | 'FOOD' | 'DRINK' | 'COMBO';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: 'FOOD' | 'DRINK' | 'COMBO';
  description: string;
  badge?: string;
  iconName: string;
  includes?: {
    churros?: number;
    ricebowl?: number;
    lemontea?: number;
  };
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  note?: string;
}

export interface Transaction {
  id: string;
  timestamp: string; // ISO string
  displayTime: string;
  customerName: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalItemsCount: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cashGiven?: number;
    cashChange?: number;
    qrisRef?: string;
    cryptoCurrency?: string;
    cryptoTxHash?: string;
  };
  note?: string;
  orderType?: 'DIRECT' | 'PREORDER';
  pickupStatus?: 'MENUNGGU_DIAMBIL' | 'SUDAH_DIAMBIL';
  pickedUpTime?: string;
  syncedToSheets: boolean;
  sheetsRowIndex?: number;
}

export type PreorderStatus = 'BELUM_BAYAR' | 'SIAP_DIAMBIL' | 'SUDAH_DIAMBIL';

export interface Preorder {
  id: string;
  customerName: string;
  createdAt: string;
  displayTime: string;
  pickupTimeNote?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalItemsCount: number;
  total: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod?: PaymentMethod;
  status: PreorderStatus;
  note?: string;
  paidAt?: string;
  pickedUpAt?: string;
  syncedToSheets: boolean;
}

export interface DailyReportSummary {
  date: string;
  totalRevenue: number;
  transactionCount: number;
  cashRevenue: number;
  qrisRevenue: number;
  cryptoRevenue: number;
  itemCounts: {
    churros: number;
    ricebowl: number;
    lemontea: number;
    paketHemat: number;
  };
}
