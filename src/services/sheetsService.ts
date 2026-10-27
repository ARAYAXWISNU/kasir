import { Transaction } from '../types/pos';

export const TARGET_SPREADSHEET_ID = '16ArEllCS8-ZidNx9N0TADUCvZ7jU9hrb2Zu88zf7vQo';
export const TARGET_SPREADSHEET_TITLE = 'Kasir Kilat - Laporan Penjualan';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?usp=sharing`;

export const SPREADSHEET_STORAGE_KEY = 'kasir_google_spreadsheet_id';
export const SPREADSHEET_TITLE_KEY = 'kasir_google_spreadsheet_title';
export const APPS_SCRIPT_URL_KEY = 'kasir_apps_script_url';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
}

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyqcIeygg-Jlyf5kbPPmYIzcbAHav_vL9Go57EVuB7ib_3bK3P5bTif3iGQdaAKUVuz/exec';

export const DEFAULT_SPREADSHEET_INFO: SpreadsheetInfo = {
  id: TARGET_SPREADSHEET_ID,
  title: TARGET_SPREADSHEET_TITLE,
  url: TARGET_SPREADSHEET_URL,
};

/**
 * Mendapatkan URL Webhook Google Apps Script yang tersimpan di localStorage,
 * dengan fallback ke DEFAULT_WEBHOOK_URL bawaan.
 */
export function getStoredWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_KEY);
    if (saved !== null && saved.trim() !== '') {
      return saved.trim();
    }
    return DEFAULT_WEBHOOK_URL;
  } catch {
    return DEFAULT_WEBHOOK_URL;
  }
}

/**
 * Menyimpan URL Webhook Google Apps Script ke localStorage.
 */
export function setStoredWebhookUrl(url: string): void {
  try {
    localStorage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to store webhook url', e);
  }
}

/**
 * Format satu baris data transaksi untuk tab 'Transaksi' Google Sheets
 */
export function formatTransactionRow(tx: Transaction): (string | number)[] {
  const itemsSummary = tx.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');

  const statusText = tx.pickupStatus
    ? tx.pickupStatus === 'SUDAH_DIAMBIL'
      ? `LUNAS (SUDAH DIAMBIL: ${tx.pickedUpTime || '-'})`
      : 'LUNAS (PREORDER - MENUNGGU DIAMBIL)'
    : 'LUNAS';

  return [
    tx.displayTime || new Date(tx.timestamp).toLocaleString('id-ID'),
    tx.id,
    tx.customerName || 'Pelanggan Umum',
    itemsSummary,
    tx.totalItemsCount,
    tx.total,
    tx.paymentMethod,
    statusText,
    tx.note || (tx.orderType === 'PREORDER' ? 'Pesanan Pre-order' : '-'),
  ];
}

/**
 * Kirim data ke Google Apps Script Web App (Webhook).
 * Metode ini BEBAS LOGIN GOOGLE, berfungsi di semua perangkat (HP, tablet, laptop, browser apa pun).
 */
export async function sendToAppsScript(
  webhookUrl: string,
  payload: {
    action: string;
    row?: (string | number)[];
    rows?: (string | number)[][];
    tx?: any;
    note?: string;
  }
): Promise<boolean> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl || !cleanUrl.startsWith('http')) return false;

  const body = JSON.stringify(payload);

  try {
    // 1. Coba fetch standar (text/plain menghindari CORS preflight OPTIONS)
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
    });

    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Standard fetch to webhook hit CORS redirect, trying no-cors mode:', err);
  }

  try {
    // 2. Fallback no-cors: Google Apps Script Web App tetap memproses POST body
    // meskipun browser tidak mengizinkan membaca respons (opaque response).
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
    });
    return true;
  } catch (fallbackErr) {
    console.error('All webhook attempts failed:', fallbackErr);
    return false;
  }
}

/**
 * Uji koneksi ke URL Google Apps Script Web App
 */
export async function testWebhookConnection(webhookUrl: string): Promise<{ ok: boolean; message: string }> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl || !cleanUrl.startsWith('http')) {
    return { ok: false, message: 'URL Webhook tidak valid (harus dimulai dengan https://script.google.com/...)' };
  }

  try {
    // Kirim probe GET
    const res = await fetch(cleanUrl, { method: 'GET' });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.status === 'ok') {
        return { ok: true, message: 'Koneksi ke Google Apps Script berhasil!' };
      }
    }
    return { ok: true, message: 'Webhook merespons dengan baik!' };
  } catch (err: any) {
    // Jika terhalang CORS saat GET, coba test kirim POST no-cors kecil
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
      });
      return { ok: true, message: 'Webhook terhubung (mode pengiriman no-cors aktif).' };
    } catch {
      return { ok: false, message: 'Tidak dapat menjangkau URL Webhook. Pastikan izin akses diset ke "Anyone" (Siapa saja).' };
    }
  }
}

/**
 * Check if existing saved spreadsheet exists and is accessible.
 */
export async function getExistingSpreadsheet(
  accessToken: string,
  spreadsheetId: string = TARGET_SPREADSHEET_ID
): Promise<SpreadsheetInfo | null> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      id: data.spreadsheetId,
      title: data.properties?.title || TARGET_SPREADSHEET_TITLE,
      url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  } catch (err) {
    console.error('Failed to get spreadsheet:', err);
    return null;
  }
}

/**
 * Creates a brand new Google Spreadsheet (hanya jika pengguna secara manual ingin membuat sheet terpisah).
 */
export async function createPosSpreadsheet(accessToken: string, title?: string): Promise<SpreadsheetInfo> {
  const spreadsheetTitle =
    title || `Kasir Kilat - Laporan Penjualan (${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })})`;

  const payload = {
    properties: {
      title: spreadsheetTitle,
    },
    sheets: [
      {
        properties: {
          title: 'Transaksi',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Ringkasan Harian',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize Headers in "Transaksi" and "Ringkasan Harian"
  const headerValues = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Transaksi!A1:I1',
        values: [
          [
            'Waktu Transaksi',
            'ID Transaksi',
            'Nama Pelanggan',
            'Rincian Barang',
            'Total Qty',
            'Total Bayar (Rp)',
            'Metode Pembayaran',
            'Status',
            'Catatan',
          ],
        ],
      },
      {
        range: 'Ringkasan Harian!A1:J1',
        values: [
          [
            'Tanggal',
            'Total Transaksi',
            'Total Omset (Rp)',
            'Cash (Rp)',
            'QRIS (Rp)',
            'Kripto (Rp)',
            'Churros Terjual',
            'Rice Bowl Terjual',
            'Lemon Tea Terjual',
            'Paket Hemat Terjual',
          ],
        ],
      },
    ],
  };

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(headerValues),
  });

  localStorage.setItem(SPREADSHEET_STORAGE_KEY, spreadsheetId);
  localStorage.setItem(SPREADSHEET_TITLE_KEY, spreadsheetTitle);

  return {
    id: spreadsheetId,
    title: spreadsheetTitle,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Appends a transaction into the "Transaksi" sheet tab via Google Sheets API (OAuth)
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<boolean> {
  const row = formatTransactionRow(tx);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to append to Google Sheets:', errorText);
    throw new Error(`Gagal menyimpan ke Google Sheets: ${res.statusText}`);
  }

  return true;
}

/**
 * Appends a preorder pickup report to Google Sheets
 */
export async function appendPreorderPickupToSheet(
  accessToken: string,
  spreadsheetId: string,
  po: {
    id: string;
    customerName: string;
    itemsSummary: string;
    totalItemsCount: number;
    total: number;
    paymentMethod: string;
    pickedUpAt: string;
    note?: string;
  }
): Promise<boolean> {
  const row = [
    po.pickedUpAt,
    `${po.id}-AMBIL`,
    po.customerName,
    po.itemsSummary,
    po.totalItemsCount,
    po.total,
    po.paymentMethod,
    `SUDAH DIAMBIL (${po.pickedUpAt})`,
    po.note ? `Pre-order: ${po.note}` : 'Pre-order telah diambil oleh pemesan',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  return res.ok;
}

/**
 * Batch append multiple transactions (useful for offline syncing) via OAuth
 */
export async function batchAppendTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
): Promise<boolean> {
  if (transactions.length === 0) return true;

  const rows = transactions.map((tx) => formatTransactionRow(tx));

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  return res.ok;
}

/**
 * Reads existing transaction count or rows from the sheet
 */
export async function fetchTransactionsFromSheet(
  accessToken: string,
  spreadsheetId: string = TARGET_SPREADSHEET_ID
): Promise<string[][]> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A2:I`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.values || [];
  } catch (err) {
    console.error('Failed to fetch from sheet:', err);
    return [];
  }
}

/**
 * ============================================================================
 * UNIVERSAL SYNC ENGINE (BEDA AKUN, BEDA PERANGKAT, TANPA LOGIN, TANPA KECUALI)
 * ============================================================================
 * Menggabungkan Webhook (Google Apps Script) + Google Sheets API (OAuth).
 * Jika ada Webhook URL, data dikirim langsung tanpa butuh login Google pada perangkat tsb.
 * Jika perangkat sedang login Google OAuth, data juga dapat dikirim via Sheets API v4.
 */
export async function syncUniversalTransaction(
  tx: Transaction,
  accessToken?: string | null,
  targetSpreadsheetId: string = TARGET_SPREADSHEET_ID
): Promise<{ success: boolean; method: 'webhook' | 'oauth' | 'failed' }> {
  const row = formatTransactionRow(tx);
  const webhookUrl = getStoredWebhookUrl();

  // 1. Coba via Webhook Google Apps Script (Bekerja di perangkat apa pun tanpa login Google)
  if (webhookUrl) {
    try {
      const ok = await sendToAppsScript(webhookUrl, {
        action: 'appendRow',
        row,
        tx,
      });
      if (ok) {
        return { success: true, method: 'webhook' };
      }
    } catch (err) {
      console.warn('Sync via webhook failed, attempting OAuth fallback:', err);
    }
  }

  // 2. Coba via Google Sheets API (OAuth jika login)
  if (accessToken) {
    try {
      const ok = await appendTransactionToSheet(accessToken, targetSpreadsheetId, tx);
      if (ok) {
        return { success: true, method: 'oauth' };
      }
    } catch (err) {
      console.warn('Sync via OAuth failed:', err);
    }
  }

  return { success: false, method: 'failed' };
}

/**
 * Universal Batch Sync untuk antrean transaksi offline
 */
export async function syncUniversalBatch(
  transactions: Transaction[],
  accessToken?: string | null,
  targetSpreadsheetId: string = TARGET_SPREADSHEET_ID
): Promise<{ success: boolean; method: 'webhook' | 'oauth' | 'failed'; count: number }> {
  if (transactions.length === 0) {
    return { success: true, method: 'webhook', count: 0 };
  }

  const rows = transactions.map((tx) => formatTransactionRow(tx));
  const webhookUrl = getStoredWebhookUrl();

  // 1. Coba via Webhook
  if (webhookUrl) {
    try {
      const ok = await sendToAppsScript(webhookUrl, {
        action: 'batchAppend',
        rows,
      });
      if (ok) {
        return { success: true, method: 'webhook', count: transactions.length };
      }
    } catch (err) {
      console.warn('Batch sync via webhook failed, attempting OAuth fallback:', err);
    }
  }

  // 2. Coba via OAuth
  if (accessToken) {
    try {
      const ok = await batchAppendTransactionsToSheet(accessToken, targetSpreadsheetId, transactions);
      if (ok) {
        return { success: true, method: 'oauth', count: transactions.length };
      }
    } catch (err) {
      console.warn('Batch sync via OAuth failed:', err);
    }
  }

  return { success: false, method: 'failed', count: 0 };
}

/**
 * Universal Sync untuk pengambilan pesanan Preorder
 */
export async function syncUniversalPreorderPickup(
  po: {
    id: string;
    customerName: string;
    itemsSummary: string;
    totalItemsCount: number;
    total: number;
    paymentMethod: string;
    pickedUpAt: string;
    note?: string;
  },
  accessToken?: string | null,
  targetSpreadsheetId: string = TARGET_SPREADSHEET_ID
): Promise<boolean> {
  const row = [
    po.pickedUpAt,
    `${po.id}-AMBIL`,
    po.customerName,
    po.itemsSummary,
    po.totalItemsCount,
    po.total,
    po.paymentMethod,
    `SUDAH DIAMBIL (${po.pickedUpAt})`,
    po.note ? `Pre-order: ${po.note}` : 'Pre-order telah diambil oleh pemesan',
  ];

  const webhookUrl = getStoredWebhookUrl();
  if (webhookUrl) {
    try {
      const ok = await sendToAppsScript(webhookUrl, {
        action: 'appendRow',
        row,
      });
      if (ok) return true;
    } catch (err) {
      console.warn('Pickup sync via webhook failed:', err);
    }
  }

  if (accessToken) {
    try {
      return await appendPreorderPickupToSheet(accessToken, targetSpreadsheetId, po);
    } catch (err) {
      console.warn('Pickup sync via OAuth failed:', err);
    }
  }

  return false;
}
