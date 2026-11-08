/**
 * OneNote notunu WHATSAPP METNİNE çevirir (Paylaş › WhatsApp'ta gönder / WhatsApp için kopyala):
 * WhatsApp HTML okumaz ama kendi işaretlerini çizer — `*kalın*`, `_eğik_`, `~üstü çizili~`.
 * Başlıklar kalın, listeler `•` / `1.` (iç içe girintili), yapılacaklar ☐/☑, tablo satırları
 * `a | b`. Bağlantı eklenmez: alıcının deftere erişimi yok, notun kendisi gider.
 * Saf (DOM ayrıştırıcısı dışında bağımlılık yok): testli (`tests/unit/onenoteWhatsApp.test.ts`).
 */

/** `wa.me` adresine sığan metin (karakter); aşan not kesilir, tamamı panoya kopyalanır. */
export const WHATSAPP_URL_MAX = 3500

const BLOCKS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "TBODY",
  "THEAD",
  "TR",
  "BLOCKQUOTE",
  "PRE",
])
const DROP = new Set(["SCRIPT", "STYLE", "TEMPLATE", "HEAD", "TITLE", "META", "IMG", "SVG"])

/** İşareti kırpılmış içeriğe sarar; baş/son boşluk dışarıda kalır (WhatsApp yoksa çizmez). */
function wrap(mark: string, s: string): string {
  const core = s.trim()
  if (!core || core.includes(mark)) return s
  const lead = s.slice(0, s.length - s.trimStart().length)
  const trail = s.slice(s.trimEnd().length)
  return `${lead}${mark}${core}${mark}${trail}`
}

function styleMarks(el: Element): string[] {
  const style = (el.getAttribute("style") ?? "").toLowerCase()
  const marks: string[] = []
  if (/font-weight:\s*(bold|[6-9]00)/.test(style)) marks.push("*")
  if (/font-style:\s*italic/.test(style)) marks.push("_")
  if (/text-decoration[^;]*line-through/.test(style)) marks.push("~")
  return marks
}

function inline(node: Node): string {
  if (node.nodeType === 3) return (node.textContent ?? "").replace(/\s+/g, " ")
  if (node.nodeType !== 1) return ""
  const el = node as Element
  const tag = el.tagName
  if (DROP.has(tag)) return ""
  if (tag === "BR") return "\n"
  let out = [...el.childNodes].map(inline).join("")
  if (tag === "B" || tag === "STRONG") out = wrap("*", out)
  else if (tag === "I" || tag === "EM") out = wrap("_", out)
  else if (tag === "S" || tag === "DEL" || tag === "STRIKE") out = wrap("~", out)
  else if (tag === "SPAN") for (const m of styleMarks(el)) out = wrap(m, out)
  return out
}

function todo(el: Element): string {
  const tag = el.getAttribute("data-tag") ?? ""
  if (!tag.startsWith("to-do")) return ""
  return /completed|checked/.test(tag) ? "☑ " : "☐ "
}

const clean = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n")
    .trim()

const hasBlockChild = (el: Element) => [...el.children].some((c) => BLOCKS.has(c.tagName))

function list(el: Element, depth: number, out: string[]) {
  let n = 0
  for (const li of el.children) {
    if (li.tagName !== "LI") continue
    n++
    const own = [...li.childNodes].filter(
      (c) => !(c.nodeType === 1 && ["UL", "OL"].includes((c as Element).tagName)),
    )
    const text = clean(own.map(inline).join(""))
    const bullet = el.tagName === "OL" ? `${n}. ` : "• "
    if (text) out.push(`${"   ".repeat(depth)}${todo(li) ? todo(li) : bullet}${text}`)
    for (const sub of li.children) {
      if (sub.tagName === "UL" || sub.tagName === "OL") list(sub, depth + 1, out)
    }
  }
}

function blocks(root: Element, out: string[]) {
  let run = ""
  const flush = () => {
    const text = clean(run)
    if (text) out.push(text)
    run = ""
  }
  for (const node of root.childNodes) {
    const el = node.nodeType === 1 ? (node as Element) : null
    if (!el || !BLOCKS.has(el.tagName)) {
      run += inline(node)
      continue
    }
    flush()
    const tag = el.tagName
    if (/^H[1-6]$/.test(tag)) {
      const text = clean(el.textContent ?? "")
      if (text) out.push("", `*${text}*`)
    } else if (tag === "UL" || tag === "OL") list(el, 0, out)
    else if (tag === "TABLE" || tag === "TBODY" || tag === "THEAD") {
      for (const tr of el.querySelectorAll("tr")) {
        const cells = [...tr.children].map((c) => clean(c.textContent ?? "")).filter(Boolean)
        if (cells.length) out.push(cells.join(" | "))
      }
    } else if (hasBlockChild(el)) blocks(el, out)
    else {
      const text = clean(inline(el))
      if (text) out.push(`${todo(el)}${text}`)
    }
  }
  flush()
}

/** Notun WhatsApp metni: kalın başlık, eğik defter yolu, ardından biçimli gövde. */
export function whatsAppText({
  title,
  crumb,
  html,
}: {
  title: string
  crumb: string
  html: string
}): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const lines: string[] = []
  blocks(doc.body, lines)
  // Gövdenin ilk satırı çoğu kez başlığın kendisi: ikinci kez yazılmaz.
  const first = lines.findIndex((l) => l.trim())
  if (first >= 0 && lines[first].replace(/^\*|\*$/g, "").trim() === title.trim()) {
    lines.splice(first, 1)
  }
  const body = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  const head = [title.trim() && `*${title.trim()}*`, crumb.trim() && `_${crumb.trim()}_`]
  return [head.filter(Boolean).join("\n"), body].filter(Boolean).join("\n\n")
}

/** `wa.me` adresi; uzun metin satır sınırından kesilir (`cut`: kesildi mi). */
export function whatsAppUrl(text: string, max = WHATSAPP_URL_MAX): { url: string; cut: boolean } {
  let body = text
  const cut = text.length > max
  if (cut) {
    const slice = text.slice(0, max)
    const nl = slice.lastIndexOf("\n")
    body = `${(nl > max * 0.6 ? slice.slice(0, nl) : slice).trimEnd()}\n…`
  }
  return { url: `https://wa.me/?text=${encodeURIComponent(body)}`, cut }
}
