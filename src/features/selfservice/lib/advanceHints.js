import { COMPANY_CODES, CURRENCIES } from "@/data/hrValues"
import { matchLocation } from "@/lib/advanceLocations"
import { formatAmount } from "@/lib/amountParse"
import { addDays, startOfDay } from "@/lib/leaveDays"
import { isLive } from "@/lib/selfServiceStatus"

/**
 * İş avansı formunun önerileri (saf): kapatılmamış avanslar, önceki avanslardan doldurma (tarih
 * dışında her alan) ve takvimden yolculuk (amaç · yer). Tarih talebin yapıldığı gündür; hiçbir
 * öneri onu değiştirmez. Yer yalnız ERP'nin lokasyon listesindeki bir koda okunabiliyorsa
 * doldurulur (`matchLocation`: "İzmir" → "İZMİR"; "Hamburg" doldurulmaz).
 */

const extra = (r, key) => r?.extra?.find((x) => x.key === key)?.value ?? null
const counted = (advances) => (advances ?? []).filter((r) => r && isLive(r))
const newestFirst = (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)

/** Mahsup edilmemiş kalanı olan avanslar, en yeni önce: `{ id, number, location, balance, currency }`. */
export function openAdvances(advances) {
  return counted(advances)
    .filter((r) => (extra(r, "balance") ?? 0) > 0)
    .sort(newestFirst)
    .map((r) => ({
      id: r.id,
      number: r.number,
      location: r.location ?? "",
      balance: extra(r, "balance"),
      currency: r.currency || "TRY",
    }))
}

/** Tarihi en yeni avans (iptal, ret ve taslak sayılmaz) ya da null. */
export const lastAdvance = (advances) => counted(advances).sort(newestFirst)[0] ?? null

/** Son avansın şirket kodu, listede varsa. */
export function lastCompany(last) {
  const code = extra(last, "targetCompany")
  return code && COMPANY_CODES.includes(code) ? code : null
}

// Önceki avanstan doldurulabilen seçenekler (şablondaki değerler).
const PURPOSES = ["business", "fair", "congress", "visit", "other"]
const PAYMENTS = ["bank", "cash"]
const DOCUMENTS = ["documented", "undocumented"]

/**
 * Önerilecek önceki avanslar: en yeni önce, aynı içerikli (amaç · yer · tutar · para birimi ·
 * şirket) tekrarlar bir kez, en çok `n` kayıt.
 */
export function recentAdvances(advances, n = 3) {
  const seen = new Set()
  const out = []
  for (const r of counted(advances).sort(newestFirst)) {
    const key = [
      r.purposeKey,
      (r.location ?? "").toLocaleLowerCase("tr").trim(),
      r.amount,
      r.currency,
      extra(r, "targetCompany"),
    ].join("|")
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
    if (out.length === n) break
  }
  return out
}

/**
 * Önceki avansın değerleriyle form yaması — TARİH dışında her alan: tutar (dilin biçiminde), para
 * birimi, amaç, yer (ERP listesinde varsa), şirket (listede varsa), ödeme, belge. Okunamayan
 * değer yamaya girmez: o alan olduğu gibi kalır.
 */
export function advancePatch(record, locale = "tr") {
  if (!record) return {}
  const patch = {}
  if (record.amount > 0) patch.amount = formatAmount(record.amount, locale)
  if (CURRENCIES.includes(record.currency)) patch.currency = record.currency
  if (PURPOSES.includes(record.purposeKey)) patch.purpose = record.purposeKey
  const where = matchLocation(record.location)
  if (where) patch.destination = where
  const company = lastCompany(record)
  if (company) patch.company = company
  const pay = extra(record, "paymentMode")
  if (PAYMENTS.includes(pay)) patch.payment = pay
  const doc = extra(record, "documented")
  if (DOCUMENTS.includes(doc)) patch.document = doc
  return patch
}

// Yolculuk sayılmayan yerler: çevrim içi toplantı, oda, bağlantı.
const NOT_A_PLACE =
  /teams|zoom|webex|meet\.|https?:|www\.|toplantı odası|meeting room|\broom\b|salon|\boda\b/
const TRIP =
  /fuar|kongre|konferans|zirve|ziyaret|seyahat|fair|expo|congress|conference|summit|visit|trip/

/** Etkinliğin konusundan amaç anahtarı. */
function purposeOf(subject) {
  if (/fuar|fair|expo/.test(subject)) return "fair"
  if (/kongre|konferans|zirve|congress|conference|summit/.test(subject)) return "congress"
  if (/müşteri|ziyaret|customer|visit/.test(subject)) return "visit"
  return "business"
}

/**
 * Takvimden yolculuk: önümüzdeki `days` gün içinde yeri olan (çevrim içi ya da oda değil) ve tüm
 * gün süren, en az bir gün süren ya da konusu yolculuk anlatan en yakın etkinlik. Dönüş
 * `{ id, purpose, place, destination, start, end }` ya da null — `place` takvimdeki yer (önerinin
 * yazısı), `destination` onun lokasyon kodu ya da null (listede yoksa yer doldurulmaz), `end` son gün.
 */
export function tripFromEvents(events, today, { days = 30 } = {}) {
  const from = startOfDay(today)
  const to = addDays(from, days + 1)
  const hit = (events ?? [])
    .filter((e) => {
      const place = (e?.location ?? "").toLocaleLowerCase("tr")
      if (!place || NOT_A_PLACE.test(place) || e.isOnlineMeeting) return false
      if (!(e.start instanceof Date) || e.start < from || e.start >= to) return false
      if (e.myResponse === "declined") return false
      const long = e.isAllDay || e.end - e.start >= 864e5
      return long || TRIP.test((e.subject ?? "").toLocaleLowerCase("tr"))
    })
    .sort((a, b) => a.start - b.start)[0]
  if (!hit) return null
  const start = startOfDay(hit.start)
  // Tüm gün etkinliğin bitişi ertesi günün başı: son gün bir önceki.
  const last = hit.isAllDay ? addDays(startOfDay(hit.end), -1) : startOfDay(hit.end)
  return {
    id: hit.id,
    purpose: purposeOf((hit.subject ?? "").toLocaleLowerCase("tr")),
    place: hit.location.split(/[,;]/)[0].trim(),
    destination: matchLocation(hit.location),
    start,
    end: last < start ? start : last,
  }
}
