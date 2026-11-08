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
 * Tepside kaç öneri — listenin satır sayısına göre (biten de satır): kart sabit boyda, ekleme
 * alanı dipte kalmalı. Liste boş ya da tek satırsa iki, iki satırsa bir, üç ve üstünde hiç.
 */
export const suggestCount = (rows) => (rows >= 3 ? 0 : rows === 2 ? 1 : 2)
