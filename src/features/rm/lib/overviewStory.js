// Genel Bakış'ın durum anlatısı: selamın altında kısa paragraf. Değerler işaretli: ton, ipucu
// (başlık · durum · satırlar · not) ve basınca açılan panel (`pick`). Cümleler sözlükte şablon;
// rakam 1 ise tekil anahtar (İngilizce gibi dillerde ek ve fiil değişir).
import { day, monthLabel, num, pct } from "./format"
import { level } from "@/lib/rm/metrics"
import { periodCapacity } from "@/lib/rm/overviewDetails"
import { templatePieces } from "./templatePieces"

const TONE = { over: "danger", high: "warn", ok: "brand", none: "brand" }
const TOP = 3

/**
 * @typedef {{ title: string, accent?: { tone: string, text: string }, rows: [string, string][], note?: string }} Tip
 * @typedef {{ text: string, tone: string, tip: Tip, pick?: { metric?: string, team?: string } }} Mark
 */

/**
 * Anlatının parçaları: düz metin `{ text }` ya da işaretli değer `{ text, tone, tip, pick }`.
 * @param {object} ov `useOverview()` sonucu (ov.ov, months, load, rows, grid)
 * @param {{ rt: Function, locale: string, nameOf?: (name: string) => string }} ctx
 */
export function overviewStory(ov, { rt, locale, nameOf = (n) => n }) {
  const o = ov.ov
  const hours = (n) => rt("rm.unit.hours", { n: num(n, locale) })
  const one = (key, vars) => rt(vars.n === 1 ? `${key}1` : key, vars)
  const top = (list, row) => {
    const rows = list.slice(0, TOP).map(row)
    if (list.length > TOP) rows.push([rt("rm.story.more", { n: list.length - TOP }), ""])
    return rows
  }
  const sentences = []
  const say = (key, marks = {}, plain = {}) => {
    const vars = { ...plain }
    for (const [k, m] of Object.entries(marks)) vars[k] = m.text
    sentences.push(templatePieces(rt(key), vars, marks))
  }

  // 1) Doluluk: bu ay ve gelecek ay (Aylık kapasite kartının ilk iki sütunu).
  const [m0, m1] = ov.months
  const util = (m, x, title) => ({
    text: pct(x, locale),
    tone: TONE[level(x)],
    pick: { metric: "util" },
    tip: {
      title: rt(title),
      accent: { tone: TONE[level(x)], text: rt(`rm.story.lv.${level(x)}`) },
      rows: m
        ? [
            [rt("rm.story.row.cap"), hours(m.cap)],
            [rt("rm.story.row.pj"), hours(m.pj)],
            [
              rt(m.cap >= m.pj ? "rm.story.row.free" : "rm.story.row.short"),
              hours(Math.abs(m.cap - m.pj)),
            ],
          ]
        : [],
      note: rt("rm.story.n.util"),
    },
  })
  if (o.utilNow != null) {
    const now = util(m0, o.utilNow, "rm.story.t.now")
    if (o.utilNext != null)
      say("rm.story.util", { now, next: util(m1, o.utilNext, "rm.story.t.next") })
    else say("rm.story.util1", { now })
  }

  // 2) Aşım (Aşırı yüklenen kartının sırası) ve en yüklü ekip-ay.
  const n = o.overPeople.length
  if (n) {
    // Sıra Aşırı yüklenen kartınınki (iki ayın en yükseği önce): satırda iki ay birlikte.
    const load = new Map(ov.load.over.map((x) => [x.r.id, x]))
    const both = (r) => {
      const x = load.get(r.id)
      return x?.x1 != null ? `${pct(x.x0, locale)} / ${pct(x.x1, locale)}` : pct(x?.x0, locale)
    }
    const over = {
      text: one("rm.story.v.people", { n }),
      tone: "danger",
      pick: { metric: "over" },
      tip: {
        title: rt("rm.story.t.over"),
        accent: { tone: "danger", text: rt("rm.story.a.twoMonths") },
        rows: top(o.overPeople, (r) => [nameOf(r.name), both(r)]),
        note: rt("rm.story.n.over"),
      },
    }
    const peak = o.peak && o.peak.x > 1.0001 ? o.peak : null
    if (peak) {
      const row = ov.grid.rows.find((r) => r.team === peak.team)
      const tip = {
        title: rt("rm.story.t.peak"),
        accent: {
          tone: "danger",
          text: monthLabel(peak.month.y, peak.month.m, locale, { long: true }),
        },
        rows: [
          [rt("rm.story.row.fill"), pct(peak.x, locale)],
          [rt("rm.story.row.people"), row ? String(row.people.length) : "—"],
        ],
        note: rt("rm.story.n.peak"),
      }
      const pick = { team: peak.team }
      say("rm.story.overPeak", {
        over,
        team: { text: peak.team, tone: "brand", tip, pick },
        peak: { text: pct(peak.x, locale), tone: "danger", tip, pick },
      })
    } else say("rm.story.over", { over })
  } else say("rm.story.overNone")

  // 3) Dönemin boş proje kapasitesi (Proje kapasitesi göstergesiyle aynı toplam).
  const c = periodCapacity(ov.months)
  const months = { n: ov.months.length }
  if (c.cap > 0 && c.free > 0) {
    say(
      "rm.story.free",
      {
        free: {
          text: rt("rm.story.v.hours", { n: num(c.free, locale) }),
          tone: "ok",
          pick: { metric: "cap" },
          tip: {
            title: rt("rm.story.t.free"),
            accent: { tone: "ok", text: rt("rm.story.a.months", months) },
            rows: [
              [rt("rm.story.row.cap"), hours(c.cap)],
              [rt("rm.story.row.pj"), hours(c.pj)],
              [rt("rm.story.row.fill"), pct(c.x, locale)],
            ],
            note: rt("rm.story.n.free"),
          },
        },
      },
      months,
    )
  } else if (c.cap > 0) say("rm.story.freeNone", {}, months)

  // 4) Projeler: 60 günde başlayan, kişisiz, takvim riskinde — olanlar tek cümlede.
  const open = ov.rows.filter((r) => r.phase !== "done")
  const sig = (...s) => open.filter((r) => s.some((x) => r.signals.includes(x)))
  const projects = (list, key, tone, metric, accent, date) => ({
    text: one("rm.story.v.projects", { n: list.length }),
    tone,
    pick: { metric },
    tip: {
      title: rt(`rm.story.t.${key}`),
      accent: { tone, text: accent },
      rows: top(list, (r) => [`${r.code} · ${r.name}`, date ? day(r[date], locale) : ""]),
      note: rt(`rm.story.n.${key}`),
    },
  })
  const clauses = []
  const starting = sig("startingSoon").sort((a, b) => a.start - b.start)
  if (starting.length) {
    const v = projects(starting, "starting", "brand", "ending", rt("rm.story.a.days60"), "start")
    clauses.push([starting.length === 1 ? "rm.story.starting1" : "rm.story.starting", v])
  }
  const unstaffed = sig("unstaffed")
  if (unstaffed.length) {
    const v = projects(unstaffed, "unstaffed", "warn", "unstaffed", rt("rm.story.a.noPeople"))
    clauses.push([unstaffed.length === 1 ? "rm.story.unstaffed1" : "rm.story.unstaffed", v])
  }
  const risk = sig("overdue", "late").sort((a, b) => a.end - b.end)
  if (risk.length) {
    const v = projects(risk, "risk", "danger", "risk", rt("rm.story.a.late"), "end")
    clauses.push([risk.length === 1 ? "rm.story.risk1" : "rm.story.risk", v])
  }
  if (clauses.length) {
    const pieces = clauses.flatMap(([key, v], i) => [
      ...(i ? [{ text: rt("rm.story.sep") }] : []),
      ...templatePieces(rt(key), { v: v.text }, { v }),
    ])
    pieces.push({ text: rt("rm.story.end") })
    sentences.push(pieces)
  }

  return sentences.flatMap((s, i) => (i ? [{ text: " " }, ...s] : s))
}

/** Düz metin (test ve özet için). */
export const storyText = (pieces) => pieces.map((p) => p.text).join("")
