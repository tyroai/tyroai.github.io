/**
 * Takvimin izin masasının saf kuralları (testli): hangi kaydın ayrıntısı açık, ERP'ye az önce
 * yazılan iznin önizlemesi. Pencereleri ve veriyi `features/calendar/useLeaveDeskState.js` bağlar.
 */

/**
 * Açık kaydın ekranda gösterilecek hâli. `open`: `{ id }` (listeden ya da çipten; kayıt güncel
 * listeden okunur, kalkmışsa pencere kapanır) ya da `{ preview }` ("Kaydı göster": kayıt listeye
 * gelene dek az önce yazılan hâli, gelince ERP'deki hâli — `arrived`).
 */
export function openedRecord(open, leaves, arrived) {
  if (!open) return null
  if (open.id != null) return leaves?.find((r) => r.id === open.id) ?? null
  return arrived ?? open.preview ?? null
}

/**
 * ERP'ye yazılan iznin önizlemesi (`erpRecord`): kayıt henüz listede yok, kimliği ve numarası
 * yok; izin satırının durumu ERP'de de boş (`statusKind: "none"`).
 */
export function leavePreview(record) {
  return record ? { ...record, id: "new-leave", number: null, statusKind: "none" } : null
}
