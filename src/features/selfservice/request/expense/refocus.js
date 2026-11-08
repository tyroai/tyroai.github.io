/**
 * Odak kayboldu mu: odaktaki öğe çizimden kalkınca tarayıcı odağı gövdeye, Radix penceresi ise
 * pencerenin köküne bırakır — sonraki Tab pencerenin başından başlar, kişi yerini yitirir.
 */
export function focusLost() {
  const el = document.activeElement
  return !el || el === document.body || el.getAttribute("role") === "dialog"
}

/**
 * Çizim bittikten sonra (iki kare) odak kaybolduysa `find()`ın verdiği öğeye geçer; odak başka
 * bir yerdeyse (kişi bu arada başka alana geçti) dokunmaz. Kalkan düğmenin yerine en yakın
 * anlamlı denetim: seçilen önerinin kategorisi, kaldırılan fişin yanındaki fiş, dolan kalemin
 * fiş düğmesi. `leaving`: solarak kalkan öğe (geri alma şeridinin "Geri al"ı) — odak hâlâ
 * ondaysa da taşınır, yoksa sönüş bitince kaybolurdu.
 */
export function refocus(find, leaving = null) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!focusLost() && !(leaving && document.activeElement === leaving)) return
      const el = find()
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: "nearest" })
    }),
  )
}
