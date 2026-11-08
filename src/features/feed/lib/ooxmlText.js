import { child, children, descendants, parseXml, textOf } from "@/features/feed/lib/xmlTree"

/**
 * Word ve PowerPoint ekinin HIZLI ÖNİZLEMESİ (saf; `features/feed/lib/zipRead` ile açılmış dosyadan): yalnız
 * yazı ve tablo — başlıklar, paragraflar, liste maddeleri, tablolar; PowerPoint'te slaytların
 * başlığı ve yazıları. Biçim, resim, grafik ve yorumlar atlanır; arayüz bunu söyler. Office
 * Online posta eki için yok; tarayıcıda çizilebilen en yakını bu.
 */
export const OFFICE_LIMITS = { blocks: 600, chars: 60000, slides: 80 }

// ── Word ────────────────────────────────────────────────────────────────────────────────────

/** Bir paragrafın (`w:p`) düz yazısı: metin parçaları, sekme ve satır sonu. */
function wordText(node) {
  let out = ""
  const walk = (n) => {
    for (const k of n.kids) {
      if (typeof k === "string") continue
      // Silinmiş izli değişiklik, alan kodu ve ikinci (yedek) çizim yazıya girmez.
      if (k.name === "Fallback" || k.name === "delText" || k.name === "instrText") continue
      if (k.name === "t") out += textOf(k)
      else if (k.name === "tab") out += "\t"
      else if (k.name === "br" || k.name === "cr") out += "\n"
      else if (k.name === "noBreakHyphen") out += "-"
      else walk(k)
    }
  }
  walk(node)
  return out
}

/** `styles.xml`: stil kimliği → başlık düzeyi ("heading 2" → 2, "Title" → 1). */
export function headingLevels(stylesXml) {
  const levels = new Map()
  if (!stylesXml) return levels
  for (const style of descendants(parseXml(stylesXml), "style")) {
    const name = child(style, "name")?.attrs.val ?? ""
    const level = /^heading (\d)$/i.exec(name)?.[1]
    if (level) levels.set(style.attrs.styleId, Number(level))
    else if (/^title$/i.test(name)) levels.set(style.attrs.styleId, 1)
  }
  return levels
}

function tableRows(table) {
  return children(table, "tr").map((tr) =>
    children(tr, "tc").map((tc) =>
      children(tc, "p")
        .map(wordText)
        .filter((s) => s.trim())
        .join("\n"),
    ),
  )
}

function wordBlocks(body, levels, out) {
  for (const k of children(body)) {
    if (k.name === "p") {
      const text = wordText(k)
      if (!text.trim()) continue
      const pr = child(k, "pPr")
      const level = levels.get(child(pr ?? { kids: [] }, "pStyle")?.attrs.val)
      if (level) out.push({ type: "h", level, text })
      else if (pr && child(pr, "numPr")) out.push({ type: "li", text })
      else out.push({ type: "p", text })
    } else if (k.name === "tbl") out.push({ type: "table", rows: tableRows(k) })
    else if (k.name === "sdt") {
      const content = child(k, "sdtContent")
      if (content) wordBlocks(content, levels, out)
    }
  }
}

/** Word belgesi: `{ blocks, cut }` — blok: `h` (başlık, `level`), `p`, `li`, `table` (`rows`). */
export function docxBlocks(documentXml, stylesXml) {
  const body = child(parseXml(documentXml), "body")
  const all = []
  if (body) wordBlocks(body, headingLevels(stylesXml), all)
  const blocks = []
  let chars = 0
  for (const b of all) {
    const size = b.type === "table" ? b.rows.flat().join("").length : b.text.length
    if (blocks.length >= OFFICE_LIMITS.blocks || chars + size > OFFICE_LIMITS.chars)
      return { blocks, cut: true }
    blocks.push(b)
    chars += size
  }
  return { blocks, cut: false }
}

// ── PowerPoint ──────────────────────────────────────────────────────────────────────────────

const paragraphs = (node) =>
  descendants(node, "p")
    .map((p) => {
      let out = ""
      const walk = (n) => {
        for (const k of n.kids) {
          if (typeof k === "string") continue
          if (k.name === "t") out += textOf(k)
          else if (k.name === "br") out += "\n"
          else walk(k)
        }
      }
      walk(p)
      return out.trim()
    })
    .filter(Boolean)

/** Bir slayt: `{ title, lines }` (başlık yer tutucusu `title`, kalan yazılar ve tablo hücreleri `lines`). */
export function slideText(slideXml) {
  const root = parseXml(slideXml)
  let title = ""
  const lines = []
  for (const sp of descendants(root, "sp")) {
    const ph = descendants(sp, "ph")[0]
    const text = paragraphs(sp)
    if (!text.length) continue
    if (!title && ph && /^(title|ctrTitle)$/.test(ph.attrs.type ?? "")) title = text.join(" ")
    else lines.push(...text)
  }
  for (const tr of descendants(root, "tr")) {
    const cells = children(tr, "tc")
      .map((tc) => paragraphs(tc).join(" "))
      .filter(Boolean)
    if (cells.length) lines.push(cells.join("\t"))
  }
  return { title, lines }
}

/** `presentation.xml` + ilişkileri: slayt dosyalarının SIRASI ("ppt/slides/slide2.xml", …). */
export function slideOrder(presentationXml, relsXml, names) {
  const byId = new Map()
  for (const rel of descendants(parseXml(relsXml ?? ""), "Relationship"))
    byId.set(rel.attrs.Id, rel.attrs.Target)
  const ordered = descendants(parseXml(presentationXml ?? ""), "sldId")
    .map((s) => byId.get(s.attrs["r:id"]))
    .filter(Boolean)
    .map((target) => (target.startsWith("/") ? target.slice(1) : `ppt/${target}`))
    .filter((name) => names.includes(name))
  if (ordered.length) return ordered
  const num = (n) => Number(/slide(\d+)\.xml$/.exec(n)?.[1] ?? 0)
  return names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b))
}
