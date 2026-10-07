import { Transaction } from '../types/pos';

export const SPREADSHEET_STORAGE_KEY = 'kasir_google_spreadsheet_id';
export const SPREADSHEET_TITLE_KEY = 'kasir_google_spreadsheet_title';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
}

/**
 * Check if existing saved spreadsheet exists and is accessible.
 */
export async function getExistingSpreadsheet(accessToken: string, spreadsheetId: string): Promise<SpreadsheetInfo | null> {
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
      title: data.properties?.title || 'Kasir Kilat Spreadsheet',
      url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  } catch (err) {
    console.error('Failed to get spreadsheet:', err);
    return null;
  }
}

/**
 * Creates a brand new Google Spreadsheet with structured tables for POS transactions and daily summary.
 */
export async function createPosSpreadsheet(accessToken: string, title?: string): Promise<SpreadsheetInfo> {
  const spreadsheetTitle = title || `Kasir Kilat - Laporan Penjualan (${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })})`;

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

  // Save to localStorage for convenience
  localStorage.setItem(SPREADSHEET_STORAGE_KEY, spreadsheetId);
  localStorage.setItem(SPREADSHEET_TITLE_KEY, spreadsheetTitle);

  return {
    id: spreadsheetId,
    title: spreadsheetTitle,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Appends a transaction into the "Transaksi" sheet tab
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<boolean> {
  const itemsSummary = tx.items.map(i => `${i.name} (x${i.quantity})`).join(', ');

  const statusText = tx.pickupStatus
    ? tx.pickupStatus === 'SUDAH_DIAMBIL'
      ? `LUNAS (SUDAH DIAMBIL: ${tx.pickedUpTime || '-'})`
      : 'LUNAS (PREORDER - MENUNGGU DIAMBIL)'
    : 'LUNAS';

  const row = [
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
 * Batch append multiple transactions (useful for offline syncing)
 */
export async function batchAppendTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
): Promise<boolean> {
  if (transactions.length === 0) return true;

  const rows = transactions.map(tx => {
    const itemsSummary = tx.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
    return [
      tx.displayTime || new Date(tx.timestamp).toLocaleString('id-ID'),
      tx.id,
      tx.customerName || 'Pelanggan Umum',
      itemsSummary,
      tx.totalItemsCount,
      tx.total,
      tx.paymentMethod,
      'LUNAS',
      tx.note || '-',
    ];
  });

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
  spreadsheetId: string
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
