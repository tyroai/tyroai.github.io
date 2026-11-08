import { fold } from "@/lib/fold"
import type { OneNotePage } from "./onenotePages"

/**
 * Bul › OneNote'un gruplaması — OneNote'un kendi düzeni: defter › bölüm › sayfa. Defterler ve
 * bölümler en son düzenlenen önce, bölümün sayfaları en yeni önce. Saf: testli
 * (`tests/unit/onenoteGroups.test.ts`).
 */

type GroupablePage = Pick<OneNotePage, "id" | "edited" | "notebookId" | "notebook" | "section"> & {
  sectionId?: string | null
}

export interface OneNoteSectionGroup<T extends GroupablePage = OneNotePage> {
  key: string
  name: string
  latest: Date | null
  pages: T[]
}

export interface OneNoteNotebookGroup<T extends GroupablePage = OneNotePage> {
  key: string
  name: string
  latest: Date | null
  count: number
  sections: OneNoteSectionGroup<T>[]
}

const time = (d: Date | null) => d?.getTime() ?? 0
const newer = (a: { latest: Date | null }, b: { latest: Date | null }) =>
  time(b.latest) - time(a.latest)
const later = (a: Date | null, b: Date | null) => (time(b) > time(a) ? b : a)

// Kimlik varsa o (aynı adlı iki bölüm ayrı kalır); `$expand`sız cevapta ad.
const notebookKey = (p: GroupablePage) => p.notebookId || `n:${fold(p.notebook)}`
const sectionKey = (p: GroupablePage, nb: string) => p.sectionId || `${nb}|s:${fold(p.section)}`

export function groupBySection<T extends GroupablePage>(
  pages: readonly T[],
): OneNoteNotebookGroup<T>[] {
  const notebooks = new Map<string, OneNoteNotebookGroup<T>>()
  const sections = new Map<string, OneNoteSectionGroup<T>>()
  for (const p of pages) {
    const nk = notebookKey(p)
    let nb = notebooks.get(nk)
    if (!nb) {
      nb = { key: nk, name: p.notebook, latest: null, count: 0, sections: [] }
      notebooks.set(nk, nb)
    }
    nb.count += 1
    nb.latest = later(nb.latest, p.edited)
    const sk = sectionKey(p, nk)
    let sec = sections.get(sk)
    if (!sec) {
      sec = { key: sk, name: p.section, latest: null, pages: [] }
      sections.set(sk, sec)
      nb.sections.push(sec)
    }
    sec.pages.push(p)
    sec.latest = later(sec.latest, p.edited)
  }
  const out = [...notebooks.values()]
  for (const nb of out) {
    for (const sec of nb.sections) sec.pages.sort((a, b) => time(b.edited) - time(a.edited))
    nb.sections.sort(newer)
  }
  return out.sort(newer)
}

/** En son düzenlenen `n` bölümün anahtarı (defterden bağımsız): açılışta açık gelenler. */
export function recentSectionKeys(groups: readonly OneNoteNotebookGroup<GroupablePage>[], n = 2) {
  const all = groups.flatMap((g) => g.sections).sort(newer)
  return new Set(all.slice(0, n).map((s) => s.key))
}

/** Defter ve bölüm bilgisi hiç yok (sorgu `$expand`sız döndü): gruplamak anlamsız, düz liste. */
export function isUngrouped(groups: readonly OneNoteNotebookGroup<GroupablePage>[]) {
  return groups.length === 1 && !groups[0].name && groups[0].sections.every((s) => !s.name)
}
