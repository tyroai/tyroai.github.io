/**
 * Master kartın durum seçicisi (saf, testli). Anasayfa'nın zaten okuduğu sinyallerden (takvim, günün
 * okuması, To Do, posta, Ticket, izin, saat) aday durumlar çıkar; her aday bir DURUM + KISA ÖNERİ
 * cümlesidir, sayım değil (sayımlar TYRO brifinginde). İki sinyali bağlayan aday tek sinyallikten
 * önce gelir ("İznin yaklaşıyor ama gecikmiş işler birikmiş; önce onları kapat."). Seçim: puan
 * sırası, her gruptan bir aday; önerinin (kapsül) konusu satırda tekrar edilmez.
 * Hava satırı (yalnız gerçek bir öneri varsa) bu seçimin dışında, ilk satır (`useHelloChat`).
 */

export type Group = "now" | "work" | "day" | "ahead" | "time" | "calm"

export interface Signals {
  now: Date
  weekend: boolean
  /** O anki toplantı (`meetingLine`). */
  meeting: { key: "now" | "imminent" | "soon" } | null
  /** Günün okumasının hikâyesi var mı (`dayInsight`). */
  day: boolean
  /** Günün okumasının kimliği (`nextEarly` …): okuma zaten söylüyorsa aynı satır çıkmaz. */
  dayKey?: string | null
  /** Bugün kalan toplantı sayısı (hikâye yoksa). */
  left: number
  /** Önerilen odak aralığı ("13:30–15:30"), yoksa boş. */
  freeRange: string | null
  /** Yaklaşan izin (`leaveAhead`). */
  leave: { days: number } | null
  overdue: number
  invites: number
  importantMail: number
  tibotLate: number
  /** Yarının ilk toplantısının başlangıcı. */
  tomorrowFirst: Date | null
  /** TYRO'nun önerisinin konusu (`chatOffer` › key ya da günün okumasının işareti). */
  offerKey: string | null
}

export interface Situation {
  id: string
  group: Group
  score: number
  /** Seçilince bu grupları da kapatır (iki sinyali birden söyleyen aday). */
  covers?: Group[]
}

const MEET_ID = { now: "meetNow", imminent: "meetImminent", soon: "meetSoon" } as const
const LUNCH = [12 * 60, 13 * 60 + 30]
const EVENING = 18 * 60
const EARLY_START = 9 * 60 + 30

/** Bütün adaylar (puanlı). */
export function situations(s: Signals): Situation[] {
  const out: Situation[] = []
  const add = (id: string, group: Group, score: number, covers?: Group[]) =>
    out.push({ id, group, score, ...(covers ? { covers } : {}) })
  const mins = s.now.getHours() * 60 + s.now.getMinutes()
  const weekday = s.now.getDay()
  const workday = !s.weekend
  const evening = workday && mins >= EVENING

  // Şimdi: sürmekte olan ya da yaklaşan toplantı her şeyden önce.
  if (s.meeting)
    add(MEET_ID[s.meeting.key], "now", { now: 95, imminent: 92, soon: 75 }[s.meeting.key])

  // İş: iki sinyali bağlayanlar önce. Hafta sonu iş satırı yok — "işler pazartesi de bekler".
  if (workday && s.overdue && s.leave && s.leave.days <= 5)
    add("overdueLeave", "ahead", 80, ["work"])
  if (s.overdue && s.freeRange && workday && !evening) add("overdueWindow", "work", 70)
  if (s.overdue && weekday === 5 && mins >= 14 * 60) add("overdueFriday", "work", 66, ["time"])
  if (workday && s.tibotLate) add("tibot", "work", 58)
  if (s.importantMail && workday) add(mins < 12 * 60 ? "mailMorning" : "mail", "work", 55)
  if (workday && s.overdue) add("overdue", "work", 50)
  if (s.invites && workday) add("invites", "work", 45)

  // Gün: günün okuması (çekmecenin cümlesi), yoksa kalan toplantılar.
  if (s.day) add("day", "day", 60)
  else if (s.left) add("left", "day", 40)

  // Önümüzdeki günler.
  if (s.leave) add("leave", "ahead", s.leave.days <= 3 ? 72 : 52)
  // "Yarın erken başlıyorsun, ilk toplantı 08:30." günün okumasıysa aynı bilgi ikinci kez yazılmaz.
  if (evening && s.tomorrowFirst && s.dayKey !== "nextEarly") {
    const first = s.tomorrowFirst.getHours() * 60 + s.tomorrowFirst.getMinutes()
    if (first <= EARLY_START) add("tomorrowEarly", "ahead", 66)
  }

  // Saat ve gün.
  if (s.weekend) add("weekend", "time", 44)
  else if (evening) add("evening", "time", 36)
  else if (weekday === 5 && mins >= 14 * 60) add("friday", "time", 40)
  else if (weekday === 1 && mins < 12 * 60) add("monday", "time", 38)
  else if (mins >= LUNCH[0] && mins < LUNCH[1] && s.meeting?.key !== "now") add("lunch", "time", 34)

  add("calm", "calm", 10)
  return out
}

// Önerinin konusuyla aynı tek sinyallik satır: kapsül zaten onu söylüyor.
const OFFER_TOPIC: Record<string, string[]> = {
  mail: ["mail", "mailMorning"],
  invites: ["invites"],
  overdue: ["overdue"],
  // "Bu akşam erken dinlen." — "Yarın ilk toplantın 08:30; bu akşam erken dinlen." ve "Mesai bitti;
  // … biraz dinlen." aynı şeyi söyler (ürün sahibi: "öneri de aynı").
  rest: ["tomorrowEarly", "evening"],
  // "Yarına hazırlık notu çıkarayım mı?" — "Mesai bitti; yarını sonra düşün" ona ters düşer.
  tomorrow: ["tomorrowEarly", "evening"],
  // "Haftana birlikte bakalım mı?" — pazartesi satırı ("önce haftanın planına bir bak") aynısı.
  week: ["monday"],
}

/** En çok `max` satır: puan sırası, her gruptan bir; sakin gün yalnız başka iş/gün yoksa. */
export function pickSituations(all: Situation[], offerKey: string | null, max = 2): Situation[] {
  const hidden = new Set(offerKey ? (OFFER_TOPIC[offerKey] ?? []) : [])
  const taken = new Set<Group>()
  const picked: Situation[] = []
  for (const c of [...all].sort((a, b) => b.score - a.score)) {
    if (picked.length >= max) break
    if (hidden.has(c.id) || taken.has(c.group)) continue
    if (c.group === "calm" && (taken.has("work") || taken.has("day") || taken.has("now"))) continue
    picked.push(c)
    taken.add(c.group)
    for (const g of c.covers ?? []) taken.add(g)
  }
  return picked
}
