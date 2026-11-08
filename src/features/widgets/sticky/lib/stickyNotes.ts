/**
 * Yapışkan notlar — saf parçalar (testli: `tests/unit/stickyNotes.test.ts`).
 *
 * Her not kişinin OneNote'unda "TYRO Notlar" bölümünde bir SAYFA: OneNote'ta ve telefonda da
 * görünür, aranır. Sayfanın başlığı notun ilk satırı (OneNote listesinde okunur kalsın), gövdesi
 * `data-id="tyro-sticky"` taşıyan TEK div: düzenleme o div'i bütünüyle değiştirir
 * (`PATCH … target: #tyro-sticky, action: replace`) — satır satır fark hesabı yok.
 * Renk OneNote'ta saklanacak yer bulmaz: kimlikten türeyen varsayılan (her cihazda aynı) +
 * kişinin seçtiği, tarayıcıda (`tyro-widgets-sticky-v1`).
 */

export const STICKY_SECTION = "TYRO Notlar"
export const STICKY_DATA_ID = "tyro-sticky"
/** Başlığa giden ilk satırın üst sınırı (OneNote listesinde tek satır). */
export const TITLE_MAX = 60
/** Notun üst sınırı (karakter): yapışkan not kısa; uzun yazı OneNote sayfasıdır. */
export const NOTE_MAX = 2000

export const STICKY_COLORS = ["sun", "mint", "sky", "rose", "lilac"] as const
export type StickyColor = (typeof STICKY_COLORS)[number]

export interface StickyNote {
  id: string
  text: string
  color: StickyColor
  modified: string
  webUrl?: string | null
  /** Henüz OneNote'a yazılmadı (iyimser ekleme). */
  pending?: boolean
}

const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Satır sonları korunur, baş/son boşluk ve 2'den fazla boş satır atılır, sınırda kesilir. */
export function cleanNote(text: string): string {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, NOTE_MAX)
}

/** Sayfa başlığı: ilk dolu satır, sınırda "…" ile. */
export function noteTitle(text: string): string {
  const first =
    cleanNote(text)
      .split("\n")
      .find((l) => l.trim()) ?? ""
  const one = first.replace(/\s+/g, " ").trim()
  return one.length > TITLE_MAX ? `${one.slice(0, TITLE_MAX - 1).trimEnd()}…` : one
}

/** Notun gövdesi: satır başına bir paragraf (boş satır boş paragraf), tek div içinde. */
export function noteBody(text: string): string {
  const lines = cleanNote(text).split("\n")
  const ps = lines.map((l) => `<p>${l ? escapeText(l) : "&nbsp;"}</p>`).join("")
  return `<div data-id="${STICKY_DATA_ID}">${ps}</div>`
}

/** Oluşturma isteğinin gövdesi (XHTML). */
export function newNoteHtml(text: string, now: Date): string {
  return (
    `<!DOCTYPE html><html><head><title>${escapeText(noteTitle(text))}</title>` +
    `<meta name="created" content="${now.toISOString()}" /></head>` +
    `<body>${noteBody(text)}</body></html>`
  )
}

/** Düzenleme komutları: gövdeyi bütünüyle değiştir, başlığı ilk satıra çek. */
export function updateCommands(text: string): {
  target: string
  action: "replace"
  content: string
}[] {
  return [
    { target: `#${STICKY_DATA_ID}`, action: "replace", content: noteBody(text) },
    { target: "title", action: "replace", content: noteTitle(text) },
  ]
}

/** Kimlikten kararlı varsayılan renk: aynı not her cihazda aynı renkte. */
export function defaultColor(id: string): StickyColor {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return STICKY_COLORS[Math.abs(h) % STICKY_COLORS.length]
}

export function colorOf(
  id: string,
  picked: Record<string, string> | null | undefined,
): StickyColor {
  const c = picked?.[id]
  return (STICKY_COLORS as readonly string[]).includes(c ?? "")
    ? (c as StickyColor)
    : defaultColor(id)
}

/** OneNote içeriğinin düz metni (okuyucunun düzleştirilmiş HTML'inden): satırlar korunur. */
export function noteText(html: string): string {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  const root = doc.querySelector(`[data-id="${STICKY_DATA_ID}"]`) ?? doc.body
  const blocks = root.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6")
  const lines = blocks.length
    ? [...blocks].map((b) => (b.textContent ?? "").replace(/\u00a0/g, " ").trimEnd())
    : (root.textContent ?? "").split("\n")
  return cleanNote(lines.join("\n"))
}

/** En yeni önce; aynı anda değişenlerde kimliğe göre (sıra titremesin). */
export function sortNotes(notes: StickyNote[]): StickyNote[] {
  return [...notes].sort((a, b) => b.modified.localeCompare(a.modified) || a.id.localeCompare(b.id))
}

/** Teams'e giden metnin üst sınırı (adres uzunluğu). */
export const TEAMS_TEXT_MAX = 1500

/**
 * Teams'in "Teams'te paylaş" penceresi: not metni hazır, kişi/kanal Teams'te seçilir. Teams bir
 * bağlantı ister (`href`): notun OneNote sayfası; yoksa (henüz yazılmamış not) `null`.
 */
export function teamsShareUrl(text: string, webUrl?: string | null): string | null {
  if (!webUrl) return null
  const body = cleanNote(text)
  const msg =
    body.length > TEAMS_TEXT_MAX ? `${body.slice(0, TEAMS_TEXT_MAX - 1).trimEnd()}…` : body
  const q = new URLSearchParams({ href: webUrl, msgText: msg, preview: "false" })
  return `https://teams.microsoft.com/share?${q.toString().replace(/\+/g, "%20")}`
}
