import { leaveWorkdays } from "@/lib/requestForm"
import { addDays, dayDiff, dayInfo, startOfDay, ymd } from "@/lib/leaveDays"
import { isAbsence } from "@/lib/selfServiceNames"
import { isLive } from "@/lib/selfServiceStatus"
import { memberKey } from "@/lib/selfServiceTeamQuery"
import { neutralLeaves } from "@/lib/selfServiceTeamPrivacy"

/**
 * İzin talebinin ETKİSİ (saf): kişinin kendi izinleriyle çakışma, onay bekleyen yıllık izinler,
 * bakiye, takvim katmanı, ekipten aynı günlerde izinli olanlar (türsüz) ve aralıktaki
 * toplantılar. Kaynaklar Self Servis verisi (`data.leaves`, `data.balance`), Ekibim'in izin
 * cevabı (`useSelfServiceTeam`) ve Graph takvimi (`useCalendarEvents`); burada istek yok.
 */

/** ERP'de yıllık iznin türü (bakiyeden düşen tek tür). */
export const ANNUAL_LEAVE_CODE = "TR01"
// Bir kaydın günleri en çok bu kadar yürünür (bozuk tarih döngüyü kilitlemesin).
const MAX_SPAN = 400

const endOf = (r) => r.end ?? r.start
const overlaps = (r, from, to) => r.start <= to && endOf(r) >= from
const isPending = (r) => r.statusKind === "pending"
const validRange = (start, end) => Boolean(start && end && end >= start)

/**
 * Kişinin GERÇEK izinleri: tarihli, toplama giren (iptal · ret · taslak değil) devamsızlık. Dış
 * Görev, Kart Unutuldu, Evden Çalışma izin sayılmaz (`isAbsence`).
 */
export const ownLeaves = (leaves) =>
  (leaves ?? []).filter((r) => r?.start && isAbsence(r) && isLive(r))

/** Kaydın gün sayısı: ERP'nin sayısı, yoksa tahmin. */
const daysOf = (r) => r.days ?? leaveWorkdays(r.start, endOf(r)) ?? 0

/** Onay bekleyen ve bugün ya da sonra başlayan yıllık izinler: `{ days, records }`. */
export function pendingAnnual(leaves, today) {
  const base = startOfDay(today)
  const records = ownLeaves(leaves).filter(
    (r) => r.typeCode === ANNUAL_LEAVE_CODE && isPending(r) && r.start >= base,
  )
  return { days: records.reduce((n, r) => n + daysOf(r), 0), records }
}

/** Onay bekleyen ve bitmemiş izinler (her tür), başlangıca göre — boş formun hatırlatması. */
export function pendingLeaves(leaves, today) {
  const base = startOfDay(today)
  return ownLeaves(leaves)
    .filter((r) => isPending(r) && endOf(r) >= base)
    .sort((a, b) => a.start - b.start)
}

/** Seçilen aralıkla kesişen kendi izinlerin, başlangıca göre (gönderimi engeller). */
export function ownOverlap(leaves, start, end) {
  if (!validRange(start, end)) return []
  const from = startOfDay(start)
  const to = startOfDay(end)
  return ownLeaves(leaves)
    .filter((r) => overlaps(r, from, to))
    .sort((a, b) => a.start - b.start)
}

/** Formun ek doğrulaması: kendi izniyle çakışan aralık bitişte hata (`overlap`). */
export function leaveChecks(leaves, values) {
  return ownOverlap(leaves, values?.start, values?.end).length ? { end: "overlap" } : {}
}

/**
 * Takvim katmanı: gün → "mine" (tamamlanmış ya da durumu bilinmeyen izin) · "pending" (onayda).
 * Aynı günde ikisi de varsa "mine". Yalnız `[from, to]` penceresi.
 */
export function ownLeaveDays(leaves, from, to) {
  const out = new Map()
  for (const r of ownLeaves(leaves)) {
    if (!overlaps(r, from, to)) continue
    const a = r.start < from ? from : r.start
    const b = endOf(r) > to ? to : endOf(r)
    const span = Math.min(dayDiff(a, b), MAX_SPAN)
    for (let i = 0; i <= span; i++) {
      const key = ymd(addDays(a, i))
      if (out.get(key) !== "mine") out.set(key, isPending(r) ? "pending" : "mine")
    }
  }
  return out
}

/**
 * Yıllık iznin bakiye etkisi. `remain` ERP'nin kalanı, `days` bu talep, `pending` onay bekleyen
 * yıllık izinler. Çubuk kalan üzerine kurulur (aşınca talep + bekleyen): `share` üç parça —
 * hepsinden sonra kalan · bekleyen · bu talep (toplamı 1).
 */
export function balanceImpact({ remain, days, pending = 0 }) {
  if (remain == null || days == null) return null
  const after = remain - days
  const afterAll = after - pending
  const total = Math.max(remain, days + pending, 0.5)
  return {
    from: remain,
    after,
    afterAll,
    pending,
    over: after < 0 ? -after : 0,
    overWithPending: after >= 0 && afterAll < 0 ? -afterAll : 0,
    share: {
      left: Math.max(afterAll, 0) / total,
      pending: pending / total,
      request: days / total,
    },
  }
}

/**
 * Ekipten aralıkta izni olanlar — TÜRSÜZ (`neutralLeaves`: yalnız tam günlük gerçek devamsızlık,
 * tür ve saat düşer; bana bağlıların türü de burada gösterilmez). Her kişi bir satır:
 * `{ key, name, address, from, to, pending }` — `from`–`to` seçimle kesişen kısım, `pending`
 * kesişen izinlerin hepsi onaydaysa. Başlangıca, sonra ada göre.
 */
export function teamOverlap(people, members, start, end) {
  if (!validRange(start, end)) return []
  const from = startOfDay(start)
  const to = startOfDay(end)
  const rows = []
  for (const person of people ?? []) {
    const key = memberKey(person)
    const hits = neutralLeaves(members?.[key]?.leaves).filter((r) => overlaps(r, from, to))
    if (!hits.length) continue
    const a = hits.reduce((m, r) => (r.start < m ? r.start : m), hits[0].start)
    const b = hits.reduce((m, r) => (endOf(r) > m ? endOf(r) : m), endOf(hits[0]))
    rows.push({
      key,
      name: person.name || person.address,
      address: person.address ?? "",
      from: a < from ? from : a,
      to: b > to ? to : b,
      pending: hits.every(isPending),
    })
  }
  return rows.sort((x, y) => x.from - y.from || x.name.localeCompare(y.name))
}

/**
 * Takvimin ekip katmanı: gün → o gün izinli ekip arkadaşları `[{ key, name, pending }]`, ada
 * göre. `teamOverlap` ile aynı kural (türsüz, yalnız tam günlük gerçek devamsızlık). Yalnız
 * çalışılan günler: hafta sonu ve bayramda kimse "izinde" sayılmaz, işaret gürültü olurdu.
 * `pending`: kişinin o günü kapsayan izinlerinin hepsi onaydaysa. Yalnız `[from, to]` penceresi.
 */
export function teamLeaveDays(people, members, from, to) {
  const out = new Map()
  const lo = startOfDay(from)
  const hi = startOfDay(to)
  for (const person of people ?? []) {
    const key = memberKey(person)
    const days = new Map()
    for (const r of neutralLeaves(members?.[key]?.leaves)) {
      if (!overlaps(r, lo, hi)) continue
      const a = r.start < lo ? lo : startOfDay(r.start)
      const b = endOf(r) > hi ? hi : startOfDay(endOf(r))
      const span = Math.min(dayDiff(a, b), MAX_SPAN)
      for (let i = 0; i <= span; i++) {
        const d = addDays(a, i)
        if (dayInfo(d).weight === 0) continue
        const k = ymd(d)
        days.set(k, (days.get(k) ?? true) && isPending(r))
      }
    }
    const name = person.name || person.address
    for (const [k, pending] of days) {
      const list = out.get(k)
      if (list) list.push({ key, name, pending })
      else out.set(k, [{ key, name, pending }])
    }
  }
  for (const list of out.values()) list.sort((x, y) => x.name.localeCompare(y.name))
  return out
}

/**
 * Aralıktaki toplantılar: tüm gün olmayan, reddetmediğin ve "serbest" görünmeyen etkinlikler
 * (`useCalendarEvents` biçimi), başlangıca göre.
 */
export function meetingsInRange(events, start, end) {
  if (!validRange(start, end)) return []
  const from = startOfDay(start)
  const to = addDays(startOfDay(end), 1)
  return (events ?? [])
    .filter(
      (e) =>
        !e.isAllDay &&
        e.myResponse !== "declined" &&
        e.showAs !== "free" &&
        e.start < to &&
        e.end > from,
    )
    .sort((a, b) => a.start - b.start)
}
