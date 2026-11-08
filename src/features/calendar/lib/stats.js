import { TR_HOLIDAYS } from "@/lib/holidays"
import { addDays, startOfDay } from "@/lib/leaveDays"
import { meetingsInRange, ownLeaves, pendingLeaves, teamOverlap } from "@/lib/leaveImpact"
import { leaveSummary } from "@/lib/leaveSummary"
import { leaveWorkdays } from "@/lib/requestForm"
import { isTripEvent } from "@/lib/travel"
import { isFocusEvent, overlapsKeys } from "./items"
import { dayKey, keyToDay } from "./range"

/**
 * "Takvim özeti" paneli ve tablonun sayıları (saf, testli). Kaynaklar Self Servis verisi
 * (`data.leaves`, `data.balance`), Ekibim'in izin cevabı, Graph takvimi ve takvimin öğe listesi;
 * burada istek yok. Dönem sayıları (`first`–`last` uçlar DAHİL, yerel gece yarısı) görünen
 * döneme göre: `features/calendar/lib/range › periodOf`.
 *
 * Her sayının süzgeci ayrı bir LİSTE işlevi (`leavesIn`, `meetingsOf`, `awaitingOf`, `itemsIn`,
 * `holidaysOf`, `teamAway`): sayı o listenin uzunluğu, satırın balonu da (`statsLists.js`) aynı
 * listeyi gösterir — sayı ile liste ayrışamaz.
 */

/**
 * Bakiye satırlarının sayıları (döneme bağlı değil):
 * - `free` kullanılabilir gün: ERP'nin kalanı onaydaki yıllık izinleri düşmüyor, burada düşülür
 *   (`leaveSummary`); bakiye okunamadıysa null ("0 gün" denmez).
 * - `pending` onay bekleyen talep sayısı (her tür, bitmemiş).
 * - `claim` ERP'nin toplam hakkı: tüm yılların birikmiş toplamı, yıllık pay değil.
 */
export function leaveStats({ leaves, balance, now = new Date() }) {
  const today = startOfDay(now)
  const summary = leaveSummary({ balance, leaves, now: today })
  return {
    free: summary.free,
    claim: summary.claim,
    pending: pendingLeaves(leaves, today).length,
  }
}

const latest = (a, b) => (a > b ? a : b)
const earliest = (a, b) => (a < b ? a : b)

/**
 * Dönemdeki kendi izinlerim ve her birinin dönemdeki gün payı: `[{ record, days }]`, başlangıca
 * göre. Onaylı (ya da durumu bilinmeyen) izinler; onaydakiler "bekleyen talep" satırında. Dönemin
 * içine tam sığan izinde ERP'nin gün sayısı, dönem sınırından taşanda yalnız içerideki iş günleri
 * (tahmin: hafta sonu düşer, bayram ve arife ağırlığıyla). Payı sıfır olan (saatlik izin) yok.
 */
export function leavesIn(leaves, first, last) {
  const out = []
  for (const r of ownLeaves(leaves)) {
    const end = r.end ?? r.start
    if (r.statusKind === "pending" || r.start > last || end < first) continue
    const inside = r.start >= first && end <= last
    const days =
      inside && r.days != null
        ? r.days
        : (leaveWorkdays(latest(r.start, first), earliest(end, last)) ?? 0)
    if (days > 0) out.push({ record: r, days })
  }
  return out.sort((a, b) => a.record.start - b.record.start)
}

/** Dönemdeki kendi izin günlerim: `leavesIn`in gün payları toplamı. */
export const leaveDaysIn = (leaves, first, last) =>
  leavesIn(leaves, first, last).reduce((n, x) => n + x.days, 0)

/**
 * Dönemde ekipten izinde olanlar: türsüz izinden (`teamOverlap` → `neutralLeaves`), onaydaki
 * talepler "izinde" sayılmaz. Dönüş kişi satırları (başlangıca göre).
 */
export function teamAway({ people, members, first, last }) {
  return teamOverlap(people, members, first, last).filter((r) => !r.pending)
}

/**
 * Dönemin toplantıları (ham etkinlik, başlangıca göre): tüm gün, reddedilen ve "serbest" görünenler
 * değil; odak bloğu ve seyahat de toplantı değil (kendi katmanları var).
 */
export const meetingsOf = (events, first, last) =>
  meetingsInRange(events, first, last).filter((e) => !isFocusEvent(e) && !isTripEvent(e))

/**
 * Dönemin toplantı sayısı ve süresi (saat): `meetingsOf`. Süre dönemin sınırına kırpılır: gece
 * yarısını aşan toplantının yalnız dönem içindeki kısmı.
 */
export function meetingStats(events, first, last) {
  const from = startOfDay(first)
  const to = addDays(startOfDay(last), 1)
  const list = meetingsOf(events, first, last)
  const ms = list.reduce((n, e) => n + Math.max(0, earliest(e.end, to) - latest(e.start, from)), 0)
  return { count: list.length, hours: Math.round((ms / 3_600_000) * 10) / 10 }
}

/** Dönemde yanıtını bekleyen, bitmemiş davetler (tüm gün olanlar hariç), başlangıca göre. */
export function awaitingOf(events, first, last, today) {
  const from = startOfDay(first)
  const to = addDays(startOfDay(last), 1)
  return (events ?? [])
    .filter(
      (e) =>
        !e.isAllDay &&
        e.myResponse === "notResponded" &&
        e.start < to &&
        e.end > from &&
        e.end >= today,
    )
    .sort((a, b) => a.start - b.start)
}

export const awaitingIn = (events, first, last, today) =>
  awaitingOf(events, first, last, today).length

/**
 * Takvim öğelerinden (`buildItems`: aynı kayıt bir kez) dönemle kesişen `kind` öğeleri. `open`:
 * bitmiş görevler yok (teslimi gelen = bitmemiş).
 */
export function itemsIn(items, kind, firstKey, lastKey, open = false) {
  return (items ?? []).filter(
    (i) => i.kind === kind && !(open && i.state === "done") && overlapsKeys(i, firstKey, lastKey),
  )
}

export const countItems = (items, kind, firstKey, lastKey, open = false) =>
  itemsIn(items, kind, firstKey, lastKey, open).length

/** Dönemle kesişen resmî tatiller (bayram tek tatil sayılır; yalnız arifesi dönemdeyse sayılmaz). */
export function holidaysOf(first, last) {
  const a = dayKey(first)
  const b = dayKey(last)
  return TR_HOLIDAYS.filter(
    (h) => h.start <= b && dayKey(addDays(keyToDay(h.start), h.days - 1)) >= a,
  )
}

export const holidaysIn = (first, last) => holidaysOf(first, last).length

/** Yılın resmî tatilleri (başlangıca göre): panelin "Tatil listesini gör" çekmecesi. */
export const holidaysOfYear = (year) => TR_HOLIDAYS.filter((h) => h.start.startsWith(String(year)))
