/**
 * Takvimden çıkan bağlantılar (saf, testli). Yeni toplantı artık bağlantı değil, takvimin üstünde
 * açılan bir pencere (`features/calendar/lib/meeting.js`); izin formu ve kaydı da öyle (`useLeaveDeskState`).
 */

const enc = encodeURIComponent

/** To-Do'da görev paneli; iyimser (`tmp-`) kimlikler henüz yok, bağlantı verilmez. */
export const todoTaskUrl = (id) =>
  id && !String(id).startsWith("tmp-") ? `/todo?task=${enc(id)}` : null
