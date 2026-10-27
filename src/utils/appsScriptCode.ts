/**
 * Template & Panduan Google Apps Script untuk Kasir Kilat
 * Digunakan agar semua perangkat (HP, laptop, tablet) dan semua akun (bahkan tanpa login Google)
 * dapat otomatis mengirim data transaksi ke Google Spreadsheet target.
 */

export const TARGET_SPREADSHEET_ID = '16ArEllCS8-ZidNx9N0TADUCvZ7jU9hrb2Zu88zf7vQo';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?usp=sharing`;
export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyqcIeygg-Jlyf5kbPPmYIzcbAHav_vL9Go57EVuB7ib_3bK3P5bTif3iGQdaAKUVuz/exec';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =====================================================================
 * KASIR KILAT - GOOGLE APPS SCRIPT WEBHOOK SYNC ENGINE
 * Spreadsheet ID: ${TARGET_SPREADSHEET_ID}
 * =====================================================================
 * 
 * CARA PASANG (HANYA 1 MENIT):
 * 1. Buka spreadsheet: 
 *    ${TARGET_SPREADSHEET_URL}
 * 2. Di menu atas Google Sheets, klik:
 *    Ekstensi (Extensions) > Apps Script
 * 3. Hapus semua teks yang ada di editor Apps Script, lalu TEMPEL (PASTE) seluruh kode ini.
 * 4. Klik tombol "Simpan" (ikon disket) atau Ctrl+S.
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan baru" (New deployment).
 * 6. Di jendela yang muncul:
 *    - Klik ikon gerigi di sebelah 'Select type' > pilih "Web app" (Aplikasi Web).
 *    - Keterangan (Description): Webhook Kasir Kilat
 *    - Jalankan sebagai (Execute as): "Saya" / "Me" (email pemilik sheet)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" / "Anyone"  <-- WAJIB PILIH INI!
 * 7. Klik "Terapkan" (Deploy).
 *    (Jika diminta izin akses Google, klik 'Beri Akses' -> 'Lanjutan' -> 'Buka Kasir Kilat (tidak aman)' -> 'Izinkan').
 * 8. SALIN "URL Aplikasi Web" (URL berakhiran /exec).
 * 9. Tempelkan URL tersebut ke Pengaturan Google Sheets di aplikasi Kasir.
 * 
 * SELESAI! Sekarang semua kasir dari HP/komputer/akun manapun langsung masuk ke spreadsheet ini otomatis!
 */

var TARGET_SHEET_ID = "${TARGET_SPREADSHEET_ID}";

function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
  var sheet = ss.getSheetByName("Transaksi");
  if (!sheet) {
    sheet = ss.insertSheet("Transaksi");
    sheet.appendRow([
      "Waktu Transaksi",
      "ID Transaksi",
      "Nama Pelanggan",
      "Rincian Barang",
      "Total Qty",
      "Total Bayar (Rp)",
      "Metode Pembayaran",
      "Status",
      "Catatan"
    ]);
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Tunggu antrean jika ada banyak kasir transaksi bersamaan
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server sibuk memproses transaksi lain, silakan coba beberapa detik lagi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var sheet = getOrCreateSheet();
    var payload;
    
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      payload = {};
    }

    // Kasus 1: Batch rows (antrean offline)
    if (payload.action === "batchAppend" && Array.isArray(payload.rows)) {
      payload.rows.forEach(function(row) {
        sheet.appendRow(row);
      });
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        syncedCount: payload.rows.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Kasus 2: Transaksi tunggal (row array)
    if (payload.row && Array.isArray(payload.row)) {
      sheet.appendRow(payload.row);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "appendRow"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Kasus 3: Transaksi objek terstruktur
    if (payload.tx) {
      var tx = payload.tx;
      var itemsSummary = Array.isArray(tx.items)
        ? tx.items.map(function(i) { return i.name + " (x" + i.quantity + ")"; }).join(", ")
        : "";
      var row = [
        tx.displayTime || new Date().toLocaleString("id-ID"),
        tx.id || ("TRX-" + Date.now()),
        tx.customerName || "Pelanggan Umum",
        itemsSummary,
        tx.totalItemsCount || 0,
        tx.total || 0,
        tx.paymentMethod || "CASH",
        tx.statusText || "LUNAS",
        tx.note || "-"
      ];
      sheet.appendRow(row);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        txId: tx.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Data transaksi tidak valid"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    sheetId: TARGET_SHEET_ID,
    message: "Kasir Kilat Sync Webhook aktif dan siap menerima data pembayaran!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
