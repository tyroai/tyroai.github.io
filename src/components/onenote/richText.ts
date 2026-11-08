/**
 * Düzenleyicinin DOM yardımcıları: imlecin yazı içindeki yeri (biçim değişince öğe yeniden
 * çizilir, imleç aynı yere döner) ve "Not ekle" alanında imlecin bulunduğu blok.
 */

const BLOCK = "p,div,h1,h2,h3,h4,h5,h6,li"

/** Seçimin sonunun `el` içindeki yazı uzaklığı; seçim dışarıdaysa `null`. */
export function caretOffset(el: Element): number | null {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return null
  const range = sel.getRangeAt(0)
  if (!el.contains(range.endContainer)) return null
  const pre = document.createRange()
  pre.selectNodeContents(el)
  pre.setEnd(range.endContainer, range.endOffset)
  return pre.toString().length
}

/** İmleci `el` içinde yazı uzaklığına koyar (yoksa sona). */
export function placeCaret(el: Element, offset: number | null): void {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let left = offset ?? Infinity
  let node = walker.nextNode()
  while (node) {
    const len = node.textContent?.length ?? 0
    if (left <= len) {
      range.setStart(node, left)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }
    left -= len
    node = walker.nextNode()
  }
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

/** "Not ekle" alanında imlecin bulunduğu blok (alanın kendisi değil); yoksa `null`. */
export function blockAt(area: Element): Element | null {
  const node = window.getSelection()?.anchorNode
  if (!node || !area.contains(node)) return null
  const el = node.nodeType === 1 ? (node as Element) : node.parentElement
  const block = el?.closest(BLOCK)
  return block && block !== area && area.contains(block) ? block : null
}

/** Satır başında yazılan kısayol: `- ` / `* ` madde, `1. ` numaralı, `[] ` yapılacak. */
export function shortcutAt(area: Element): "ul" | "ol" | "todo" | null {
  const block = blockAt(area) ?? area
  if (block.closest("li")) return null
  const text = block.textContent ?? ""
  if (caretOffset(block) !== text.length) return null
  if (text === "-" || text === "*") return "ul"
  if (text === "1.") return "ol"
  if (text === "[]") return "todo"
  return null
}

/** Kısayolun yazısını siler (imleç boş satırda kalır). */
export function clearShortcut(area: Element): void {
  const block = blockAt(area) ?? area
  const range = document.createRange()
  range.selectNodeContents(block)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  document.execCommand("delete")
}
