/**
 * Görev ayrıntısındaki tek sayının modeli (`detail/TaskHero.jsx`): kişinin görevi açma nedeni
 * ya son tarihe kalan süre (gecikmeyse gecikme) ya da bittiyse ne zaman bittiği.
 * Gün anahtarı "YYYY-AA-GG" (`lib/todo.js` › `localDayKey` ile aynı biçim).
 */

export type HeroPhase = "done" | "overdue" | "today" | "upcoming"

export interface HeroTask {
  done?: boolean
  dueKey?: string | null
  doneAt?: string | null
  /** Bitiş günü (To Do bazen anı değil yalnız günü verir). */
  doneKey?: string | null
}

export interface TaskHeroModel {
  phase: HeroPhase
  /** Gecikmede geçen, yaklaşanda kalan gün (hep pozitif); bugün ve bitende 0. */
  days: number
  /** Bitende bitiş günü ile son tarih farkı: eksi erken, artı geç; tarihsiz ya da bilinmiyorsa null. */
  delta: number | null
  /** Bitiş anı (saat bundan yazılır); bilinmiyorsa null. */
  doneAt: Date | null
  /** Bitiş günü: anından, yoksa görevin kendi bitiş gününden; ikisi de yoksa null. */
  doneKey: string | null
}

const DAY = 86_400_000

/** İki gün anahtarı arası gün (b − a); saat dilimi oynamasın diye UTC gece yarısıyla. */
export function dayDiff(a: string, b: string): number {
  const at = (k: string) => {
    const [y, m, d] = k.split("-").map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((at(b) - at(a)) / DAY)
}

/** Anın yerel gün anahtarı. */
export function dayKeyOf(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/**
 * Kartın modeli; açık ve tarihsiz görevde kart yok (null) — anlatacak sayı yok, son tarih
 * satırı zaten "Ekle" diyor.
 */
export function taskHero(task: HeroTask, today: string): TaskHeroModel | null {
  if (task.done) {
    const at = task.doneAt ? new Date(task.doneAt) : null
    const doneAt = at && !Number.isNaN(at.getTime()) ? at : null
    const doneKey = doneAt ? dayKeyOf(doneAt) : (task.doneKey ?? null)
    const delta = doneKey && task.dueKey ? dayDiff(task.dueKey, doneKey) : null
    return { phase: "done", days: 0, delta, doneAt, doneKey }
  }
  if (!task.dueKey) return null
  const left = dayDiff(today, task.dueKey)
  const open = { delta: null, doneAt: null, doneKey: null }
  if (left < 0) return { phase: "overdue", days: -left, ...open }
  if (left === 0) return { phase: "today", days: 0, ...open }
  return { phase: "upcoming", days: left, ...open }
}
