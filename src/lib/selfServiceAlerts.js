import { startOfDay } from "@/lib/leaveDays"
import { extraValue } from "@/lib/selfServiceFields"
import { isAbsence } from "@/lib/selfServiceNames"
import { isLive, statusKind } from "@/lib/selfServiceStatus"

/**
 * Self Servis — akıllı uyarılar (saf, veri döner; çipi ve cümleyi arayüz kurar). Öncelik sırasıyla:
 * iade edilen kayıt → gönderilmemiş masraf raporu → mahsup edilmemiş iş avansı → yaklaşan
 * izin → yıl sonuna kalan izin. Arayüzde her uyarı kendi kayıtlarının sekmesinde çip olur
 * (`tab` › `alertForTab`); kapatılanlar (`dismissed`: tür ya da `alertKey`) atlanır.
 */

const DAY = 86400000
/** Yaklaşan izin uyarısının penceresi (gün). */
export const NEXT_LEAVE_DAYS = 45

const kindOf = (r) => r.statusKind ?? statusKind(r.status)
const of = (list, kind) => (list ?? []).filter((r) => kindOf(r) === kind)
const group = (id, records) =>
  records.length
    ? { id, count: records.length, numbers: records.map((r) => r.number), records }
    : null

/** Kısa özet (djb2): kapatılan uyarının izi depoda kayıt numarası taşımasın. */
function digest(text) {
  let h = 5381
  for (let i = 0; i < text.length; i += 1) h = (h * 33 + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/**
 * Uyarının kapatma anahtarı: tür + içeriğin özeti ("unsubmitted:1x9k2"). İçerik değişince
 * (yeni bir gönderilmemiş rapor, başka bir sıradaki izin, farklı kalan gün) uyarı yeniden çıkar.
 */
export function alertKey(alert) {
  const body = alert?.numbers?.join("|") ?? alert?.record?.id ?? alert?.remain ?? ""
  return `${alert?.id}:${digest(String(body))}`
}

const FILTER_STATUS = { returned: "returned", unsubmitted: "draft" }

/**
 * Kayıt taşıyan uyarının GİZLİ kayıtlarının ("+n": ilk `skip` tanesinden sonrası) listedeki
 * karşılığı `{ status, year, n }`: uyarının durum kategorisi, gizli kayıtlar aynı yıldaysa o yıl
 * (değilse Tümü) ve sayısı; gizli kayıt yoksa null. Uyarı sekmesine bölündüğünden (`alertForTab`)
 * süzgeç o sekmenin listesinde çalışır.
 */
export function alertFilter(alert, skip = 0) {
  const hidden = (alert?.records ?? []).slice(skip)
  if (!hidden.length) return null
  const years = new Set(hidden.map((r) => r.date?.getFullYear()))
  const [year] = [...years]
  return {
    status: FILTER_STATUS[alert.id] ?? null,
    year: years.size === 1 && year != null ? year : null,
    n: hidden.length,
  }
}

/** Kayıt taşımayan uyarıların sekmesi. */
const ALERT_TAB = { nextLeave: "leave", yearEnd: "leave" }

/**
 * Uyarının bir sekmeye düşen parçası: kayıt taşıyanda yalnız o türün kayıtları (iade edilen
 * masraf Masraflar'da, avans İş avansları'nda; sayı ve numaralar parçanın), izin uyarıları
 * İzinler'de. Sekmeye düşen yoksa null.
 */
export function alertForTab(alert, tab) {
  if (!alert) return null
  if (alert.records)
    return group(
      alert.id,
      alert.records.filter((r) => r.kind === tab),
    )
  return ALERT_TAB[alert.id] === tab ? alert : null
}

/**
 * Uyarılar `[{ id, … }]`:
 * - `returned` `{ count, numbers, records }` — iade edilen masraf ya da avans (ERP "Returned")
 * - `unsubmitted` `{ count, numbers, records }` — gönderilmemiş masraf raporları
 * - `unsettledAdvance` `{ count, numbers, records }` — kalan tutarı olan avans (yalnız ERP
 *   kalan tutarı veriyorsa; "Ödendi" durumu mahsuptan sonra da sürdüğü için durumdan çıkarılamaz)
 * - `nextLeave` `{ record, inDays }` — bugünden sonra başlayan ilk izin (devamsızlık; pencere içinde)
 * - `yearEnd` `{ remain }` — Kasım–Aralık'ta kullanılmamış yıllık izin
 *
 * `tab` verilirse yalnız o sekmenin parçaları (`alertForTab`).
 */
export function buildAlerts(data, { now = new Date(), tab = null, dismissed = [] } = {}) {
  const today = startOfDay(now)
  const alerts = [
    group("returned", [...of(data?.expenses, "returned"), ...of(data?.advances, "returned")]),
    group("unsubmitted", of(data?.expenses, "draft")),
    group(
      "unsettledAdvance",
      (data?.advances ?? []).filter((r) => (extraValue(r.extra, "balance") ?? 0) > 0),
    ),
    nextLeave(data?.leaves, today),
    yearEnd(data?.balance, today),
  ]
  const gone = new Set(dismissed)
  // Kapatma parçaya göre: masraftaki iade uyarısı kapatılınca avanstaki durur.
  return alerts
    .map((a) => (tab ? alertForTab(a, tab) : a))
    .filter((a) => a && !gone.has(a.id) && !gone.has(alertKey(a)))
}

/** Bugünden sonra başlayan ilk izin (devamsızlık, toplama giren); yoksa null. */
export function upcomingLeave(leaves, now = new Date()) {
  const today = startOfDay(now)
  // Evden çalışma ya da dış görev "izin" değil; iptal edilmiş talep de.
  return (
    (leaves ?? [])
      .filter((r) => r.start && r.start > today && isAbsence(r) && isLive(r))
      .sort((a, b) => a.start - b.start)[0] ?? null
  )
}

function nextLeave(leaves, today) {
  const record = upcomingLeave(leaves, today)
  if (!record) return null
  const inDays = Math.round((record.start - today) / DAY)
  return inDays <= NEXT_LEAVE_DAYS ? { id: "nextLeave", record, inDays } : null
}

function yearEnd(balance, today) {
  const remain = balance?.remain ?? 0
  return today.getMonth() >= 10 && remain > 0 ? { id: "yearEnd", remain } : null
}
