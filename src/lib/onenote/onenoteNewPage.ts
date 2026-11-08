/**
 * Yeni OneNote sayfası — saf parçalar (testli: `tests/unit/onenoteNewPage.test.ts`).
 *
 * Sayfa bir bölüme oluşturulur (`POST /me/onenote/sections/{id}/pages`, gövde XHTML). Başlık
 * `<title>`da gider: var olan sayfanın başlığını sonradan `replace` etmek bazı sayfalarda
 * reddediliyor, oluştururken vermek her zaman çalışır. Gövde düzenleyicinin "Not ekle" alanıyla
 * aynı biçimde bloklara ayrılır (`appendBlocksOf`: paragraf, başlık, liste, yapılacak, resim).
 */
import { fold } from "@/lib/fold"
import { appendBlocksOf } from "./onenoteEdit"
import type { OneNotePage } from "./onenotePages"

export interface OneNoteSection {
  id: string
  name: string
  notebookId: string
  notebook: string
}

/** Bölümler; kiracı `$expand`i reddederse defter adı olmadan bir sonraki sorgu. */
export const SECTION_QUERIES: readonly string[] = [
  "/me/onenote/sections?$top=200&$select=id,displayName" +
    "&$expand=parentNotebook($select=id,displayName)",
  "/me/onenote/sections?$top=200",
]

const clean = (s: unknown): string => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "")

interface RawSection {
  id?: string
  displayName?: string | null
  parentNotebook?: { id?: string | null; displayName?: string | null } | null
}

/** Graph bölümleri → seçicinin bölümleri; defter adına, sonra bölüm adına göre sıralı. */
export function mapSections(raw: unknown): OneNoteSection[] {
  if (!Array.isArray(raw)) return []
  const out: OneNoteSection[] = []
  for (const r of raw as RawSection[]) {
    if (!r?.id) continue
    out.push({
      id: r.id,
      name: clean(r.displayName),
      notebookId: r.parentNotebook?.id ?? "",
      notebook: clean(r.parentNotebook?.displayName),
    })
  }
  const by = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" })
  return out.sort((a, b) => by(a.notebook, b.notebook) || by(a.name, b.name))
}

/** Bölüm listesi gelmediyse son sayfalardan çıkarılan bölümler (en az bir seçenek kalsın). */
export function sectionsFromPages(pages: OneNotePage[]): OneNoteSection[] {
  const seen = new Map<string, OneNoteSection>()
  for (const p of pages) {
    if (!p.sectionId || seen.has(p.sectionId)) continue
    seen.set(p.sectionId, {
      id: p.sectionId,
      name: p.section,
      notebookId: p.notebookId ?? "",
      notebook: p.notebook,
    })
  }
  return mapSections(
    [...seen.values()].map((s) => ({
      id: s.id,
      displayName: s.name,
      parentNotebook: { id: s.notebookId, displayName: s.notebook },
    })),
  )
}

/**
 * Açılışta seçili bölüm: listede o an süzülen bölüm (adıyla), yoksa en son düzenlenen sayfanın
 * bölümü, o da yoksa ilk bölüm.
 */
export function defaultSection(
  sections: OneNoteSection[],
  pages: OneNotePage[],
  focus?: { notebook?: string; section?: string } | null,
): string {
  const low = (s?: string) => fold(s ?? "")
  if (focus?.section) {
    const hit = sections.find(
      (s) =>
        low(s.name) === low(focus.section) &&
        (!focus.notebook || low(s.notebook) === low(focus.notebook)),
    )
    if (hit) return hit.id
  }
  const recent = pages.find((p) => p.sectionId && sections.some((s) => s.id === p.sectionId))
  if (recent?.sectionId) return recent.sectionId
  return sections[0]?.id ?? ""
}

const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Oluşturma isteğinin gövdesi (XHTML): başlık, oluşturma zamanı ve bloklar. */
export function newPageHtml(title: string, bodyHtml: string, now: Date): string {
  const t = escapeText(title.replace(/\s+/g, " ").trim())
  const blocks = appendBlocksOf(bodyHtml).map((b) => b.replace(/<br>/g, "<br />"))
  return (
    `<!DOCTYPE html><html><head><title>${t}</title>` +
    `<meta name="created" content="${now.toISOString()}" /></head>` +
    `<body>${blocks.join("")}</body></html>`
  )
}
