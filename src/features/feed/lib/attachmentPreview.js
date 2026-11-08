/**
 * E-posta ekinin uygulama içi önizlemesi (saf). Ek, Graph'tan `$value` ile bayt olarak gelir;
 * sunucu tarafı önizleme (Office Online) yalnız OneDrive/SharePoint dosyası için var, posta eki
 * için yok. Bu yüzden tarayıcıda çizilebilen türler: resim, PDF, düz yazı ve HTML (kilitli
 * çerçevede); Word, Excel ve PowerPoint dosyaları hızlı önizlemeyle (`office`: yazı ve tablo).
 */

const IMAGE = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
}
const TEXT = new Set([
  "txt",
  "csv",
  "tsv",
  "json",
  "xml",
  "md",
  "log",
  "ini",
  "yaml",
  "yml",
  "sql",
  "ics",
  "vcf",
  "eml",
])
const HTML = new Set(["html", "htm"])
const OFFICE = new Set(["docx", "xlsx", "pptx"])

const MB = 1024 * 1024
/** Türe göre denenecek en büyük ek (bayt): daha büyüğü indirilmeden "çok büyük" der. */
export const PREVIEW_LIMIT = {
  image: 25 * MB,
  pdf: 25 * MB,
  text: 8 * MB,
  html: 5 * MB,
  office: 15 * MB,
}
/** Düz yazıdan okunan en çok bayt; fazlası kesilir ("ilk bölümü gösteriliyor"). */
export const TEXT_READ = 1_000_000

/** Ekin önizleme türü: "image" | "pdf" | "text" | "html" | "office" | null (önizlenemez). */
export function previewKind({ ext = "", contentType = "" } = {}) {
  const e = String(ext).toLowerCase()
  if (IMAGE[e]) return "image"
  if (e === "pdf") return "pdf"
  if (HTML.has(e)) return "html"
  if (TEXT.has(e)) return "text"
  if (OFFICE.has(e)) return "office"
  const type = String(contentType).toLowerCase()
  if (e) return null
  if (/^image\/(png|jpe?g|gif|webp|bmp)$/.test(type)) return "image"
  if (type === "application/pdf") return "pdf"
  if (type === "text/html") return "html"
  if (type.startsWith("text/")) return "text"
  return null
}

/** Önizleme durumu: `{ kind, tooLarge }` — boyu bilinmiyorsa denenir. */
export function previewPlan(att) {
  const kind = previewKind(att)
  const tooLarge = Boolean(kind && att?.size != null && att.size > PREVIEW_LIMIT[kind])
  return { kind, tooLarge }
}

/** Nesne adresinin türü: Graph çoğu kez `octet-stream` döner, gömülü görüntüleyici türü ister. */
export function blobType(att, kind) {
  if (kind === "pdf") return "application/pdf"
  if (kind === "image") return IMAGE[String(att?.ext ?? "").toLowerCase()] ?? att?.contentType ?? ""
  return ""
}
