/**
 * Öğeyi YALNIZ verilen kaydırıcıda başa getirir (`scroll-margin-top` payıyla).
 * `scrollIntoView` değil: sayfa sonunda yer kalmayınca düzenin `overflow-hidden` kabını da
 * kaydırıyor, header'ın altı ve yapışkan arama görünmez oluyordu.
 */
export function reveal(box, el, smooth) {
  if (!box || !el) return
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
  box.scrollTo({ top: Math.max(0, top - margin), behavior: smooth ? "smooth" : "auto" })
}
