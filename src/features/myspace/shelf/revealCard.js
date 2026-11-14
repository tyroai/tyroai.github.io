// Halkanın ömrü (ms): `homeCommand.css` › `hcd-added` ile aynı.
const RING_MS = 1700

/**
 * Yazarak eklenen kartı gösterir: kart panonun sonuna eklenir ve çoğu kez sohbet çubuğunun
 * arkasında ya da ekranın altında kalır. Sayfa karta kayar (çubuğun üstünde tam görünür:
 * `scroll-margin`, `homeCommand.css`) ve kart bir an paletin halkasıyla parlar. Kart çizilene
 * dek kısa bir bekleme; azaltılmış harekette kaydırma anında, halka yalnız belirip söner.
 */
export function revealCard(id) {
  setTimeout(() => {
    const el = document.querySelector(`[data-widget-slot="${CSS.escape(id)}"]`)
    if (!el) return
    el.setAttribute("data-just-added", "")
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" })
    setTimeout(() => el.removeAttribute("data-just-added"), RING_MS)
  }, 80)
}
