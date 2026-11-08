import { COMPANY_SELECT, pickCompany, toCompany } from "@/lib/hrCompany"
import { parseIsoDate } from "@/lib/isoDate"
import { hireDayOf } from "@/lib/selfServiceProfile"
import { anyOf, chunks } from "@/lib/selfServiceOdata"

/**
 * Ekibim — ekibin yaklaşan doğum günleri ve iş yıl dönümleri (saf; istek `hooks/useTeamDates.js`te).
 *
 * Kaynaklar: iş yıl dönümü Graph `employeeHireDate`ten (ekip listesinde zaten var), boşsa İK
 * görünümünün kıdem tarihinden; doğum günü Anasayfa'nın tebrik kartıyla aynı İK görünümünden
 * (`lib/celebrations.js`), YALNIZ ekibin adresleriyle ve 20'lik `or` öbekleriyle. Doğum YILI
 * bellekte de tutulmaz: yalnız gün ve ay. Ay-gün herkese açık bilgi (Anasayfa'nın tebrikleri),
 * bu yüzden yönetici ve ekip arkadaşlarında da gösterilir; izin gizliliği değişmez.
 */

// Şirket de aynı sorgudan (`hrCompany.js`): Ekibim üyesinin profil başlığında İK görünümünün şirketi.
export const DATES_SELECT = `${COMPANY_SELECT},mserp_birthdate,mserp_senioritydate`
const DAY = 86400000

const lower = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()

/** Ekibin adresleri (posta ve UPN, tekil) → İK görünümü sorgu parametreleri. */
export function teamDateParams(addresses) {
  const list = [...new Set((addresses ?? []).map(lower))].filter(Boolean)
  return chunks(list).map((part) => ({
    $select: DATES_SELECT,
    $filter: anyOf("mserp_mail", part),
  }))
}

// F&O'nun boş tarihi 1900-01-01: herkes 1 Ocak'ta doğmuş görünmesin.
const real = (p) => (p && p.y > 1900 && p.m >= 1 && p.m <= 12 && p.d >= 1 ? p : null)

/**
 * İK satırları → `{ [adres]: { birth: { m, d } | null, since: { y, m, d } | null, companies } }`.
 * Doğum yılı burada düşer; aynı adresle birden çok satır gelirse dolu olan kazanır. `companies`:
 * adresin bütün şirket satırları (`toCompany`) — hangisi olduğuna üyenin numarası karar verir.
 */
export function teamDatesFrom(rows) {
  const out = {}
  for (const row of rows ?? []) {
    const mail = lower(row?.mserp_mail)
    if (!mail) continue
    const birth = real(parseIsoDate(row.mserp_birthdate))
    const since = real(parseIsoDate(row.mserp_senioritydate))
    const prev = out[mail]
    out[mail] = {
      birth: prev?.birth ?? (birth ? { m: birth.m, d: birth.d } : null),
      since: prev?.since ?? since,
      companies: [...(prev?.companies ?? []), toCompany(row)].filter(Boolean),
    }
  }
  return out
}

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Gün-ayın `today`den (bugün dahil) sonraki ilk günü; 29 Şubat artık olmayan yılda 28 Şubat. */
export function nextDayMonth({ m, d }, today) {
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    const day = m === 2 && d === 29 && !isLeap(y) ? 28 : d
    const when = new Date(y, m - 1, day)
    if (when >= today) return when
  }
  return null
}

/** Gün farkı (yaz saati kaymasında da tam gün). */
export const daysUntil = (today, date) => Math.round((date - today) / DAY)

/** Sıradaki doğum günü → `{ kind: "birthday", date, inDays }` (0 = bugün). */
export function nextBirthday(birth, today) {
  if (!birth?.m || !birth?.d) return null
  const date = nextDayMonth(birth, today)
  return date ? { kind: "birthday", date, inDays: daysUntil(today, date) } : null
}

/**
 * Sıradaki iş yıl dönümü → `{ kind: "anniversary", date, inDays, years }`. En az 1. yıl: işe
 * bugün başlayan ya da henüz başlamamış olan yıl dönümü değil.
 */
export function nextAnniversary(since, today) {
  if (!since?.y || !since?.m || !since?.d) return null
  const date = nextDayMonth(since, today)
  if (!date) return null
  const years = date.getFullYear() - since.y
  return years >= 1 ? { kind: "anniversary", date, inDays: daysUntil(today, date), years } : null
}

const partOf = (date) =>
  date ? { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() } : null

/**
 * Bir üyenin sıradaki doğum günü ve iş yıl dönümü, tarih sırasıyla. `person`: Graph üyesi
 * (`memberFromGraph`); `dates`: `teamDatesFrom` çıktısı (posta ya da UPN ile).
 */
export function memberOccasions(person, dates, today) {
  const hr = dates?.[lower(person?.address)] ?? dates?.[lower(person?.upn)] ?? null
  const since = partOf(hireDayOf(person?.employeeHireDate)) ?? hr?.since ?? null
  return [nextBirthday(hr?.birth, today), nextAnniversary(since, today)]
    .filter(Boolean)
    .sort((a, b) => a.inDays - b.inDays)
}

/**
 * Görünen dönemdeki (`first`…`last`, uçlar dahil) doğum günü ve iş yıl dönümleri, satır anahtarına
 * göre: `Map<key, occasion[]>`. Çizelge ileri/geri gezinince işaretler o döneme göre yeniden
 * hesaplanır; `inDays` yine bugüne göre (bugünkü gün "Bugün" rozetini alsın).
 */
export function windowOccasions(rows, dates, first, last, today) {
  const out = new Map()
  for (const r of rows ?? []) {
    const list = memberOccasions(r.person, dates, first)
      .filter((o) => o.date <= last)
      .map((o) => ({ ...o, inDays: daysUntil(today, o.date) }))
    if (list.length) out.set(r.key, list)
  }
  return out
}

/**
 * Üyenin işe giriş (kıdem) günü: Graph'taki işe giriş, yoksa İK görünümünün kıdem tarihi — Graph
 * çoğu kişide boş, "Hizmet" sütunu "—" kalmasın.
 */
export function memberSince(person, dates) {
  const graph = hireDayOf(person?.employeeHireDate)
  if (graph) return graph
  const hr = dates?.[lower(person?.address)] ?? dates?.[lower(person?.upn)] ?? null
  return hr?.since ? new Date(hr.since.y, hr.since.m - 1, hr.since.d) : null
}

/** Üyenin İK şirketi (`{ code, name }` ya da null): numarası, yoksa adresiyle (`pickCompany`). */
export function memberCompany(row, dates) {
  const addresses = [row?.person?.address, row?.person?.upn]
  const list = addresses.flatMap((a) => dates?.[lower(a)]?.companies ?? [])
  return pickCompany(list, { personnel: row?.personnel, addresses })
}

/**
 * Ekibim satırlarına (`teamOverview`) `occasions`, işe giriş günü (`since`) ve İK şirketi
 * (`company`) eklenir.
 */
export const withOccasions = (rows, dates, today) =>
  rows.map((r) => ({
    ...r,
    occasions: memberOccasions(r.person, dates, today),
    since: memberSince(r.person, dates),
    company: memberCompany(r, dates),
  }))

/**
 * Telefonun "Yaklaşanlar" listesi: izinler (`upcomingLeaves`) ve `days` gün içindeki doğum günü
 * ile yıl dönümleri tek listede, tarih sırasıyla (aynı günde izin önce). Öğe: izin
 * `{ key, record, current, … }` ya da `{ key, occasion }`.
 */
export function soonList(upcoming, rows, { days = 42 } = {}) {
  const rank = { birthday: 1, anniversary: 2 }
  const items = [
    ...(upcoming ?? []).map((it) => ({ ...it, at: it.record.start, rank: 0 })),
    ...(rows ?? []).flatMap((r) =>
      (r.occasions ?? [])
        .filter((o) => o.inDays < days)
        .map((o) => ({ key: r.key, occasion: o, at: o.date, rank: rank[o.kind] })),
    ),
  ]
  return items.sort((a, b) => a.at - b.at || a.rank - b.rank || String(a.key).localeCompare(b.key))
}
