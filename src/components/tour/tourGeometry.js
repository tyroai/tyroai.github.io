/**
 * Tur ölçüleri (DOM'a bakar, saf değil): hedefleri bul, delikleri çıkar, hedefi görünür kıl, kartın
 * yerini seç. Hedef bir ad ya da ad listesi — listede İLK GÖRÜNEN alınır (masaüstünde kenar çubuğu,
 * telefonda onu açan düğme); görünür hedefi olmayan adım atlanır. Ad: `data-tour` değeri,
 * `widget:<kimlik>` (panodaki kart), `sel:<seçici>` ya da "notch".
 */
export const PAD = 8 // vurgunun hedef çevresindeki payı
const GAP = 12 // vurgu ile kart arası
const EDGE = 12 // kartın ekran kenarına en yakın mesafesi

// Ad → seçici: `widget:<kimlik>` panodaki kart (`data-widget`), `sel:<seçici>` hazır bir öğe (dev
// dosyaya işaret eklemeden; ör. ilk bildirim kartı), "notch" çentik, gerisi `data-tour`.
function selectorOf(name) {
  if (name === "notch") return '[data-slot="edge-notch"]'
  if (name.startsWith("widget:")) return `[data-widget="${name.slice(7)}"]`
  if (name.startsWith("sel:")) return name.slice(4)
  return `[data-tour="${name}"]`
}

/** Adla görünen ilk öğe (sıfır boylu, gizli ya da saydam olan sayılmaz). */
export function visibleEl(name) {
  const sel = selectorOf(name)
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
      continue
    return el
  }
  return null
}

/** Adımın görünen hedefleri: `[{ name, el }]`; listeli hedefte ilk görünen. */
export function resolveTargets(step) {
  const out = []
  for (const target of step.targets) {
    for (const name of Array.isArray(target) ? target : [target]) {
      const el = visibleEl(name)
      if (el) {
        out.push({ name, el })
        break
      }
    }
  }
  return out
}

const inside = (o, h) =>
  h.left >= o.left - 1 &&
  h.top >= o.top - 1 &&
  h.left + h.width <= o.left + o.width + 1 &&
  h.top + h.height <= o.top + o.height + 1

/** Delikler: ekrana kırpılmış; iç içe olanın halkası çift çizilmesin diye ayıklanmış. */
export function holesOf(targets) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const raw = targets
    .map(({ name, el }) => {
      const r = el.getBoundingClientRect()
      const left = Math.max(r.left - PAD, 4)
      const top = Math.max(r.top - PAD, 4)
      const width = Math.min(r.right + PAD, vw - 4) - left
      const height = Math.min(r.bottom + PAD, vh - 4) - top
      return { name, left, top, width, height }
    })
    .filter((h) => h.width > 0 && h.height > 0)
  return raw.filter((h, i) => !raw.some((o, j) => j < i && inside(o, h)))
}

// En yakın dikey kaydırıcı (Anasayfa'nın, Self Servis'in… kendi kaydırıcısı).
function scrollParent(el) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if (/(auto|scroll)/.test(overflowY) && p.scrollHeight > p.clientHeight + 1) return p
  }
  return null
}

/**
 * Hedefleri kartla birlikte görünür kıl: ilk hedefin kaydırıcısındaki hedefler + altlarındaki kart
 * bir blok gibi ortalanır; sığmazsa hedeflerin başı üste hizalanır. Sabit öğeler (kenar çubuğu,
 * üst çubuk) kaydırılmaz.
 */
export function bringIntoView(targets, cardH, reduce) {
  const scroller = targets.length ? scrollParent(targets[0].el) : null
  if (!scroller) return
  const rects = targets
    .filter((x) => scroller.contains(x.el))
    .map((x) => x.el.getBoundingClientRect())
  const box = scroller.getBoundingClientRect()
  // Yapışkan başlığın altı (kaydırıcının `scroll-padding-top`u): hedef onun altında kalmasın.
  const inset = parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0
  const sr = { top: box.top + inset, height: box.height - inset }
  const top = Math.min(...rects.map((r) => r.top))
  const height = Math.max(...rects.map((r) => r.bottom)) - top
  const block = height + GAP + cardH
  const want = block <= sr.height - 48 ? sr.top + (sr.height - block) / 2 : sr.top + 24
  scroller.scrollBy({ top: top - want, behavior: reduce ? "auto" : "smooth" })
}

/** Kartın yeri: ilk hedefin altı · üstü · sağı · solu; hiçbiri olmazsa ekranın dibi ya da tepesi. */
export function placeCard(holes, w, h) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fits = (c) =>
    c.left >= EDGE && c.top >= EDGE && c.left + w <= vw - EDGE && c.top + h <= vh - EDGE
  const clear = (c) =>
    holes.every(
      (o) =>
        c.left + w <= o.left ||
        c.left >= o.left + o.width ||
        c.top + h <= o.top ||
        c.top >= o.top + o.height,
    )
  const cx = (x) => Math.min(Math.max(x, EDGE), vw - w - EDGE)
  const cy = (y) => Math.min(Math.max(y, EDGE), vh - h - EDGE)
  const p = holes[0]
  if (p) {
    const candidates = [
      { left: cx(p.left), top: p.top + p.height + GAP },
      { left: cx(p.left), top: p.top - GAP - h },
      { left: p.left + p.width + GAP, top: cy(p.top) },
      { left: p.left - GAP - w, top: cy(p.top) },
    ]
    for (const c of candidates) if (fits(c) && clear(c)) return c
  }
  const bottom = { left: (vw - w) / 2, top: vh - h - 16 }
  const top = { left: (vw - w) / 2, top: 16 }
  return clear(bottom) || !clear(top) ? bottom : top
}
