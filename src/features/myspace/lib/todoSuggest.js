/**
 * Bugüne alınabilecek işler (Bugünün odağı › öneri tepsisi): bugüne düşmemiş açık işler — tarihi
 * olmayan ya da ileri tarihli; önce yıldızlılar, sonra teslimi en yakın olan. Gecikmişler burada
 * değil (listede kehribarla duruyorlar). `exclude`: az önce bugüne alınanlar (cevap gelene kadar).
 */
export function suggestTasks(tasks, today, exclude = new Set()) {
  return (tasks ?? [])
    .filter((x) => !x.done && !exclude.has(x.id) && (!x.dueKey || x.dueKey > today))
    .sort((a, b) => {
      const star = (b.importance === "high") - (a.importance === "high")
      if (star) return star
      return (a.dueKey ?? "9999") < (b.dueKey ?? "9999") ? -1 : 1
    })
}

/**
 * Kaç öneri — bugünün AÇIK iş sayısına göre: gün boşken üç, ikiden fazla açık işte iki, beş ve
 * üstünde hiç (gün dolu). Öneriler listeyle aynı kaydırma alanında: kartın boyunu zorlamaz, ekleme
 * alanı dipte sabit kalır.
 */
export const suggestCount = (open) => (open >= 5 ? 0 : open >= 3 ? 2 : 3)
