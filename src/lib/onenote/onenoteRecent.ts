/**
 * Son sayfaları PARÇA PARÇA okuma (testli: `tests/unit/onenoteRecent.test.ts`).
 *
 * Hesap genelindeki `/me/onenote/pages` büyük hesapta hesabı aşar (çok bölüm → 20266, kütüphanede çok
 * öğe → 10008/10013, zaman aşımı); Microsoft böyle hesaplar için sayfaları BİR BÖLÜM BİR BÖLÜM okumayı
 * önerir. Burada bölümler en son düzenlenene göre sıralı, her bölümün sayfaları küçük parçalarla (`CHUNK`)
 * okunur ve liste GENEL yenilik sırasıyla tembel birleştirilir: bir sonraki sayfa, bölümlerin ön
 * belleklerindeki en yeni olandır; bir bölümün tarihi o anki adaydan yeniyse (bölümün sayfaları ondan
 * yeni olabilir) o bölüm AÇILIR. Yani ilk parça için tek-iki bölüm okunur, gerisi liste kaydırılıp
 * `next()` çağrıldıkça gelir; sıra hiç bozulmaz, yalnız sona eklenir. Hesapta bir milyon not olsa da
 * istek sayısı gösterilen not sayısıyla orantılıdır.
 */
import { GRAPH_BASE, graphRequest, STATUS } from "@/lib/graphRequest"
import type { GraphFailure, GraphResult, MsalAccount, MsalInstance } from "@/lib/graphRequest"
import { NOTES_SCOPES } from "./onenoteScopes"
import {
  CHUNK,
  mapPages,
  MAX_SECTIONS,
  NOTEBOOK_QUERIES,
  notebookSectionsQuery,
  RECENT_NOTEBOOKS,
  recentSections,
  SECTION_LIST_QUERIES,
  sectionPagesQuery,
  withParents,
} from "./onenotePages"
import type { OneNotePage, RawOneNotePage, RawOneNoteSection } from "./onenotePages"

const SECTION_LIST_TIMEOUT_MS = 15_000
const SECTION_PAGES_TIMEOUT_MS = 20_000
/** Aynı anda açılan bölüm: OneNote'un eş zamanlı istek sınırı düşük (ana istek de açıkken ≤ 4 istek). */
const WAVE = 3
/** Bir bölümün parçası bu kadar kez düşerse bırakılır. */
const MAX_FAILS = 2
/** Tek `next()` çağrısında en çok kaç tur: Graph'ın bozuk bir `nextLink` döngüsü sonsuz istek açmasın. */
const MAX_ROUNDS = 40

export type RecentNext =
  | { status: "ready"; pages: OneNotePage[]; done: boolean }
  | { status: "error"; failure: GraphFailure }

/** Sıradaki en çok `CHUNK` sayfayı genel yenilik sırasıyla verir; `done`: başka sayfa kalmadı. */
export interface RecentSource {
  next(): Promise<RecentNext>
}

interface Stream {
  section: RawOneNoteSection
  /** İlk parçanın adresi; `$skip` yedeği bunun üstüne yazılır. */
  first: string
  /** Sıradaki parçanın adresi; `null` = bölümün sayfası bitti. */
  next: string | null
  buffer: RawOneNotePage[]
  loaded: number
  fails: number
}

const stampOf = (p: RawOneNotePage): number =>
  Date.parse(p.lastModifiedDateTime ?? p.createdDateTime ?? "") || 0
const sectionStamp = (s: RawOneNoteSection): number => Date.parse(s.lastModifiedDateTime ?? "") || 0

/** Yalnız Graph'ın kendi adresi izlenir: yetki belirteci başka bir adrese gitmesin. */
function safeNext(href: unknown): string | null {
  return typeof href === "string" && href.startsWith(`${GRAPH_BASE}/`) ? href : null
}

/** Sıralı bölümlerden, tembel birleştiren kaynak (bölümler en son düzenlenen önce olmalı). */
export function createRecentSource(
  instance: MsalInstance,
  account: MsalAccount,
  sections: readonly RawOneNoteSection[],
): RecentSource {
  const streams: Stream[] = []
  let cursor = 0

  const open = (section: RawOneNoteSection): Stream => {
    const first = sectionPagesQuery(section.id as string)
    const s: Stream = { section, first, next: first, buffer: [], loaded: 0, fails: 0 }
    streams.push(s)
    return s
  }

  async function load(s: Stream, failedNow: Set<Stream>, fail: (f: GraphFailure) => void) {
    const r = await graphRequest<{ value?: unknown[]; "@odata.nextLink"?: string }>(
      instance,
      account,
      {
        path: s.next as string,
        scopes: NOTES_SCOPES,
        retry: 1,
        timeoutMs: SECTION_PAGES_TIMEOUT_MS,
        quiet: true,
      },
    )
    if (r.status !== STATUS.ready) {
      s.fails++
      failedNow.add(s)
      fail(r)
      return
    }
    const value = (Array.isArray(r.data?.value) ? r.data?.value : []) as RawOneNotePage[]
    s.buffer.push(...withParents(value, s.section).sort((a, b) => stampOf(b) - stampOf(a)))
    s.loaded += value.length
    s.fails = 0
    // Sunucu `nextLink` vermezse ama parça doluysa devamı `$skip` ile istenir.
    s.next =
      safeNext(r.data?.["@odata.nextLink"]) ??
      (value.length >= CHUNK ? `${s.first}&$skip=${s.loaded}` : null)
  }

  const remaining = () =>
    cursor < sections.length ||
    streams.some((s) => s.fails < MAX_FAILS && (s.buffer.length > 0 || s.next !== null))

  return {
    async next() {
      const out: RawOneNotePage[] = []
      const failedNow = new Set<Stream>()
      let failure: GraphFailure | null = null
      const fail = (f: GraphFailure) => {
        failure ??= f
      }
      for (let round = 0; out.length < CHUNK && round < MAX_ROUNDS; round++) {
        // Aday: ön belleklerdeki en yeni sayfa.
        let head: Stream | null = null
        for (const s of streams)
          if (s.buffer.length && (!head || stampOf(s.buffer[0]) > stampOf(head.buffer[0]))) head = s
        const t = head ? stampOf(head.buffer[0]) : -Infinity
        const tasks: Promise<void>[] = []
        // Ön belleği boşalmış bölümler adaydan yeni sayfa saklıyor olabilir: sıradaki parçayı getir.
        for (const s of streams)
          if (!s.buffer.length && s.next !== null && s.fails < MAX_FAILS && !failedNow.has(s))
            tasks.push(load(s, failedNow, fail))
        // Henüz açılmamış bölümün tarihi adaydan yeniyse sayfaları adaydan yeni olabilir: aç.
        for (
          let woke = 0;
          cursor < sections.length && woke < WAVE && sectionStamp(sections[cursor]) > t;
          woke++
        )
          tasks.push(load(open(sections[cursor++]), failedNow, fail))
        if (tasks.length) {
          await Promise.all(tasks)
          continue
        }
        if (!head) break
        out.push(head.buffer.shift() as RawOneNotePage)
      }
      if (!out.length && failure) return { status: "error", failure }
      return { status: "ready", pages: mapPages(out), done: !remaining() }
    },
  }
}

/** Bölümleri defter üzerinden toplar (`NOTEBOOK_QUERIES`); hiçbir şey gelmezse `null`. */
async function sectionsViaNotebooks(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<RawOneNoteSection[] | null> {
  let res: GraphResult<{ value?: unknown[] }> | null = null
  for (const path of NOTEBOOK_QUERIES) {
    res = await graphRequest<{ value?: unknown[] }>(instance, account, {
      path,
      scopes: NOTES_SCOPES,
      retry: 1,
      timeoutMs: SECTION_LIST_TIMEOUT_MS,
      quiet: true,
    })
    if (res.status !== STATUS.error || res.httpStatus !== 400) break
  }
  if (!res || res.status !== STATUS.ready) return null
  const notebooks = recentSections(res.data?.value, RECENT_NOTEBOOKS)
  const lists = await Promise.all(
    notebooks.map((nb) =>
      graphRequest<{ value?: unknown[] }>(instance, account, {
        path: notebookSectionsQuery(nb.id as string),
        scopes: NOTES_SCOPES,
        retry: 1,
        timeoutMs: SECTION_LIST_TIMEOUT_MS,
        quiet: true,
      }),
    ),
  )
  const out: RawOneNoteSection[] = []
  lists.forEach((r, i) => {
    const value = r.status === STATUS.ready ? r.data?.value : null
    if (!Array.isArray(value)) return
    const nb = notebooks[i]
    for (const s of value as RawOneNoteSection[])
      out.push({ ...s, parentNotebook: { id: nb.id, displayName: nb.displayName } })
  })
  return out.length ? out : null
}

/**
 * İlk parçayı okur: bölüm listesi (en son düzenlenen `MAX_SECTIONS`), sonra ilk `CHUNK` sayfa. `source`
 * sonraki parçalar için (yoksa liste bitti). Bölüm listesi de hesabı aşarsa bölümler defter üzerinden
 * bulunur (`sectionsViaNotebooks`); izin hatasında bu yol denenmez.
 */
export async function openRecentPages(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<{ pages: OneNotePage[]; source: RecentSource | null } | { failure: GraphFailure }> {
  let res: GraphResult<{ value?: unknown[] }> | null = null
  for (const path of SECTION_LIST_QUERIES) {
    res = await graphRequest<{ value?: unknown[] }>(instance, account, {
      path,
      scopes: NOTES_SCOPES,
      retry: 1,
      timeoutMs: SECTION_LIST_TIMEOUT_MS,
      quiet: true,
    })
    if (res.status !== STATUS.error || res.httpStatus !== 400) break
  }
  let raw: unknown = res?.status === STATUS.ready ? res.data?.value : null
  if (!res || res.status !== STATUS.ready) {
    const failure = (res ?? { status: STATUS.error, error: "", detail: "" }) as GraphFailure
    if (failure.status !== STATUS.error) return { failure }
    const viaNotebooks = await sectionsViaNotebooks(instance, account)
    if (!viaNotebooks) return { failure }
    raw = viaNotebooks
  }
  const source = createRecentSource(instance, account, recentSections(raw, MAX_SECTIONS))
  const first = await source.next()
  if (first.status === "error") return { failure: first.failure }
  return { pages: first.pages, source: first.done ? null : source }
}
