/**
 * OneNote sayfaları — Graph'ın `onenotePage` cevabından kartın görünüm modeline, defter filtresi.
 * Saf: testli (`tests/unit/onenotePages.test.ts`).
 */

/** Graph'tan gelen sayfa (yalnız okunan alanlar; hepsi isteğe bağlı — sorgu düşebilir). */
export interface RawOneNotePage {
  id?: string
  title?: string | null
  lastModifiedDateTime?: string | null
  createdDateTime?: string | null
  links?: { oneNoteWebUrl?: { href?: string | null } | null } | null
  parentSection?: { id?: string | null; displayName?: string | null } | null
  parentNotebook?: { id?: string | null; displayName?: string | null } | null
}

/** Kartın sayfası. `notebookId` yoksa (sorgu `$expand`sız döndü) filtre yok. */
export interface OneNotePage {
  id: string
  title: string
  edited: Date | null
  webUrl: string | null
  notebookId: string | null
  notebook: string
  sectionId: string | null
  section: string
}

export interface OneNoteNotebook {
  id: string
  name: string
  count: number
}

/** Listenin sayfası: OneNote en çok 100 verir; filtre bu pencerede çalışır. */
export const PAGE_TOP = 100

const ORDER = "$orderby=lastModifiedDateTime%20desc"

/**
 * Sayfa listesi sorguları, önce en zengini. Kiracı bir sorgu seçeneğini reddederse (400)
 * sıradakine düşülür: `$expand` yoksa defter ve bölüm adı gelmez, liste yine çizilir.
 */
export const PAGE_QUERIES: readonly string[] = [
  `/me/onenote/pages?$top=${PAGE_TOP}&${ORDER}` +
    "&$select=id,title,lastModifiedDateTime,links" +
    "&$expand=parentSection($select=id,displayName),parentNotebook($select=id,displayName)",
  `/me/onenote/pages?$top=${PAGE_TOP}&${ORDER}&$expand=parentSection,parentNotebook`,
  `/me/onenote/pages?$top=${PAGE_TOP}&${ORDER}`,
]

/**
 * Hesap genelindeki sayfa listesi hesabı aşınca (çok bölüm, çok öğe, zaman aşımı) parça parça okunur
 * (`onenoteRecent`): bölümler en son düzenlenene göre, her bölümün sayfaları `CHUNK`'lık istekle; liste
 * aşağı kaydırıldıkça sürer. Microsoft çok bölümlü hesaplar için sayfaları bölüm bölüm okumayı önerir.
 */
export const CHUNK = 10
/** Parça parça okumada ele alınan en son düzenlenen bölüm sayısı (daha eski bölümün sayfaları listeye girmez). */
export const MAX_SECTIONS = 30
/** Bölüm listesi sorguları, önce en zengini; kiracı bir seçeneği reddederse (400) sadesi. */
export const SECTION_LIST_QUERIES: readonly string[] = [
  `/me/onenote/sections?$top=${MAX_SECTIONS}&${ORDER}` +
    "&$select=id,displayName,lastModifiedDateTime&$expand=parentNotebook($select=id,displayName)",
  `/me/onenote/sections?$top=${MAX_SECTIONS}&${ORDER}`,
  `/me/onenote/sections?$top=${MAX_SECTIONS}`,
]

/**
 * Bölüm listesi de hesabı aşarsa (çok bölüm) bölümler DEFTER ÜZERİNDEN bulunur: en son düzenlenen
 * defterler, sonra her defterin bölümleri (tek defterlik, küçük istek). Bölüm gruplarının içindekiler
 * bu yolda gelmez.
 */
export const RECENT_NOTEBOOKS = 4
export const NOTEBOOK_QUERIES: readonly string[] = [
  `/me/onenote/notebooks?$top=10&${ORDER}&$select=id,displayName,lastModifiedDateTime`,
  "/me/onenote/notebooks?$top=10",
]
export const notebookSectionsQuery = (notebookId: string): string =>
  `/me/onenote/notebooks/${encodeURIComponent(notebookId)}/sections?$select=id,displayName,lastModifiedDateTime`

/** Bir bölümün ilk sayfa parçası (hesap genelinden ayrı, tek bölümlük istek); sonrası `nextLink` ya da `$skip`. */
export const sectionPagesQuery = (sectionId: string): string =>
  `/me/onenote/sections/${encodeURIComponent(sectionId)}/pages?$top=${CHUNK}&${ORDER}` +
  "&$select=id,title,lastModifiedDateTime,createdDateTime,links"

/** Graph'tan gelen bölüm (yalnız okunan alanlar). */
export interface RawOneNoteSection {
  id?: string
  displayName?: string | null
  lastModifiedDateTime?: string | null
  parentNotebook?: { id?: string | null; displayName?: string | null } | null
}

/** En son düzenlenen `count` bölüm; kimliksiz kayıt düşer, tarihsiz bölüm sona gider. */
export function recentSections(raw: unknown, count: number): RawOneNoteSection[] {
  const list = Array.isArray(raw) ? (raw as RawOneNoteSection[]) : []
  const stamp = (s: RawOneNoteSection) => Date.parse(s.lastModifiedDateTime ?? "") || 0
  return list
    .filter((s) => s && typeof s.id === "string" && s.id)
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, count)
}

/** Bölümün sayfalarına defter ve bölüm adını ekler (tek bölümlük sorguda `$expand` yok). */
export function withParents(raw: unknown, section: RawOneNoteSection): RawOneNotePage[] {
  const list = Array.isArray(raw) ? (raw as RawOneNotePage[]) : []
  return list.map((p) => ({
    ...p,
    parentSection: { id: section.id, displayName: section.displayName },
    parentNotebook: section.parentNotebook ?? null,
  }))
}

/** Yalnız Microsoft'un OneNote adresleri bağlantı olur (veriden gelen adres süzülür). */
export function safeWebUrl(href: unknown): string | null {
  if (typeof href !== "string") return null
  try {
    const u = new URL(href)
    if (u.protocol !== "https:") return null
    const host = u.hostname.toLowerCase()
    const ok =
      host.endsWith(".sharepoint.com") ||
      host.endsWith(".onenote.com") ||
      host === "onenote.com" ||
      host.endsWith(".live.com") ||
      host.endsWith(".office.com")
    return ok ? u.href : null
  } catch {
    return null
  }
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const clean = (s: unknown): string => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "")

/** Graph sayfası → kart sayfası; kimliksiz kayıt düşer. Sıra en yeni düzenlenen önce. */
export function mapPages(raw: unknown): OneNotePage[] {
  const list = Array.isArray(raw) ? (raw as RawOneNotePage[]) : []
  const out: OneNotePage[] = []
  for (const p of list) {
    if (!p || typeof p.id !== "string" || !p.id) continue
    const edited = toDate(p.lastModifiedDateTime) ?? toDate(p.createdDateTime)
    out.push({
      id: p.id,
      title: clean(p.title),
      edited,
      webUrl: safeWebUrl(p.links?.oneNoteWebUrl?.href),
      notebookId: clean(p.parentNotebook?.id) || null,
      notebook: clean(p.parentNotebook?.displayName),
      sectionId: clean(p.parentSection?.id) || null,
      section: clean(p.parentSection?.displayName),
    })
  }
  return out.sort((a, b) => (b.edited?.getTime() ?? 0) - (a.edited?.getTime() ?? 0))
}

/**
 * Filtrenin defterleri: listedeki sayfaların defterleri, en son düzenleneni önce (ayrı istek
 * yok — yakın zamanda dokunulmamış defter filtrede boş bir seçenek olurdu).
 */
export function notebooksOf(pages: readonly OneNotePage[]): OneNoteNotebook[] {
  const byId = new Map<string, OneNoteNotebook>()
  for (const p of pages) {
    if (!p.notebookId) continue
    const hit = byId.get(p.notebookId)
    if (hit) hit.count += 1
    else byId.set(p.notebookId, { id: p.notebookId, name: p.notebook, count: 1 })
  }
  return [...byId.values()]
}

/** Seçili defterin sayfaları; seçim yoksa ya da defter artık listede yoksa hepsi. */
export function filterPages(pages: readonly OneNotePage[], notebookId: string | null) {
  if (!notebookId || !pages.some((p) => p.notebookId === notebookId)) return [...pages]
  return pages.filter((p) => p.notebookId === notebookId)
}

/** "Defter › Bölüm" — ikisi de yoksa boş. */
export function crumbOf(p: Pick<OneNotePage, "notebook" | "section">): string {
  return [p.notebook, p.section].filter(Boolean).join(" › ")
}
