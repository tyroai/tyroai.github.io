import { describeFormat, formatValue } from "@/features/feed/lib/xlsxFormat"
import { child, children, decodeEntities, descendants, parseXml } from "@/features/feed/lib/xmlTree"

/**
 * Excel ekinin HIZLI ÖNİZLEMESİ (saf; `features/feed/lib/zipRead` ile açılmış dosyadan): görünür sayfaların ilk
 * satırları, hücreler Excel'deki gibi biçimli (`features/feed/lib/xlsxFormat`: ayraçlı sayı, yüzde, tarih).
 * Formüllerin SON hesaplanmış değeri gösterilir; biçim, renk, birleşik hücre, grafik ve resim
 * atlanır. Büyük sayfa için satırlar düzenli ifadeyle tek tek taranır, ilk `rows` satırdan sonra
 * durulur (ağaç kurulmaz): 25 MB'lık bir sayfa açılırken tarayıcıyı kilitlemez.
 */
export const SHEET_LIMITS = { rows: 200, cols: 40, sheets: 12, strings: 300000 }

/** "AB12" → sütun sırası (0'dan; A = 0). */
export function columnIndex(ref) {
  let n = 0
  for (const ch of /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? "") n = n * 26 + ch.charCodeAt(0) - 64
  return n - 1
}

/** `<t>` parçalarının birleşimi (ses bilgisi `rPh` atlanır). */
function runsText(xml) {
  let out = ""
  for (const m of xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
    out += decodeEntities(m[1])
  return out
}

/** `sharedStrings.xml` → metinler dizisi (en çok `SHEET_LIMITS.strings`). */
export function sharedStrings(xml) {
  const out = []
  if (!xml) return out
  for (const m of xml.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) {
    out.push(runsText(m[1] ?? ""))
    if (out.length >= SHEET_LIMITS.strings) break
  }
  return out
}

/** `styles.xml` → hücre stili sırasıyla biçim açıklamaları (`describeFormat`). */
export function styleFormats(stylesXml) {
  if (!stylesXml) return []
  const root = parseXml(stylesXml)
  const custom = new Map(
    descendants(root, "numFmt").map((n) => [Number(n.attrs.numFmtId), n.attrs.formatCode]),
  )
  const xfs = child(root, "cellXfs")
  return xfs
    ? children(xfs, "xf").map((xf) => {
        const id = Number(xf.attrs.numFmtId ?? 0)
        return describeFormat(id, custom.get(id))
      })
    : []
}

/**
 * Bir sayfanın XML'i → `{ rows: [{ r, cells }], cols, cut }`; `cells[i]`: `{ v, n }` (`n`: sayı —
 * sağa yaslanır) ya da boş. Boş satırlar atlanır; satır numarası `r` korunur.
 */
export function sheetRows(xml, { strings, formats, date1904, locale }) {
  const rows = []
  let cols = 0
  const cut = { rows: false, cols: false }
  const sheet = xml.slice(Math.max(0, xml.indexOf("<sheetData")))
  for (const row of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const cells = []
    for (const c of (row[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1]
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1]
      const col = ref ? columnIndex(ref) : cells.length
      if (col >= SHEET_LIMITS.cols) {
        cut.cols = true
        continue
      }
      const type = /\bt="(\w+)"/.exec(attrs)?.[1] ?? "n"
      const style = Number(/\bs="(\d+)"/.exec(attrs)?.[1] ?? 0)
      const body = c[2] ?? ""
      const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1]
      let cell = null
      if (type === "s" && raw != null) cell = { v: strings[Number(raw)] ?? "", n: false }
      else if (type === "inlineStr") cell = { v: runsText(body), n: false }
      else if (type === "b" && raw != null) cell = { v: raw === "1" ? "TRUE" : "FALSE", n: false }
      else if ((type === "str" || type === "e" || type === "d") && raw != null)
        cell = { v: decodeEntities(raw), n: false }
      else if (raw != null && raw !== "") {
        const desc = formats[style] ?? { kind: "general" }
        cell = { v: formatValue(raw, desc, { locale, date1904 }), n: desc.kind !== "text" }
      }
      if (cell && cell.v !== "") {
        cells[col] = cell
        cols = Math.max(cols, col + 1)
      }
    }
    if (!cells.some(Boolean)) continue
    if (rows.length >= SHEET_LIMITS.rows) {
      cut.rows = true
      break
    }
    rows.push({ r: Number(/\br="(\d+)"/.exec(row[1])?.[1] ?? rows.length + 1), cells })
  }
  return { rows, cols, cut }
}

const sheetPath = (target) => (target.startsWith("/") ? target.slice(1) : `xl/${target}`)

/**
 * Açılmış xlsx (`openZip` çıktısı) → `{ sheets: [{ name, rows, cols, cut }], hiddenCount }`:
 * görünür sayfalar, en çok `SHEET_LIMITS.sheets`.
 */
export async function readWorkbook(zip, locale = "tr") {
  const workbook = parseXml((await zip.text("xl/workbook.xml")) ?? "")
  const rels = new Map(
    descendants(parseXml((await zip.text("xl/_rels/workbook.xml.rels")) ?? ""), "Relationship").map(
      (r) => [r.attrs.Id, r.attrs.Target],
    ),
  )
  const options = {
    strings: sharedStrings(await zip.text("xl/sharedStrings.xml")),
    formats: styleFormats(await zip.text("xl/styles.xml")),
    date1904: descendants(workbook, "workbookPr")[0]?.attrs.date1904 === "1",
    locale,
  }
  const all = descendants(workbook, "sheet")
  const visible = all.filter((s) => !/^(hidden|veryHidden)$/.test(s.attrs.state ?? ""))
  const sheets = []
  for (const s of visible.slice(0, SHEET_LIMITS.sheets)) {
    const target = rels.get(s.attrs["r:id"])
    const xml = target ? await zip.text(sheetPath(target)) : null
    sheets.push({
      name: s.attrs.name ?? "",
      ...(xml ? sheetRows(xml, options) : { rows: [], cols: 0, cut: {} }),
    })
  }
  return { sheets, hiddenCount: all.length - visible.length }
}
