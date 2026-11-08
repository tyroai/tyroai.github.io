import { useCallback, useId, useRef } from "react"

/**
 * Üstüne gelinen sütun vurgusu (satır vurgusu tablonun kendi hover'ı): binlerce hücreyi yeniden
 * çizmemek için tek bir <style> kuralı değişir. Vurgu gölgeyle çizilir, hücrenin ısı tonunu ezmez.
 * Döner: { scope, styleRef, onMouseOver, onMouseLeave } — `scope` tablonun `data-mx` niteliği.
 */
export function useCrosshair() {
  const scope = useId().replace(/[^a-zA-Z0-9]/g, "")
  const styleRef = useRef(null)
  const last = useRef(null)
  const set = useCallback(
    (col) => {
      if (col === last.current) return
      last.current = col
      if (!styleRef.current) return
      styleRef.current.textContent =
        col == null
          ? ""
          : `[data-mx="${scope}"] [data-col="${col}"]{box-shadow:inset 0 0 0 100px color-mix(in oklab,var(--color-brand) 7%,transparent)}`
    },
    [scope],
  )
  const onMouseOver = useCallback(
    (e) => set(e.target.closest?.("[data-col]")?.dataset.col ?? null),
    [set],
  )
  const onMouseLeave = useCallback(() => set(null), [set])
  return { scope, styleRef, onMouseOver, onMouseLeave }
}
