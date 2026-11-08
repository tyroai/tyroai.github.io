import { useCallback } from "react"

const itemOf = (root, attr, id) => root?.querySelector(`[data-${attr}="${CSS.escape(id)}"]`) ?? null

// Öğe kendisi odaklanabiliyorsa (`tabIndex`) o, değilse içindeki ilk düğme.
const focusTarget = (el) =>
  el.hasAttribute("tabindex") ? el : (el.querySelector("button, [href], input") ?? el)

/**
 * Eylemden sonra odak sıradaki öğeye geçer (Gmail: arşivleyince sonraki ileti) — öğe listeden
 * çıkınca odak gövdeye düşmesin. Öğeler `[data-<attr>="<id>"]` (talepte `data-state` ile aynı
 * bölüm). `neighbors(id)` sırayı eylemden ÖNCE okur (önce sonrakiler, sonra öncekiler);
 * `refocus(order, delay)` ilk yaşayanı odaklar, hiçbiri kalmadıysa `fallbackRef`'i.
 */
export function useFocusNext(rootRef, fallbackRef, attr = "req") {
  const neighbors = useCallback(
    (id) => {
      const root = rootRef.current
      const me = itemOf(root, attr, id)
      if (!me) return []
      const state = me.dataset.state
      const sel = state ? `[data-${attr}][data-state="${state}"]` : `[data-${attr}]`
      const ids = [...root.querySelectorAll(sel)].map((el) => el.getAttribute(`data-${attr}`))
      const i = ids.indexOf(id)
      return [...ids.slice(i + 1), ...ids.slice(0, i).reverse()]
    },
    [rootRef, attr],
  )

  // `delay`: kutu kapanırken odak tuzağı bırakılana dek beklenir.
  const refocus = useCallback(
    (order, delay = 0) =>
      setTimeout(() => {
        // Liste boşalıp kalktıysa (kök yok) doğrudan yedeğe.
        const root = rootRef.current
        for (const id of order) {
          const el = itemOf(root, attr, id)
          if (el) return focusTarget(el).focus()
        }
        fallbackRef.current?.focus()
      }, delay),
    [rootRef, fallbackRef, attr],
  )

  // Denetimli kutuda Radix odağı geri vermiyor (tetiği yok): açan düğmeye elle dönülür.
  const returnTo = useCallback((el, delay = 250) => {
    setTimeout(() => el?.isConnected && el.focus(), delay)
  }, [])

  return { neighbors, refocus, returnTo }
}
