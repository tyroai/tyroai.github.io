/**
 * Kurum mesaisi (saat, ondalıklı: 17.5 = 17:30): odak penceresi, haftanın toplantı yükü ve takvimde
 * resmî tatilin saat bloğu aynı sınırlardan okur. Arife yarım gün: `eveFrom`'dan mesai bitimine.
 */
export const WORK_HOURS = Object.freeze({ from: 8, to: 17.5, eveFrom: 13 })

/** `date`in saatini ondalıklı saate kurar (17.5 → 17:30); `setHours(17.5)` küsuratı atar. */
export function setClock(date, hours) {
  date.setHours(0, Math.round(hours * 60), 0, 0)
  return date
}
