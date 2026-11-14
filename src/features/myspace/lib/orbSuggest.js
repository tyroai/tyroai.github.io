import { isWeekend } from "@/lib/brief"

const H = 3_600_000
/** Kartta sırayla gezilen en çok öneri ("Başka öneri"); kurulum önerisi bunun dışında. */
export const ORB_MAX = 6
/** Kendiliğinden geçişte her slaytın süresi (ürün sahibinin kararı: 5 sn). */
export const ORB_ROTATE_MS = 5000

const LOAD_MIN = 15 * 60
const LOAD_SOLO = 20 * 60
const LOAD_RISE = 1.25

/**
 * Toplantı yükü ağır mı: bu hafta en az 15 saat ve geçen haftadan en az %25 fazla; geçen hafta
 * boşsa (ya da takvim aralığının dışındaysa) en az 20 saat. `week`: `{ minutes, last }`.
 */
export const heavyWeek = (week) =>
  Boolean(week) &&
  week.minutes >= LOAD_MIN &&
  (week.last > 0 ? week.minutes >= week.last * LOAD_RISE : week.minutes >= LOAD_SOLO)

/**
 * Küre kartının önerileri ("Sana nasıl yardımcı olabilirim?" — eski "TYRO öneriyor" kartıyla tek
 * kart): o an gerçekten ilgili adımlar, önem sırasıyla; ilki görünür, ötekiler "Başka öneri"yle
 * gezilir. Saf, testli. Girdiler hazır hesaplanmış gelir (`useOrbSuggestions`).
 *
 * Hafta içi sıra: zamanı daralan (2 saat içindeki toplantıya hazırlık, 3 saat içinde biten Teams
 * toplantısının özeti) · 3 gün içinde seyahat · ağır toplantı haftası (pazartesi–perşembe,
 * `heavyWeek`) · bugün ≥ 90 dk boş odak · 21 gün içinde köprü tatili · günün dilimi (pazartesi
 * sabahı hafta planı, cuma öğleden sonra hafta özeti, sabah günü planla, akşam yarını planla) ·
 * Keşfet'te ≥ 3 yeni. Davet, posta ve To-Do işleri öneri DEĞİL: TYRO brifingi onları zaten
 * gösteriyor (ürün sahibinin kararı) — küre brifingin tekrarı olmasın.
 * Hafta sonu: seyahat, köprü, hafta özeti. Uygulama yüklü değilse (`install`) "Yükle" HEP İLK kart
 * (ürün sahibinin kararı) — sınırın dışında, iş önerisi onu itmez.
 */
export function orbSuggestions({
  now,
  events = [],
  free = null,
  trip = null,
  bridge = null,
  week = null,
  feed = 0,
  install = false,
}) {
  const date = new Date(now)
  const out = []
  const mine = events.filter((e) => !e.owner && !e.isAllDay && e.myResponse !== "declined")
  const soon = mine
    .filter((e) => e.start.getTime() > now && e.start.getTime() - now <= 2 * H)
    .sort((a, b) => a.start - b.start)[0]
  if (soon) out.push({ kind: "prepare", event: soon })
  const ended = mine
    .filter((e) => e.joinUrl && e.end.getTime() <= now && now - e.end.getTime() <= 3 * H)
    .sort((a, b) => b.end - a.end)[0]
  if (ended) out.push({ kind: "recap", event: ended })
  const weekend = isWeekend(date)
  const day = date.getDay()
  const hour = date.getHours()
  if (trip) out.push({ kind: "trip", trip })
  if (day >= 1 && day <= 4 && heavyWeek(week)) out.push({ kind: "load", ...week })
  if (!weekend && free) out.push({ kind: "focusFree", window: free })
  if (bridge) out.push({ kind: "bridge", bridge })
  if (weekend) out.push({ kind: "weekend" })
  else if (day === 1 && hour < 12) out.push({ kind: "weekPlan" })
  else if (day === 5 && hour >= 14) out.push({ kind: "weekWrap" })
  else if (hour < 11) out.push({ kind: "planDay" })
  else if (hour >= 17) out.push({ kind: "tomorrow" })
  if (feed >= 3) out.push({ kind: "feed", n: feed })
  const list = out.slice(0, ORB_MAX)
  if (install) list.unshift({ kind: "install" })
  return list
}

/**
 * Kartın slaytları: kurulum önerisi varsa o ilk, sonra o gün çevrede kutlama varsa o
 * (`colleagues`), sonra öneriler kendi sırasıyla. Kişinin kendi günü (sahne) slayt değil, kartın
 * tamamı.
 */
export function orbSlides(list, colleagues) {
  if (!colleagues) return list
  const [first, ...rest] = list
  return first?.kind === "install"
    ? [first, { kind: "colleagues" }, ...rest]
    : [{ kind: "colleagues" }, ...list]
}

/** Zamanı daralan öneri mi (kutlama kartının da önüne geçer). */
export const isUrgent = (s) => s?.kind === "prepare" || s?.kind === "recap"
