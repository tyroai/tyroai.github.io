import { getDateTimeFormat, bcp47 } from "@/lib/intl-cache"
import { matchesAll } from "@/features/help/helpSearch"
import { KIND_ORDER, pick } from "./entryText"

/** "Daha fazla göster" bir basışta kaç kayıt açar. */
export const PAGE_SIZE = 20

/**
 * Gün İÇİNDE tür sırası: Yeni → İyileştirme → Düzeltme.
 *
 * Yalnız AYNI TARİHLİ ardışık koşu sıralanır, günlerin sırasına dokunulmaz: `latestEntryId` dizinin
 * ilk elemanını "en yeni" sayıyor, gün içinde kaynak sırayı değiştirmek herkesin okundu işaretini
 * kaydırırdı. Giriş mutasyona uğramaz (her koşu kendi kopyasında); kırpmadan ÖNCE yapılır, yoksa
 * "daha fazla göster"e her basışta liste zıplar.
 */
export function orderWithinDays(list) {
  const out = []
  let run = []
  const flush = () => {
    if (!run.length) return
    // Kararlı sıralama: aynı tür içinde dosyadaki sıra korunur.
    out.push(...run.sort((a, b) => (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99)))
    run = []
  }
  for (const e of list) {
    if (run.length && run[0].date !== e.date) flush()
    run.push(e)
  }
  flush()
  return out
}

/** İlk `limit` kayıt, tarihe göre ardışık gruplar: `[{ date, items }]`. Gruplama DİLİMDEN SONRA
 *  yapılır, yoksa her basışta aynı tarih iki kez çizilirdi. */
export function groupByDate(list, limit) {
  const out = []
  for (const e of list.slice(0, limit)) {
    const last = out[out.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else out.push({ date: e.date, items: [e] })
  }
  return out
}

/** Aranabilir metin: başlık + brief + MADDELER (ekranda görünen her metin aranabilir olmalı). */
export function entryText(entry, locale) {
  const points = (entry.points ?? []).map((pt) => pick(pt, locale)).join(" ")
  return `${pick(entry.title, locale)} ${pick(entry.body, locale)} ${points}`
}

/** Arama kelimelerinin HEPSİNİ içeren kayıtlar (AND); kelime yoksa liste olduğu gibi. */
export function searchEntries(list, terms, locale) {
  if (!terms.length) return list
  return list.filter((e) => matchesAll(entryText(e, locale), terms))
}

/** Türe göre sayılar (sekme sayıları); `all` listenin boyu. */
export function countByKind(list) {
  const out = { all: list.length, feature: 0, improvement: 0, fix: 0 }
  for (const e of list) if (e.kind in out) out[e.kind] += 1
  return out
}

/**
 * Okunmamış kayıtların ÇİZİM sırasındaki son yeri; yoksa −1. "Son ziyaretin" ayracı bunun
 * arkasına konur. Gün içi tür sırası bir okunmamışı okunmuşun arkasına atabilir (sınır günü);
 * ayraç en son okunmamışın ardında durur, noktalar ise yine tam olarak okunmamışları işaretler.
 */
export function lastUnreadIndex(list, unreadIds) {
  for (let i = list.length - 1; i >= 0; i -= 1) if (unreadIds.has(list[i].id)) return i
  return -1
}

// Yerel takvim günü: ISO "YYYY-AA-GG" saat dilimine kaymasın diye parçalanıp yerel kurulur.
function localDay(iso) {
  const [y, m, d] = String(iso).split("-").map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

const DAY_MS = 86_400_000

/**
 * Gün başlığı: yakın günler "Bugün / Dün" (`Intl.RelativeTimeFormat`, dört dilde hazır), ötekiler
 * "12 Ekim" (başka yıldaysa yılıyla). İkincil satır: gün adı ("Pazartesi") ya da yakın günde tarih.
 * `Intl` ile, çünkü Arapçada varsayılan takvim Hicri'dir — burada Miladi istenir.
 */
export function dayLabel(iso, locale, today) {
  const day = localDay(iso)
  if (!day) return { primary: String(iso), secondary: "" }
  const tag = bcp47(locale)
  const fmt = (options) =>
    getDateTimeFormat(locale, { calendar: "gregory", ...options }).format(day)
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((midnight - day) / DAY_MS)
  const shortDate = fmt({ day: "numeric", month: "long" })
  if (diff === 0 || diff === 1) {
    const word = new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(-diff, "day")
    return { primary: word.charAt(0).toLocaleUpperCase(tag) + word.slice(1), secondary: shortDate }
  }
  const sameYear = day.getFullYear() === today.getFullYear()
  const primary = sameYear ? shortDate : fmt({ day: "numeric", month: "long", year: "numeric" })
  return { primary, secondary: fmt({ weekday: "long" }) }
}

/** Ay dizini için: `ordered` listesindeki aylar, ilk görüldüğü sırayla (`index` = ayın ilk kaydının sırası). */
export function monthsOf(list) {
  const out = []
  list.forEach((e, index) => {
    const key = String(e.date).slice(0, 7)
    const last = out[out.length - 1]
    if (last && last.key === key) last.count += 1
    else out.push({ key, date: e.date, index, count: 1 })
  })
  return out
}

/** "Ekim 2026" — ay dizini etiketi (Arapçada varsayılan takvim Hicri: Miladi istenir). */
export function monthLabel(iso, locale) {
  const day = localDay(iso)
  if (!day) return String(iso).slice(0, 7)
  return getDateTimeFormat(locale, { calendar: "gregory", month: "long", year: "numeric" }).format(
    day,
  )
}

/** "12 Ekim 2026" — cümle içinde ("Son yenilik …") bağıl söz değil düz tarih. */
export function longDate(iso, locale) {
  const day = localDay(iso)
  if (!day) return String(iso)
  return getDateTimeFormat(locale, {
    calendar: "gregory",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(day)
}
