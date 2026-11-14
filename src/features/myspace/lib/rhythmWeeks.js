/**
 * Toplantı ritminin haftası: geçen · bu · gelecek hafta. Bir hafta aralığın dışına taşarsa seçenek
 * hiç sunulmaz (gerekçe `meetingLoad`ta); seçili kalmışsa bu haftaya düşer. Seçim yerel (sayfa
 * yeniden açılınca bu hafta) — bir bakış ayarı, tercih değil.
 */
export function rhythmWeeks(load, week, t) {
  const weeks = [
    load.previous && { id: "previous", label: t("myspace.rhythm.lastWeek") },
    { id: "current", label: t("myspace.rhythm.thisWeek") },
    load.next && { id: "next", label: t("myspace.rhythm.nextWeek") },
  ].filter(Boolean)
  const id = weeks.some((w) => w.id === week) ? week : "current"
  const days = id === "previous" ? load.previous : id === "next" ? load.next : load.current
  return { weeks, id, days }
}
