/**
 * Kayan bir kapta (telefonda çekmecenin gövdesi) bir öğeyi görünür alana getirir. `revealTop`
 * saf hesap: `box` kabın, `el` öğenin dikdörtgeni (`top`, `bottom`, `height`; ekran
 * koordinatı), `scrollTop` kabın şimdiki kaydırması. Öğe kabın görünen kısmında kenardan `margin`
 * payla tam görünüyorsa `null`; değilse öğeyi görünen alanın ortasına getiren yeni `scrollTop`.
 */
export function revealTop({ box, el, scrollTop, margin = 12 }) {
  const top = el.top - box.top
  const bottom = el.bottom - box.top
  if (top >= margin && bottom <= box.height - margin) return null
  return Math.max(0, Math.round(scrollTop + top - (box.height - el.height) / 2))
}

/**
 * `revealTop`'un DOM karşılığı: yalnız `scroller` kayar (sayfa ve üst kaplar değil). Kaydırdıysa
 * `true`.
 */
export function revealInScroller(scroller, el, { behavior = "smooth" } = {}) {
  const next = revealTop({
    box: scroller.getBoundingClientRect(),
    el: el.getBoundingClientRect(),
    scrollTop: scroller.scrollTop,
  })
  if (next === null) return false
  scroller.scrollTo({ top: next, behavior })
  return true
}
