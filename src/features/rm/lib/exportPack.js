// Direktör paketi (Excel): ekranlardaki rakamların aynısı; sayılar sayı, oranlar yüzde biçiminde.
// Sayfalar: Özet · Projeler · Kapasite (kişi × ay) · Ekip doluluğu. Takip ve atama sayfaları
// direktörün kararıyla pakette yok; kişi × proje saatleri Matris'in kendi Excel'inde.
import { resCap, workdaysBetween } from "@/lib/rm/engine/capacity"
import { monthEnd, monthStart, todayDay } from "@/lib/rm/engine/dates"
import { catLabel, day, monthLabel, stamp } from "./format"
import { monthsBetween, openManDays, personBuckets, ratio, sumBuckets } from "@/lib/rm/metrics"
import { fullName } from "./peopleDirectory"

const pct = (x) => ({
  v: x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000,
  fmt: "pct",
})
const int = (n) => ({ v: Math.round(n || 0), fmt: "int" })

/**
 * @param {{ st, plan, derived, rt, locale, people?: Map, meta?, today? }} ctx
 * @returns {{ name: string, rows: any[][], widths: number[] }[]}
 */
export function directorPack({ st, plan, derived, rt, locale, people, meta, today = todayDay() }) {
  const name = (r) => fullName(people, r.name)
  const months = monthsBetween(monthStart(today), monthEnd(monthStart(today) + 31 * 5))
  const mLabels = months.map((m) => monthLabel(m.y, m.m, locale, { long: true }))
  const { ov, rows } = derived
  const byPerson = new Map(st.resources.map((r) => [r.id, personBuckets(st, plan, r, months)]))
  const dh = +st.settings.dayHours || 8

  const summary = [
    [rt("rm.x.metric"), rt("rm.x.value"), rt("rm.x.note")],
    [
      rt("rm.kpi.open"),
      int(ov.active + ov.upcoming),
      rt("rm.kpi.openCap", { a: ov.active, u: ov.upcoming }),
    ],
    [rt("rm.kpi.util"), pct(ov.utilNow), rt("rm.kpi.hint.util")],
    [rt("rm.x.utilNext"), pct(ov.utilNext), ""],
    [rt("rm.kpi.over"), int(ov.overPeople.length), ov.overPeople.map(name).join(", ")],
    [rt("rm.kpi.risk"), int(ov.overdue + ov.late), rt("rm.kpi.hint.risk")],
    [rt("rm.kpi.unstaffed"), int(ov.unstaffed), rt("rm.kpi.hint.unstaffed")],
    [rt("rm.kpi.ending"), int(ov.endingSoon), rt("rm.kpi.endingCap", { n: ov.startingSoon })],
    [],
    [rt("rm.x.stamp"), stamp(meta?.modifiedOn, locale), meta?.modifiedBy || ""],
  ]

  const projects = [
    [
      rt("rm.col.code"),
      rt("rm.col.project"),
      rt("rm.projects.category"),
      rt("rm.col.prio"),
      rt("rm.col.status"),
      rt("rm.x.start"),
      rt("rm.x.end"),
      rt("rm.x.workdays"),
      rt("rm.set.country"),
      rt("rm.panel.sponsor"),
      rt("rm.x.pmo"),
      rt("rm.col.team"),
      rt("rm.x.hours"),
      rt("rm.x.lateHours"),
      rt("rm.panel.attention"),
      rt("rm.panel.tasks"),
    ],
    ...rows
      .slice()
      .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
      .map((r) => [
        r.code,
        r.name,
        r.cats.map(catLabel).join(", "),
        r.prio,
        r.status,
        day(r.start, locale, { year: true }),
        day(r.end, locale, { year: true }),
        r.start != null && r.end != null ? int(workdaysBetween(plan, r.start - 1, r.end)) : "",
        r.country,
        r.sponsor,
        r.pm,
        r.members
          .map((m) => name(st.resources.find((x) => x.id === m.rid) ?? { name: m.rid }))
          .join(", "),
        int(r.hours),
        r.lateH ? int(r.lateH) : "",
        r.signals.map((s) => rt(`rm.signal.${s}`)).join(", "),
        r.todo.total ? `${r.todo.done}/${r.todo.total}` : "",
      ]),
  ]

  const capacity = [
    [
      rt("rm.capacity.person"),
      rt("rm.capacity.team"),
      rt("rm.x.title"),
      rt("rm.x.capDay"),
      ...mLabels,
      rt("rm.x.openDays"),
    ],
    ...st.resources.map((r) => {
      const pb = byPerson.get(r.id)
      return [
        name(r),
        r.team,
        r.role || "",
        int(resCap(st, plan, r)),
        ...months.map((m) => pct(ratio(pb.M[m.key]))),
        int(openManDays(pb.T, dh)),
      ]
    }),
  ]

  const teamNames = [...new Set(st.resources.map((r) => r.team))]
  const order = (plan.teams.list || []).map((t) => t.name)
  teamNames.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
  const teams = [
    [rt("rm.capacity.team"), rt("rm.set.people"), ...mLabels],
    ...teamNames.map((t) => {
      const list = st.resources.filter((r) => r.team === t)
      return [
        t,
        int(list.length),
        ...months.map((m) => pct(ratio(sumBuckets(list.map((r) => byPerson.get(r.id).M[m.key]))))),
      ]
    }),
  ]

  return [
    { name: rt("rm.x.sheet.summary"), rows: summary, widths: [28, 14, 70] },
    {
      name: rt("rm.x.sheet.projects"),
      rows: projects,
      widths: [8, 34, 18, 7, 16, 12, 12, 9, 7, 18, 14, 40, 10, 12, 30, 9],
    },
    {
      name: rt("rm.x.sheet.capacity"),
      rows: capacity,
      widths: [24, 14, 16, 10, ...months.map(() => 12), 12],
    },
    { name: rt("rm.x.sheet.teams"), rows: teams, widths: [16, 8, ...months.map(() => 12)] },
  ]
}

export function packFileName(today = todayDay()) {
  const d = new Date(today * 864e5).toISOString().slice(0, 10)
  return `tyroRM_${d}.xlsx`
}
