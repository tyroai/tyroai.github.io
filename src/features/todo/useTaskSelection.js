import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { allSelected, nextSelection } from "@/features/todo/lib/todoSelection"

const EMPTY = new Set()

/**
 * Listenin çoklu seçim kipi. Seçim görünüme bağlı: görünüm değişince kip kapanır ve geri
 * dönülünce eski seçim canlanmaz. Görünür olanlar katlanmamış grupların görevleri; işler
 * yalnız görünür ve seçili olanlara uygulanır (`chosen`) — aramayla gizlenen seçili bir
 * görev sessizce silinmesin.
 */
export function useTaskSelection(groups, collapsed, view) {
  const [state, setState] = useState({ view: null, ids: EMPTY })
  const anchor = useRef(null)
  if (state.view !== null && state.view !== view) setState({ view: null, ids: EMPTY })
  const active = state.view === view

  const visible = useMemo(
    () => groups.filter((g) => !(g.collapsible && collapsed.has(g.id))).flatMap((g) => g.tasks),
    [groups, collapsed],
  )
  const order = useMemo(() => visible.map((x) => x.id), [visible])
  const chosen = useMemo(
    () => (active ? visible.filter((x) => state.ids.has(x.id)) : []),
    [active, visible, state.ids],
  )

  const start = useCallback(
    (id = null) => {
      anchor.current = id
      setState({ view, ids: id ? new Set([id]) : EMPTY })
    },
    [view],
  )
  const stop = useCallback(() => {
    anchor.current = null
    setState({ view: null, ids: EMPTY })
  }, [])
  const toggle = useCallback(
    (id, range = false) => {
      const from = anchor.current
      // Son seçim kaldırılınca kip kapanır (yuvarlak seçimi açar, boş seçimle çubuk kalmaz).
      setState((s) => {
        const ids = nextSelection(s.ids, order, id, { range, anchor: from })
        return ids.size ? { ...s, ids } : { view: null, ids: EMPTY }
      })
      if (!range || !from) anchor.current = id
    },
    [order],
  )
  const toggleAll = useCallback(() => {
    setState((s) => ({ ...s, ids: allSelected(s.ids, order) ? EMPTY : new Set(order) }))
  }, [order])

  // Esc kipten çıkar; açık bir pencere ya da açılır Esc'i kendisi tüketir (defaultPrevented).
  useEffect(() => {
    if (!active) return undefined
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      if (e.target?.closest?.("input, textarea, select, [contenteditable='true']")) return
      stop()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [active, stop])

  return {
    active,
    ids: active ? state.ids : EMPTY,
    chosen,
    count: visible.length,
    all: active && allSelected(state.ids, order),
    start,
    stop,
    toggle,
    toggleAll,
  }
}
