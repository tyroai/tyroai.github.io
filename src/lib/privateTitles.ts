/**
 * Sunum modunda kişisel öğelerin `title` ipucu da gizlenir: bulanık bir satırın üstüne gelince
 * tarayıcının ipucu metni açık açık göstermesin. Açılınca `[data-private]` içindeki `title`lar
 * `data-private-title`a taşınır (sonradan çizilenler de, gözlemciyle); kapanınca geri yazılır.
 */
const ATTR = "data-private-title"
const SEL = "[data-private][title], [data-private] [title]"

function stash(el: Element) {
  const v = el.getAttribute("title")
  if (v == null) return
  el.setAttribute(ATTR, v)
  el.removeAttribute("title")
}

function hideIn(root: Element | Document) {
  if (root instanceof Element && root.matches(SEL)) stash(root)
  root.querySelectorAll(SEL).forEach(stash)
}

let observer: MutationObserver | null = null

export function setPrivateTitlesHidden(on: boolean): void {
  if (typeof document === "undefined") return
  if (!on) {
    observer?.disconnect()
    observer = null
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => {
      el.setAttribute("title", el.getAttribute(ATTR) ?? "")
      el.removeAttribute(ATTR)
    })
    return
  }
  if (observer) return
  hideIn(document)
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "childList") r.addedNodes.forEach((n) => n instanceof Element && hideIn(n))
      else if (r.target instanceof Element && r.target.closest("[data-private]")) {
        if (r.attributeName === "title") stash(r.target)
        else hideIn(r.target)
      }
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["title", "data-private"],
  })
}
