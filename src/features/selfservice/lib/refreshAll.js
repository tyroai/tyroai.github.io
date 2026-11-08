/**
 * Self Servis'in tek "Yenile"si: ERP verisi (izin, masraf, avans, bakiye — özet kartı ve üç
 * kayıt sekmesi). Düğme ERP'nin `busy`sini izler (ERP yenilemesi söz döndürmez).
 */
export function refreshAll(refreshErp) {
  return refreshErp()
}
