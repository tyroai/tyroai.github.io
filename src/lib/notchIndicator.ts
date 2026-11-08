/**
 * Çentik yuvasının kısa göstergesi (posta ve takvimin sayısı gibi): widget'ın elde olan verisinden
 * tek bakışlık değer. Saf ve testli; veriyi kancalar getirir (`notch/SlotIndicator`), yeni istek yok.
 *
 * Gösterge üç türlü: `count` sayı rozeti + dolan halka (posta gibi "bekleyen iş"), `text` kısa
 * değer hapı ("14°", "09:41", "3/7"), `dot` canlı nokta (radyo çalıyor). `sr` ekran okuyucunun
 * duyduğu tam cümle; `alert` düğmeyi "sıcak" yapar (gecikmiş iş, yaklaşan toplantı).
 */
export interface NotchIndicator {
  text?: string
  count?: number
  dot?: boolean
  sr: string
  alert?: boolean
}

/** Hapın en çok karakteri: ray 72 px, hap çemberin üstünü kapatmasın. */
export const IND_MAX_CHARS = 7

/** Derece: "14°"; yuvarlanınca −0 çıkmasın. Sayı değilse `null`. */
export function tempText(temp: unknown): string | null {
  if (typeof temp !== "number" || !Number.isFinite(temp)) return null
  const n = Math.round(temp)
  return `${n === 0 ? 0 : n}°`
}

/** Hapa sığmayan metin gösterilmez (yarım değer yanıltır; ekran okuyucu yine de düğme adından duyar). */
export function fitText(text: string | null | undefined): string | null {
  if (!text) return null
  return [...text].length <= IND_MAX_CHARS ? text : null
}

interface FocusTask {
  done?: boolean
  overdue?: boolean
}

/** Bugünün odağı: biten, toplam, geciken. Liste boşsa `null` (gösterge yok). */
export function focusTally(tasks: readonly FocusTask[] | null | undefined) {
  if (!tasks?.length) return null
  const done = tasks.filter((x) => x.done).length
  const late = tasks.filter((x) => !x.done && x.overdue).length
  return { done, total: tasks.length, late }
}

interface CalEvent {
  start: Date
  owner?: unknown
  isAllDay?: boolean
  myResponse?: string
}

/**
 * Sıradaki kendi toplantım, ancak `withinMs` içindeyse (macOS'un takvim uygulamaları gibi):
 * paylaşılan takvimin, tüm günün ve reddedilenin dışında. Yoksa `null`.
 */
export function nextSoonMeeting<E extends CalEvent>(
  events: readonly E[] | null | undefined,
  now: number,
  withinMs: number,
): E | null {
  let best: E | null = null
  for (const e of events ?? []) {
    if (e.owner || e.isAllDay || e.myResponse === "declined") continue
    const at = e.start.getTime()
    if (at <= now || at - now >= withinMs) continue
    if (!best || at < best.start.getTime()) best = e
  }
  return best
}

const REQUEST_LISTS = ["leaves", "expenses", "advances"] as const

/** Self Servis'te onay bekleyen talep sayısı (izin, masraf, iş avansı). Veri yoksa `null`. */
export function pendingRequestCount(
  data: Partial<Record<(typeof REQUEST_LISTS)[number], { statusKind?: string }[] | null>> | null,
): number | null {
  if (!data) return null
  let n = 0
  for (const list of REQUEST_LISTS)
    for (const r of data[list] ?? []) if (r.statusKind === "pending") n += 1
  return n
}
