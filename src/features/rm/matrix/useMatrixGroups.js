import { useMemo } from "react"
import { resCap } from "@/lib/rm/engine/capacity"
import { day } from "@/features/rm/lib/format"
import { personMatrix, projectMatrix, teamMatrix } from "@/features/rm/lib/matrix"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { textMatch } from "@/features/rm/lib/projectFilters"

const norm = (s) => String(s || "").toLocaleLowerCase("tr-TR")

/**
 * Matrisin satırları: proje bazlıda proje (toplamlar) ve altında ekibi; ekip bazlıda ekip (toplam ve
 * kapasite) ve altında üyeleri; kişi bazlıda kişi (toplam ve kapasite) ve altında projeleri. Arama
 * ve ekip filtresiyle. `over`: aralıkta kapasitesi aşılan kişi sayısı (filtreden bağımsız, sayfa
 * başındaki gösterge).
 */
export function useMatrixGroups({ st, plan, cols, rows, dir, mode, team, q, rt, locale }) {
  const nameOf = useMemo(() => {
    const m = new Map(st.resources.map((r) => [r.id, r.name]))
    return (rid) => m.get(rid) ?? rid
  }, [st])

  const groups = useMemo(() => {
    const people = st.resources.filter(
      (r) =>
        (!team || r.team === team) &&
        (!q || norm(`${r.name} ${fullName(dir, r.name)}`).includes(norm(q))),
    )
    if (mode === "team") {
      // Ton sırası Kapasite'deki gibi: ekibin kişi listesindeki ilk görünüşü.
      const tones = [...new Set(st.resources.map((r) => r.team))]
      const order = (plan.teams.list || []).map((t) => t.name)
      return teamMatrix(st, plan, cols, { people, rows, order }).map((x) => ({
        key: `team:${x.team}`,
        team: x.team,
        index: Math.max(0, tones.indexOf(x.team)),
        label: x.team,
        sub: rt("rm.matrix.teamSub", { n: x.members.length }),
        cells: x.cells,
        rows: x.members.map((m) => ({
          key: m.r.id,
          label: fullName(dir, m.r.name),
          avatar: m.r.name,
          cells: m.cells,
        })),
      }))
    }
    if (mode === "person") {
      return personMatrix(st, plan, cols, { people, rows }).map((x) => ({
        key: x.r.id,
        label: fullName(dir, x.r.name),
        avatar: x.r.name,
        sub: [x.r.team, rt("rm.matrix.capDay", { h: resCap(st, plan, x.r) })].join(" · "),
        cells: x.cells,
        rows: x.projects.map((p) => ({
          key: p.row.id,
          label: `${p.row.code} · ${p.row.name}`,
          color: p.row.color,
          cells: p.cells,
        })),
      }))
    }
    const projects = rows
      .filter((r) => r.phase !== "done" && textMatch(r, q, nameOf))
      .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    return projectMatrix(st, plan, cols, { projects }).map((x) => ({
      key: x.row.id,
      label: `${x.row.code} · ${x.row.name}`,
      color: x.row.color,
      sub: `${day(x.row.start, locale)} – ${day(x.row.end, locale)}`,
      totals: x.totals,
      rows: x.members.map((m) => ({
        key: m.r.id,
        label: fullName(dir, m.r.name),
        avatar: m.r.name,
        cells: m.cells,
      })),
    }))
  }, [mode, st, plan, cols, rows, team, q, nameOf, rt, locale, dir])

  const over = useMemo(
    () =>
      personMatrix(st, plan, cols, { people: st.resources, rows }).filter((x) =>
        x.cells.some((c) => c.over),
      ).length,
    [st, plan, cols, rows],
  )

  return { groups, over, nameOf }
}
