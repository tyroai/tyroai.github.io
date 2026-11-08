import { useCallback, useMemo } from "react"
import { OV_LISTS, ovOptions, overviewSlice, readOvFilter } from "@/features/rm/lib/overviewFilter"
import { useRm } from "../shell/RmContext"

// Genel Bakış'ta açılan panel: biri açılınca öteki kapanır (adreste tek seçim).
const PANELS = ["p", "person", "team", "metric"]

/**
 * Genel Bakış'ın filtrelenmiş verisi (filtre adreste: `period`, `teams`, `cats`, `prios`,
 * `statuses`, `countries`), seçenekler ve kenar paneli. Kartlar bu veriden çizilir; tıklama
 * sayfadan çıkmaz, sağdaki paneli açar.
 */
export function useOverview() {
  const { data, derived, today, params } = useRm()
  const period = params.get("period")
  const teams = params.get("teams")
  const cats = params.get("cats")
  const prios = params.get("prios")
  const statuses = params.get("statuses")
  const countries = params.get("countries")
  const slice = useMemo(() => {
    const raw = { period, teams, cats, prios, statuses, countries }
    const f = readOvFilter((k) => raw[k] ?? "")
    return overviewSlice(data.st, data.plan, today, derived.rows, f)
  }, [data.st, data.plan, today, derived.rows, period, teams, cats, prios, statuses, countries])
  const options = useMemo(
    () =>
      ovOptions(
        data.st,
        derived.grid.rows.map((r) => r.team),
      ),
    [data.st, derived.grid],
  )

  const { update } = params
  const setFilter = useCallback(
    (patch) => {
      const out = {}
      for (const [k, v] of Object.entries(patch)) {
        out[k] = Array.isArray(v) ? v.join(",") || null : v
      }
      update(out)
    },
    [update],
  )
  const clear = useCallback(
    () => update(Object.fromEntries(OV_LISTS.map((k) => [k, null]))),
    [update],
  )
  const open = useCallback(
    (kind, id) => update(Object.fromEntries(PANELS.map((k) => [k, k === kind ? id : null]))),
    [update],
  )
  const close = useCallback(
    () => update(Object.fromEntries(PANELS.map((k) => [k, null]))),
    [update],
  )
  return { ...slice, options, setFilter, clear, open, close }
}
