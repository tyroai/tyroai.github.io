/**
 * Ufukta — kişinin hedefleri ve kilometre taşları: seçtiği To Do listelerindeki TARİHLİ görevler.
 * Saf kurallar (testli); okuma `horizonSource.js`, önbellek ve ayarlar widget'ın deposunda.
 */

/** Aynı anda izlenen en çok liste — her liste bir Graph sorgusu. */
export const HORIZON_MAX_LISTS = 6
/** Tamamlananlar açıksa listenin sonunda en çok bu kadarı (en yeni önce). */
export const DONE_MAX = 6

/** Kayıtlı ayar: liste kimlikleri (tekil, en çok 6) ve tamamlananları göster. */
export function sanitizeHorizon(raw) {
  const lists = []
  for (const id of Array.isArray(raw?.lists) ? raw.lists : []) {
    if (typeof id === "string" && id && !lists.includes(id)) lists.push(id)
    if (lists.length >= HORIZON_MAX_LISTS) break
  }
  return { lists, done: raw?.done === true }
}

const DAY_MS = 86_400_000
const parts = (key) => [Number(key.slice(0, 4)), Number(key.slice(5, 7)), Number(key.slice(8, 10))]
const utcOf = (key) => {
  const [y, m, d] = parts(key)
  return Date.UTC(y, m - 1, d)
}

/** İki takvim günü arası gün (yaz saatinden bağımsız). */
export const daysBetween = (fromKey, toKey) => Math.round((utcOf(toKey) - utcOf(fromKey)) / DAY_MS)

/** Tam ay farkı (gün henüz gelmediyse bir eksik). */
function monthsBetween(fromKey, toKey) {
  const [y1, m1, d1] = parts(fromKey)
  const [y2, m2, d2] = parts(toKey)
  const raw = (y2 - y1) * 12 + (m2 - m1)
  return raw - (d2 < d1 ? 1 : 0)
}

/**
 * Kalan (ya da geçen) zaman, kısa: bugün · yarın · 99 güne kadar gün · 2 yıla kadar ay · sonra yıl.
 * `{ kind: "today" | "tomorrow" | null, late, unit, n }`.
 */
export function countdown(today, dueKey) {
  const d = daysBetween(today, dueKey)
  if (d === 0) return { kind: "today", late: false, unit: "day", n: 0 }
  if (d === 1) return { kind: "tomorrow", late: false, unit: "day", n: 1 }
  const late = d < 0
  const abs = Math.abs(d)
  if (abs < 100) return { kind: null, late, unit: "day", n: abs }
  const months = Math.abs(late ? monthsBetween(dueKey, today) : monthsBetween(today, dueKey))
  if (months < 24) return { kind: null, late, unit: "month", n: Math.max(1, months) }
  return { kind: null, late, unit: "year", n: Math.floor(months / 12) }
}

/** Görevin adımları: `{ done, total }`; adım yoksa ya da bilinmiyorsa `null`. */
export function stepsProgress(steps) {
  if (!Array.isArray(steps) || !steps.length) return null
  return { done: steps.filter((s) => s.done).length, total: steps.length }
}

/** To-Do panosunun görevi (`toBoardTask`) + liste adı → kilometre taşı; tarihsiz görev `null`. */
export function toMilestone(task, listName) {
  if (!task?.id || !task.dueKey) return null
  return {
    id: task.id,
    listId: task.listId,
    listName: String(listName ?? ""),
    title: task.title,
    dueKey: task.dueKey,
    done: task.done,
    note: task.note ?? "",
    steps: task.steps,
    importance: task.importance,
  }
}

const byDue = (a, b) =>
  a.dueKey < b.dueKey ? -1 : a.dueKey > b.dueKey ? 1 : a.title.localeCompare(b.title)

/**
 * Zaman çizelgesinin sırası: açık hedefler tarih sırasıyla (gecikmiş olanlar en üstte, sonra
 * yaklaşanlar), tamamlananlar (`done` açıksa ya da bu oturumda bitirildiyse) sonda, en yenisi önce.
 * `next`: bugün ya da sonrasındaki ilk açık hedef — kartta vurgulanan.
 */
export function arrangeMilestones(items, today, { done = false, kept = null } = {}) {
  const open = []
  const finished = []
  for (const x of items) {
    if (!x.done) open.push(x)
    else if (done || kept?.has(x.id)) finished.push(x)
  }
  open.sort(byDue)
  finished.sort((a, b) => byDue(b, a))
  const next = open.find((x) => x.dueKey >= today) ?? null
  return {
    list: [...open, ...finished.slice(0, Math.max(DONE_MAX, kept?.size ?? 0))],
    next,
    late: open.filter((x) => x.dueKey < today).length,
  }
}

/** Son hafta: bu kadar gün kala adımların yarısı bitmemişse hedef riskte. */
export const PACE_LAST_DAYS = 7

/**
 * Hedefin temposu: `{ kind: "late" }` (tarihi geçti) · `{ kind: "risk", why }` · `{ kind: "ok" }`
 * ya da `null` (bitti ya da adımı yok — adımsız hedefte sahte "Riskte" çıkmaz). Riskte:
 * - `why: "steps"`: kalan adım, bugün dahil kalan günden fazla (günde bir adım bile yetmiyor);
 * - `why: "week"`: son yedi güne girildi, adımların yarısı bile bitmedi.
 */
export function paceOf(item, today) {
  if (!item?.dueKey || item.done) return null
  const left = daysBetween(today, item.dueKey)
  if (left < 0) return { kind: "late" }
  const progress = stepsProgress(item.steps)
  if (!progress) return null
  const remaining = progress.total - progress.done
  if (remaining > 0 && remaining > left + 1) return { kind: "risk", why: "steps" }
  if (remaining > 0 && left < PACE_LAST_DAYS && progress.done * 2 < progress.total)
    return { kind: "risk", why: "week" }
  return { kind: "ok" }
}

/** Header'daki kısa bilgi: sıradaki hedef (yoksa en eski gecikmiş). */
export function headlineMilestone(items, today) {
  const { list, next } = arrangeMilestones(items, today)
  return next ?? list.find((x) => !x.done) ?? null
}
