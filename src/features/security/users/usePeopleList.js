import { useCallback, useMemo, useState } from "react"
import { filterPeople, pageOf, rangeIds } from "@/features/security/lib/authzPeople"

export const PAGE_SIZE = 50

/**
 * Kişiler listesinin durumu: URL'deki filtrelerle süzülmüş liste (bellekte, 850 satırda anlık),
 * sayfa (masaüstü 50'lik sayfa; telefonda "Daha fazla" ile büyüyen dilim) ve seçim (Gmail:
 * kutu, Shift aralığı, "filtrelenen hepsini seç"). Filtre değişince sayfa başa döner; seçim
 * korunur (seçili kişi süzülse de seçili kalır — çubuk toplamı söyler).
 */
export function usePeopleList({ rows, view, known, phone }) {
  const [page, setPage] = useState(1)
  const [phoneLimit, setPhoneLimit] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState(() => new Set())
  const [anchor, setAnchor] = useState(null)
  const filterKey = `${view.q}\n${view.role}\n${view.apps.join("\n")}`
  const [seenKey, setSeenKey] = useState(filterKey)
  // Filtre değişti: sayfa başa (render sırasında, efekt turu beklemeden).
  if (seenKey !== filterKey) {
    setSeenKey(filterKey)
    setPage(1)
    setPhoneLimit(PAGE_SIZE)
  }

  const filtered = useMemo(
    () => filterPeople(rows, { query: view.q, role: view.role, apps: view.apps, known }),
    [rows, view.q, view.role, view.apps, known],
  )
  const paged = useMemo(() => pageOf(filtered, page, PAGE_SIZE), [filtered, page])
  // Kararlı dizi: satırların `memo`su ve seçim geri çağrısı her çizimde bozulmasın.
  const shown = useMemo(
    () => (phone ? filtered.slice(0, phoneLimit) : paged.slice),
    [phone, filtered, phoneLimit, paged],
  )
  const shownIds = useMemo(() => shown.map((r) => r.id), [shown])

  // Silinen kayıt seçimde kalmasın.
  const liveSelected = useMemo(() => {
    const ids = new Set(rows.map((r) => r.id))
    return new Set([...selected].filter((id) => ids.has(id)))
  }, [rows, selected])

  const toggle = useCallback(
    (id, { shift = false } = {}) => {
      setSelected((prev) => {
        const next = new Set(prev)
        const on = !prev.has(id)
        const ids = shift && anchor ? rangeIds(shownIds, anchor, id) : [id]
        for (const x of ids) {
          if (on) next.add(x)
          else next.delete(x)
        }
        return next
      })
      setAnchor(id)
    },
    [anchor, shownIds],
  )
  const pageAllOn = shownIds.length > 0 && shownIds.every((id) => liveSelected.has(id))
  const pageSomeOn = !pageAllOn && shownIds.some((id) => liveSelected.has(id))
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of shownIds) {
        if (pageAllOn) next.delete(id)
        else next.add(id)
      }
      return next
    })
  const selectFiltered = () => setSelected(new Set(filtered.map((r) => r.id)))
  const clear = () => {
    setSelected(new Set())
    setAnchor(null)
  }

  return {
    filtered,
    shown,
    shownIds,
    page: paged.page,
    pageCount: paged.pageCount,
    from: paged.from,
    to: paged.to,
    setPage,
    hasMore: phone && filtered.length > phoneLimit,
    showMore: () => setPhoneLimit((n) => n + PAGE_SIZE),
    selected: liveSelected,
    toggle,
    pageAllOn,
    pageSomeOn,
    togglePage,
    selectFiltered,
    allFilteredOn: filtered.length > 0 && filtered.every((r) => liveSelected.has(r.id)),
    clear,
  }
}
