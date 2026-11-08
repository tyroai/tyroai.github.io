import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { lastView, viewOf } from "./views"

/**
 * Bölümün adres durumu: sayfa (`view`), seçili proje/kişi ve filtreler adreste durur; görünüm
 * bağlantıyla paylaşılır ("Kasım · AI ekibi"). Filtre değişimi geçmişe adım eklemez.
 */
export function useRmParams(edit) {
  const [params, setParams] = useSearchParams()
  const raw = params.get("view")
  // Direktör her zaman Genel Bakış'tan açılır; düzenleyen son baktığı sayfadan.
  const view = viewOf(raw, edit)?.key ?? (edit ? viewOf(lastView(), edit)?.key : null) ?? "genel"

  const get = useCallback((k, fallback = "") => params.get(k) ?? fallback, [params])

  const update = useCallback(
    (patch, { push = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!next.get("view")) next.set("view", view)
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === undefined || v === "") next.delete(k)
            else next.set(k, String(v))
          }
          return next
        },
        { replace: !push },
      )
    },
    [setParams, view],
  )

  const go = useCallback(
    (nextView, extra = {}) => setParams(new URLSearchParams({ view: nextView, ...extra })),
    [setParams],
  )

  return useMemo(() => ({ view, get, update, go }), [view, get, update, go])
}
