/**
 * OneNote sayfa içeriğini (`/pages/{id}/content`, HTML) okuyucunun kilitli çerçevesine
 * hazırlar. Saf: testli (`tests/unit/onenoteHtml.test.ts`).
 *
 * - OneNote her not kutusunu mutlak konumla (`position:absolute; left; top`) yazar: dar
 *   okuyucuda kutular üst üste biner. Konum sökülür, kutular akışa girer (OneNote'un mobil
 *   görünümü de böyle okur).
 * - Ek dosya (`<object>`), gömülü video (`<iframe>`) ve betik çerçevede çalışmaz: atılır.
 * - OneNote her satıra yazı tipini (Calibri 11pt), siyah rengi ve sıfır paragraf payını satır içi
 *   yazar: okuyucunun kendi yazı düzeni (`onenoteFrame`) ve koyu tema bunlarla ezilirdi. Bunlar
 *   sökülür; kullanıcının bilinçli seçimi (renkli yazı, vurgu, büyük punto, kod yazısı) kalır.
 * - Görseller: `onenoteImages`.
 */

/** `<body>` içi; gövde yoksa belgenin kendisi. `<head>` (başlık, meta) düşer. */
function bodyOf(html: string): string {
  const open = /<body\b[^>]*>/i.exec(html)
  if (!open) return html.replace(/<head\b[\s\S]*?<\/head>/i, "")
  const rest = html.slice(open.index + open[0].length)
  const close = rest.search(/<\/body>/i)
  return close >= 0 ? rest.slice(0, close) : rest
}

const POSITION = /^(position|left|top|right|bottom|z-index)$/
const LAYOUT = /^(margin(-[a-z]+)?|line-height|font-family|font-size)$/
const MONO = /consolas|courier|mono|menlo/i
const GREY_NAMES =
  /^(black|white|gr[ae]y|silver|dimgr[ae]y|darkgr[ae]y|lightgr[ae]y|gainsboro|whitesmoke|windowtext|window|automatic)$/i

/** Gri tonlu renk mi (siyah, beyaz, gri): temanın mürekkebine bırakılır. */
export function isNeutralColor(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (GREY_NAMES.test(v)) return true
  let rgb: number[] | null = null
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1]
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(v)
  if (fn) rgb = [fn[1], fn[2], fn[3]].map(Number)
  return rgb ? Math.max(...rgb) - Math.min(...rgb) <= 16 : false
}

/** Punto ya da piksel; gövde boyunda mı (≤ 12pt / 16px — OneNote'un varsayılanı 11pt). */
const bodySize = (value: string) => {
  const m = /^([\d.]+)\s*(pt|px)$/i.exec(value.trim())
  if (!m) return false
  const n = Number(m[1])
  return m[2].toLowerCase() === "pt" ? n <= 12 : n <= 16
}

/** Satır içi stili okuyucuya uydurur (bkz. dosya başı); geri kalan stil korunur. */
function tidyStyle(tag: string, style: string): string {
  const heading = /^h[1-6]$/.test(tag)
  const tabular = /^(table|tr|td|th|thead|tbody)$/.test(tag)
  return style
    .split(";")
    .flatMap((decl) => {
      const at = decl.indexOf(":")
      if (at < 0) return []
      const prop = decl.slice(0, at).trim().toLowerCase()
      const value = decl.slice(at + 1).trim()
      if (POSITION.test(prop)) return []
      if (prop === "font-family")
        return MONO.test(value)
          ? ["font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"]
          : []
      if (prop === "font-size") return heading || bodySize(value) ? [] : [decl.trim()]
      if (LAYOUT.test(prop)) return []
      if (prop === "color" && (heading || isNeutralColor(value))) return []
      if (/^background(-color)?$/.test(prop) && isNeutralColor(value)) return []
      if (tabular && /^border/.test(prop)) return []
      // Not kutusunun OneNote'taki eni: akışta okuma enini daraltır ("görüş." tek başına alt satıra).
      if (tag === "div" && /^(width|height|min-width|min-height)$/.test(prop)) return []
      return [decl.trim()]
    })
    .join(";")
}

/** OneNote HTML'i → çerçeveye konacak gövde (konumsuz, eksiz, betiksiz). */
export function flattenOneNoteHtml(html: unknown): string {
  if (typeof html !== "string" || !html) return ""
  return (
    bodyOf(html)
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      // Önce kendinden kapanan: tek bir `<object …/>` sonraki bir `</object>`a kadar içeriği yutmasın.
      .replace(/<(object|iframe|embed)\b[^>]*\/>/gi, "")
      .replace(/<(object|iframe|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/?(object|iframe|embed)\b[^>]*>/gi, "")
      .replace(
        /<([a-z][a-z0-9]*)\b([^>]*?)\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
        (_m, tag: string, before: string, dq?: string, sq?: string) => {
          const style = tidyStyle(tag.toLowerCase(), dq ?? sq ?? "")
          return style ? `<${tag}${before} style="${style.replace(/"/g, "'")}"` : `<${tag}${before}`
        },
      )
      .replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  )
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

/**
 * Kartın ön izlemesi: gövdenin düz metni, boşluklar tekleşmiş, `max` karakterde kesik. Bloklar
 * (başlık, paragraf, madde) " · " ile ayrılır: "Gündem Fiyat…" gibi bitişik okunmasın. `sep`:
 * blok ayracı — TYRO'ya giden metinde satır sonu (`onenoteAsk`).
 */
export function textExcerpt(html: unknown, max = 220, sep = " · "): string {
  if (typeof html !== "string" || !html) return ""
  const text = bodyOf(html)
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>|<br\s*\/?>/gi, "\u0001")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""
    })
    .split("\u0001")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(sep)
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}
