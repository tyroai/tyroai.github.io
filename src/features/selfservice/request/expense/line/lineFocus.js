/** Kalem kartının klavye ve kaydırma yardımcıları (DOM). */

// Bir alan satırının odaklanacak öğesi: yazı alanı, tarih düğmesi, seçici ya da seçili radyo.
const FIELD = "input, .req-ctl, [data-ms-trigger], [role='radio'][tabindex='0']"
const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown", "ArrowUp"])

/**
 * Kalemin yazı alanında Enter: form gönderilmez, odak karttaki sonraki alana geçer (telefon
 * klavyesinin "İleri"si); son alanda klavye kapanır.
 */
export function enterNext(e) {
  if (e.key !== "Enter" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return
  if (e.nativeEvent?.isComposing) return
  e.preventDefault()
  const field = e.currentTarget
  const cells = [...(field.closest("[data-xl-card]")?.querySelectorAll("[data-xl-cell]") ?? [])]
  const at = cells.findIndex((c) => c.contains(field))
  const next = cells
    .slice(at + 1)
    .map((c) => c.querySelector(FIELD))
    .find(Boolean)
  if (next) next.focus()
  else field.blur()
}

/** En yakın dikey kayan ata (pencerenin ya da çekmecenin gövdesi). */
function scrollParent(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight)
      return p
  }
  return null
}

/**
 * Seçicinin listesi kaydırma alanının altında kaldıysa alan yukarı kayar (telefonda kategori
 * listesinin yalnız iki seçeneği görünmesin). Liste büyüdükten sonra ölçülür: açık listenin
 * altı görünene ya da alanın başı üste gelene dek. Seçiciyi saran öğenin tıklama ve tuş
 * olaylarına (yakalama evresi) bağlanır.
 */
export function revealList() {
  const reveal = (el) => {
    const panel = el.querySelector("[data-morph-open] [data-ms-shape]")
    const scroller = panel && scrollParent(el)
    if (!scroller) return
    const box = el.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    const hidden = panel.getBoundingClientRect().bottom - view.bottom + 12
    const top = Math.min(hidden, box.top - view.top - 8)
    if (top <= 0) return
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    scroller.scrollBy({ top, behavior: calm ? "auto" : "smooth" })
  }
  // Liste yaylı büyür; kaydırma payı ancak büyüdükçe oluşur.
  const later = (el) => window.setTimeout(() => reveal(el), 260)
  return {
    onClickCapture: (e) => later(e.currentTarget),
    onKeyDownCapture: (e) => OPEN_KEYS.has(e.key) && later(e.currentTarget),
  }
}
