import { addDays, dayDiff, isWeekend, startOfDay } from "@/lib/leaveDays"
import { leaveReport } from "@/lib/selfServiceReport"
import { isAbsence, leaveTypeName } from "@/lib/selfServiceNames"
import { isLive } from "@/lib/selfServiceStatus"
import { isPartial, visibleLeaves } from "@/lib/selfServiceTeamPrivacy"
import { memberKey } from "@/lib/selfServiceTeamQuery"
import { isReport, isSelf, RELATION, relationOf, seesAll } from "@/lib/teamCircle"

/**
 * Ekibim — ekibin izin görünümü için saf hesaplar. Üye: `{ key, leaves }` (Graph üyesi +
 * `fetchTeamLeave`in izinleri). "İzinde" yalnız tam günlük gerçek devamsızlık: Dış Görev, Kart
 * Unutuldu ve Evden Çalışma sayılmaz (`isAbsence`), saatlik kayıt (vizite gibi) da sayılmaz;
 * bana bağlılarda çizelgede ve yaklaşan izinlerde yine görünürler (`absence`, `partial`).
 * Yöneticinin ve ekip arkadaşlarının izinleri türsüz gelir (`neutral`).
 */

const endOf = (r) => r.end ?? r.start
const valid = (leaves) => (leaves ?? []).filter((r) => r.start && isLive(r))

// Gün altı kayıt: çizelgede çubuk değil nokta, "izinde" sayılmaz (kural gizlilik modülünde).
export { isPartial }

const absences = (leaves) => valid(leaves).filter((r) => isAbsence(r) && !isPartial(r))

/** Onay sürecindeki izin (talep girildi, yönetici/İK onayında): "izinde" sayılmaz. */
export const isPendingLeave = (r) => r?.statusKind === "pending"

// Gerçek izin: tamamlanmış (ya da durumu bilinmeyen) devamsızlık.
const taken = (leaves) => absences(leaves).filter((r) => !isPendingLeave(r))

/** İzin `[from, to]` günleriyle kesişiyor mu. */
export const overlaps = (r, from, to) => r.start <= to && endOf(r) >= from

/** Haftanın başı (Pazartesi). */
export function weekStart(date) {
  const day = startOfDay(date)
  return addDays(day, -((day.getDay() + 6) % 7))
}

/**
 * İzin sorgusunun alt sınırı (yerel `YYYY-MM-DD`): yılbaşı ya da bu haftanın Pazartesi'si, hangisi
 * önceyse — Ocak'ın ilk günlerinde çizelgenin ve "bu hafta"nın Aralık günleri de gelsin.
 */
export function leaveFrom(now = new Date()) {
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const monday = weekStart(now)
  const d = monday < jan1 ? monday : jan1
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Kişinin izin durumu: `current` bugünü kapsayan TAMAMLANMIŞ izin (ve `until` bitişi),
 * `pendingNow` bugünü kapsayan ama onaydaki izin, `next` bugünden sonra başlayan ilk izin
 * (onaydaysa `statusKind: "pending"`).
 */
export function memberStatus(leaves, now = new Date()) {
  const today = startOfDay(now)
  const list = absences(leaves)
  const current = taken(leaves).find((r) => overlaps(r, today, today)) ?? null
  // Bugünü kapsayan ama henüz tamamlanmamış izin: "izinde" değil, "onayda".
  const pendingNow = current
    ? null
    : (list.find((r) => isPendingLeave(r) && overlaps(r, today, today)) ?? null)
  const next = list.filter((r) => r.start > today).sort((a, b) => a.start - b.start)[0] ?? null
  return { current, until: current ? endOf(current) : null, next, pendingNow }
}

/**
 * Ekip özeti: `today` bugün izinde, `thisWeek` bu hafta (Pzt–Paz) izni olan kişi sayısı ve
 * anahtarları (`todayKeys`, `weekKeys`), `size`, haftanın sınırları (`week`).
 */
export function teamSummary(members, now = new Date()) {
  const today = startOfDay(now)
  const from = weekStart(today)
  const to = addDays(from, 6)
  const todayKeys = []
  const weekKeys = []
  for (const m of members ?? []) {
    // Bugün / bu hafta izinde: yalnız tamamlanmış izin.
    const list = taken(m.leaves)
    if (list.some((r) => overlaps(r, today, today))) todayKeys.push(m.key)
    if (list.some((r) => overlaps(r, from, to))) weekKeys.push(m.key)
  }
  return {
    size: members?.length ?? 0,
    today: todayKeys.length,
    thisWeek: weekKeys.length,
    todayKeys,
    weekKeys,
    week: { from, to },
  }
}

const index = (first, date) => dayDiff(first, date)

/**
 * Zaman çizelgesi: `weeks` haftalık gün sütunları (`days[i]` = `{ date, weekend, today, past }`),
 * hafta başları (`weekStarts`: sütun sırası ve tarih) ve her üye için izinler sütun aralığı
 * (`segments` = `[{ from, to, record, absence, partial }]`, uçlar pencereye kırpılmış).
 * `start`: "today" (bugünden), "week" (bu haftanın Pazartesi'sinden; bugün ilk haftada) ya da bir
 * tarih (gezinilen dönemin ilk günü, `timelineWindow`).
 */
export function teamTimeline(members, now = new Date(), { weeks = 6, start = "today" } = {}) {
  const today = startOfDay(now)
  const first =
    start instanceof Date ? startOfDay(start) : start === "week" ? weekStart(today) : today
  const n = weeks * 7
  const days = Array.from({ length: n }, (_, i) => {
    const date = addDays(first, i)
    return {
      date,
      weekend: isWeekend(date),
      today: date.getTime() === today.getTime(),
      past: date < today,
    }
  })
  const weekStarts = days
    .map((d, i) => ({ index: i, date: d.date }))
    .filter((d) => d.index === 0 || d.date.getDay() === 1)
  const last = days[n - 1].date
  const rows = (members ?? []).map((m) => ({
    key: m.key,
    segments: valid(m.leaves)
      .filter((r) => overlaps(r, first, last))
      .sort((a, b) => a.start - b.start)
      .map((r) => ({
        from: Math.max(0, index(first, r.start)),
        to: Math.min(n - 1, index(first, endOf(r))),
        record: r,
        absence: isAbsence(r),
        partial: isPartial(r),
      })),
  }))
  return { days, weekStarts, rows }
}

/**
 * Önümüzdeki `weeks` haftadaki izinler (bugünü kapsayanlar dahil), başlangıca göre: telefonun
 * çizelge yerine listesi. `from`/`to`: gezinilen dönem (verilmezse bugünden `weeks` hafta).
 * `[{ key, record, current, absence, partial }]`; `current` bugünü kapsayan.
 */
export function upcomingLeaves(
  members,
  now = new Date(),
  { weeks = 6, from = null, to = null } = {},
) {
  const today = startOfDay(now)
  const first = from ? startOfDay(from) : today
  const last = to ? startOfDay(to) : addDays(first, weeks * 7 - 1)
  const out = []
  for (const m of members ?? [])
    for (const r of valid(m.leaves))
      if (overlaps(r, first, last))
        out.push({
          key: m.key,
          record: r,
          current: overlaps(r, today, today),
          absence: isAbsence(r),
          partial: isPartial(r),
        })
  return out.sort((a, b) => a.record.start - b.record.start || String(a.key).localeCompare(b.key))
}

/**
 * Üyenin yılı: türe göre kırılım (`leaveReport` — gün, saat, kayıt), devamsızlık günleri ve
 * yaklaşan izinleri (bugünden sonra başlayan, tarih sırasıyla).
 */
export function memberYear(leaves, year, now = new Date()) {
  const today = startOfDay(now)
  const list = valid(leaves)
  const { byType } = leaveReport(list, year)
  const absenceDays = list
    .filter((r) => r.start.getFullYear() === year && isAbsence(r))
    .reduce((n, r) => n + (r.days ?? 0), 0)
  const upcoming = list.filter((r) => r.start > today).sort((a, b) => a.start - b.start)
  return { byType, absenceDays, upcoming }
}

/**
 * Ekibin bölümleri: "reports" (bana bağlı olanlar) ve "teammates" (yönetici + ekip arkadaşları).
 * Kişinin kendisi ekip arkadaşlarının başında; yöneticisi ve ekip arkadaşı yoksa bağlılarının
 * başında (`peers`: ekip arkadaşı bölümü var mı).
 */
export const groupOf = (row, peers = true) =>
  isReport(row) || (isSelf(row) && !peers) ? "reports" : "teammates"

// Hiyerarşi yukarıdan aşağıya: yönetici, ben, ekip arkadaşları, bana bağlı olanlar; aynı
// basamakta ada göre (Türkçe harf sırası: Ç, Ğ, İ, Ö, Ş, Ü yerinde).
const RANK = { [RELATION.manager]: 0, [RELATION.self]: 1, [RELATION.peer]: 2, [RELATION.report]: 3 }
const byName = new Intl.Collator("tr", { sensitivity: "base" })
const nameOf = (row) => String(row.person?.name ?? row.person?.displayName ?? "")
const ranked = (a, b) => RANK[a.relation] - RANK[b.relation] || byName.compare(nameOf(a), nameOf(b))

/**
 * Ekibim'in görünüm verisi: Graph üyeleri (`people`, `relation` ile) + ERP izin cevabı
 * (`leave.members`) → satırlar (`{ key, person, relation, group, personnel, matched, balance,
 * leaves, status }`; bana bağlılarda izin türü adı `t` ile), bölümler (`groups`: boş olanı yok), özet
 * (+ ortalama kalan yıllık izin YALNIZ bana bağlılardan; `reports`, `teammates`), haftaya hizalı
 * çizelge (listeyle aynı sıra: hiyerarşi, sonra ad) ve yaklaşan izinler (tarih sırası). Gizlilik kuralı
 * burada da uygulanır: bana bağlı olmayanın bakiyesi yok, izni türsüz (kişinin kendisi hariç:
 * `relation: "self"` satırı kendi izin türü ve bakiyesiyle). `range`: gezinilen dönem
 * (`timelineWindow`; verilmezse bu hafta + 6 hafta, liste bugünden).
 */
export function teamOverview(people, leave, { now = new Date(), t, range = null } = {}) {
  const members = leave?.members ?? {}
  const rows = (people ?? []).map((person) => {
    const key = memberKey(person)
    const relation = relationOf(person)
    const m = members[key]
    const full = seesAll({ relation })
    const leaves = visibleLeaves({ relation }, m?.leaves).map((r) =>
      full && t ? { ...r, typeName: leaveTypeName(r.type, t) } : r,
    )
    return {
      key,
      person,
      relation,
      personnel: String(person.employeeId ?? "").trim() || m?.personnel || "",
      // Kişinin kendi kayıtları eşleme istemez (kendi Self Servis verisi).
      matched: Boolean(m?.personnel) || (isSelf({ relation }) && Boolean(m)),
      balance: full ? (m?.balance ?? null) : null,
      leaves,
      status: memberStatus(leaves, now),
    }
  })
  const input = rows.map((r) => ({ key: r.key, leaves: r.leaves }))
  const reports = rows.filter(isReport)
  const me = rows.filter(isSelf).length
  const remains = reports.map((r) => r.balance?.remain).filter((n) => n != null)
  const timeline = teamTimeline(input, now, {
    start: range?.first ?? "week",
    weeks: range?.weeks ?? 6,
  })
  // Liste ve çizelge aynı sırada: hiyerarşi (yönetici, ekip arkadaşları, bana bağlılar), sonra ad.
  const listed = [...rows].sort(ranked)
  const order = new Map(listed.map((r, i) => [r.key, i]))
  timeline.rows = [...timeline.rows].sort((a, b) => order.get(a.key) - order.get(b.key))
  const peers = rows.length - reports.length - me > 0
  for (const r of listed) r.group = groupOf(r, peers)
  const groups = ["teammates", "reports"]
    .map((id) => ({ id, rows: listed.filter((r) => r.group === id) }))
    .filter((g) => g.rows.length)
  return {
    rows: listed,
    groups,
    summary: {
      // Bugün ve bu hafta izinde olanlara kişinin kendisi de girer; ekip sayısına girmez.
      ...teamSummary(input, now),
      size: rows.length - me,
      reports: reports.length,
      teammates: rows.length - reports.length - me,
      avgRemain: remains.length ? remains.reduce((a, b) => a + b, 0) / remains.length : null,
    },
    timeline,
    upcoming: upcomingLeaves(input, now, range ? { from: range.from, to: range.to } : {}),
  }
}
