// Sunumun verisi: Genel Bakış'ın (filtrelenmiş) diliminden slaytların sayıları ve ana mesajlar.
// Hepsi plandan hesaplanır; slaytlar yalnız çizer.
import { monthEnd, monthStart } from "@/lib/rm/engine/dates"
import { openManDays, ratio } from "@/lib/rm/metrics"

/** Önümüzdeki `to`ya kadar en çok saat yazılan projeler: saat, pay, kişi sayısı. */
export function busyProjects(rows, plan, today, to, top = 8) {
  const list = rows
    .filter((r) => r.phase !== "done")
    .map((r) => {
      let h = 0
      const who = new Set()
      for (const [rid, days] of Object.entries(plan.PA[r.id] || {})) {
        for (const [k, v] of Object.entries(days)) {
          if (+k >= today && +k <= to && v) {
            h += v
            who.add(rid)
          }
        }
      }
      return { row: r, h, n: who.size }
    })
    .filter((x) => x.h > 0)
    .sort((a, b) => b.h - a.h)
  const total = list.reduce((s, x) => s + x.h, 0)
  return { total, list: list.slice(0, top).map((x) => ({ ...x, share: total ? x.h / total : 0 })) }
}

/** Açık projeler bir alana göre: ad, renk, sayı; çok olan önce. */
function groupBy(rows, pick, color) {
  const m = new Map()
  for (const r of rows) {
    const k = pick(r) || "—"
    const o = m.get(k) || { name: k, n: 0, color: color?.(r) ?? null }
    o.n++
    m.set(k, o)
  }
  return [...m.values()].sort((a, b) => b.n - a.n)
}

/** Ekibin ilk "boşluk" ayı: doluluğu %85'in altına inen ilk ay (yoksa null). */
function firstRoom(row, months) {
  const i = row.cells.findIndex((c) => c.x != null && c.x < 0.85)
  return i < 0 ? null : months[i]
}

/** Ana mesajlar: en yoğun ekip-ay, aşım, en büyük proje, kişisiz, başlayanlar, boş/eksik gün. */
export function keyMessages(ov, busy) {
  const o = ov.ov
  const out = []
  if (o.peak && o.peak.x > 1) out.push({ key: "peak", tone: "danger", peak: o.peak })
  out.push(
    o.overPeople.length
      ? { key: "over", tone: "danger", n: o.overPeople.length }
      : { key: "overNone", tone: "ok" },
  )
  const top = busy.list[0]
  if (top) out.push({ key: "busy", tone: "brand", row: top.row, share: top.share })
  if (o.unstaffed) out.push({ key: "unstaffed", tone: "warn", n: o.unstaffed })
  if (o.startingSoon) out.push({ key: "starting", tone: "brand", n: o.startingSoon })
  const open = ov.teams.reduce((s, t) => s + t.open, 0)
  const roomy = [...ov.teams].sort((a, b) => b.open - a.open)[0]
  if (open >= 0 && roomy && roomy.open > 0) {
    out.push({ key: "free", tone: "ok", n: open, team: roomy.team })
  } else if (open < 0) out.push({ key: "short", tone: "danger", n: -open })
  return out.slice(0, 6)
}

/**
 * Sunumun tüm sayıları. `ov`: Genel Bakış dilimi (`overviewSlice`), filtresiyle birlikte.
 */
export function deckData(ov, st, plan, today) {
  const dh = +st.settings.dayHours || 8
  const open = ov.rows.filter((r) => r.phase !== "done")
  const horizon = monthEnd(monthStart(today) + 62)
  const busy = busyProjects(ov.rows, plan, today, horizon, 7)
  const catColor = new Map((st.pcats || []).map((c) => [c.name, c.color || null]))
  const sig = (s) => open.filter((r) => r.signals.includes(s))
  return {
    totals: {
      open: open.length,
      active: ov.ov.active,
      upcoming: ov.ov.upcoming,
      done: ov.rows.length - open.length,
      people: ov.people.length,
      teams: ov.teams.length,
      hoursAhead: open.reduce((s, r) => s + r.future, 0),
    },
    cats: groupBy(
      open,
      (r) => r.cats[0],
      (r) => catColor.get(r.cats[0]) ?? r.color,
    ),
    prios: groupBy(open, (r) => r.prio),
    busy,
    horizon,
    starting: sig("startingSoon").sort((a, b) => a.start - b.start),
    ending: sig("endingSoon").sort((a, b) => a.end - b.end),
    forecast: ov.months.map((m) => ({ ...m, free: Math.round((m.cap - m.pj) / dh) })),
    rooms: ov.grid.rows.map((row) => ({
      team: row.team,
      x: ratio(row.total),
      open: openManDays(row.total, dh),
      room: firstRoom(row, ov.grid.months),
    })),
    messages: keyMessages(ov, busy),
  }
}
