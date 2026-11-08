/**
 * Yapışkan notların Graph tarafı: "TYRO Notlar" bölümünü bul/kur, sayfaları listele, ekle,
 * değiştir, sil. Okuma `Notes.Read`, yazma `Notes.ReadWrite` (ikisi de yönetici onaylı, kullanım
 * anında sessizce; OneNote widget'ıyla aynı). Bölüm yalnız İLK NOT eklenirken kurulur: bakmak
 * kişinin OneNote'una bir şey yazmaz.
 */
import { graphRequest, STATUS } from "@/lib/graphRequest"
import type {
  GraphFailure,
  GraphStatus as Status,
  MsalAccount,
  MsalInstance,
} from "@/lib/graphRequest"
import { mapPages } from "@/lib/onenote/onenotePages"
import {
  createPage,
  fetchPageContent,
  NOTES_SCOPES,
  NOTES_WRITE_SCOPES,
  patchPageContent,
} from "@/lib/onenote/onenoteSource"
import {
  colorOf,
  newNoteHtml,
  noteText,
  sortNotes,
  STICKY_SECTION,
  updateCommands,
  type StickyNote,
} from "./stickyNotes"

/** Panoda gösterilen en çok not: her biri ayrı içerik isteği (OneNote 429'a hızlı düşüyor). */
export const LIST_MAX = 12
const CONTENT_PARALLEL = 3

type Picked = Record<string, string>

const detailOf = (f: unknown): string | undefined => (f as { detail?: string } | null)?.detail

// Bölüm kimliği oturumluk bellekte (hesap başına): her açılışta bir bulma isteği yeter.
const sectionIds = new Map<string, string>()
const acctKey = (account: MsalAccount) => account?.homeAccountId ?? ""

const SECTION_PATH =
  "/me/onenote/sections?$select=id,displayName&$filter=" +
  encodeURIComponent(`displayName eq '${STICKY_SECTION}'`)

async function findSection(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<{ status: Status; id: string | null; detail?: string }> {
  const known = sectionIds.get(acctKey(account))
  if (known) return { status: STATUS.ready, id: known }
  const res = await graphRequest<{ value?: { id?: string }[] }>(instance, account, {
    path: SECTION_PATH,
    scopes: NOTES_SCOPES,
    retry: 1,
    quiet: true,
  })
  // OneNote'u hiç açılmamış hesap 404 verir: bölüm yok.
  if (res.status === STATUS.error && res.httpStatus === 404)
    return { status: STATUS.ready, id: null }
  if (res.status !== STATUS.ready) return { status: res.status, id: null, detail: detailOf(res) }
  const id = res.data?.value?.find((s) => s?.id)?.id ?? null
  if (id) sectionIds.set(acctKey(account), id)
  return { status: STATUS.ready, id }
}

/** Varsayılan defter; yoksa ilk defter; hiç defter yoksa "TYRO" defteri kurulur. */
async function notebookId(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<{ status: Status; id: string | null; detail?: string }> {
  const res = await graphRequest<{ value?: { id?: string; isDefault?: boolean }[] }>(
    instance,
    account,
    {
      path: "/me/onenote/notebooks?$select=id,isDefault&$top=50",
      scopes: NOTES_WRITE_SCOPES,
      retry: 1,
      quiet: true,
    },
  )
  if (res.status === STATUS.ready) {
    const list = res.data?.value ?? []
    const id = (list.find((n) => n?.isDefault) ?? list[0])?.id ?? null
    if (id) return { status: STATUS.ready, id }
  } else if (!(res.status === STATUS.error && res.httpStatus === 404)) {
    return { status: res.status, id: null, detail: detailOf(res) }
  }
  const made = await graphRequest<{ id?: string }>(instance, account, {
    method: "POST",
    path: "/me/onenote/notebooks",
    scopes: NOTES_WRITE_SCOPES,
    body: { displayName: "TYRO" },
    quiet: true,
  })
  if (made.status !== STATUS.ready) return { status: made.status, id: null, detail: detailOf(made) }
  return { status: STATUS.ready, id: made.data?.id ?? null }
}

async function ensureSection(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<{ status: Status; id: string | null; detail?: string }> {
  const found = await findSection(instance, account)
  if (found.status !== STATUS.ready || found.id) return found
  const book = await notebookId(instance, account)
  if (!book.id)
    return { ...book, status: book.status === STATUS.ready ? STATUS.error : book.status }
  const res = await graphRequest<{ id?: string }>(instance, account, {
    method: "POST",
    path: `/me/onenote/notebooks/${encodeURIComponent(book.id)}/sections`,
    scopes: NOTES_WRITE_SCOPES,
    body: { displayName: STICKY_SECTION },
    quiet: true,
  })
  if (res.status !== STATUS.ready || !res.data?.id)
    return {
      status: res.status === STATUS.ready ? STATUS.error : res.status,
      id: null,
      detail: detailOf(res),
    }
  sectionIds.set(acctKey(account), res.data.id)
  return { status: STATUS.ready, id: res.data.id }
}

/** Sınırlı paralellikle eşleme (sıra korunur). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export interface ListResult {
  status: Status
  notes: StickyNote[]
  detail?: string
}

/** Notlar (en yeni önce, en çok `LIST_MAX`): sayfa listesi + her birinin düz metni. */
export async function listNotes(
  instance: MsalInstance,
  account: MsalAccount,
  picked: Picked,
): Promise<ListResult> {
  const section = await findSection(instance, account)
  if (section.status !== STATUS.ready)
    return { status: section.status, notes: [], detail: section.detail }
  if (!section.id) return { status: STATUS.ready, notes: [] }
  const res = await graphRequest<{ value?: unknown[] }>(instance, account, {
    path:
      `/me/onenote/sections/${encodeURIComponent(section.id)}/pages` +
      `?$select=id,title,createdDateTime,lastModifiedDateTime,links&$orderby=lastModifiedDateTime desc&$top=${LIST_MAX}`,
    scopes: NOTES_SCOPES,
    retry: 1,
    quiet: true,
  })
  if (res.status !== STATUS.ready) {
    // Bölüm silinmişse (404) bellekteki kimlik düşer: sonraki ekleme yeniden kurar.
    if (res.status === STATUS.error && res.httpStatus === 404) {
      sectionIds.delete(acctKey(account))
      return { status: STATUS.ready, notes: [] }
    }
    return { status: res.status, notes: [], detail: detailOf(res as GraphFailure) }
  }
  const pages = mapPages(res.data?.value).slice(0, LIST_MAX)
  const notes = await mapLimit(pages, CONTENT_PARALLEL, async (p) => {
    const content = await fetchPageContent(instance, account, p.id, { images: false })
    return {
      id: p.id,
      // İçerik inmezse başlık (ilk satır) yine okunur.
      text: content.status === STATUS.ready ? noteText(content.html) || p.title : p.title,
      color: colorOf(p.id, picked),
      modified: (p.edited ?? new Date(0)).toISOString(),
      webUrl: p.webUrl,
    }
  })
  return { status: STATUS.ready, notes: sortNotes(notes) }
}

export async function createNote(
  instance: MsalInstance,
  account: MsalAccount,
  text: string,
  picked: Picked,
): Promise<{ status: Status; note: StickyNote | null; detail?: string }> {
  const section = await ensureSection(instance, account)
  if (!section.id) return { status: section.status, note: null, detail: section.detail }
  const res = await createPage(instance, account, section.id, newNoteHtml(text, new Date()))
  if (res.status !== STATUS.ready || !res.page)
    return {
      status: res.status === STATUS.ready ? STATUS.error : res.status,
      note: null,
      detail: res.detail,
    }
  const p = res.page
  return {
    status: STATUS.ready,
    note: {
      id: p.id,
      text,
      color: colorOf(p.id, picked),
      modified: (p.edited ?? new Date()).toISOString(),
      webUrl: p.webUrl,
    },
  }
}

/** Gövde ve başlık; başlık reddedilirse (bazı sayfalarda olur) gövde yazıldıysa başarılı. */
export async function updateNote(
  instance: MsalInstance,
  account: MsalAccount,
  id: string,
  text: string,
): Promise<{ status: Status; detail?: string }> {
  const res = await patchPageContent(instance, account, id, updateCommands(text))
  const bodyFailed = res.failed.find((f) => f.command.target !== "title")
  if (!bodyFailed) return { status: STATUS.ready }
  return { status: bodyFailed.status as Status, detail: bodyFailed.detail }
}

export async function deleteNote(
  instance: MsalInstance,
  account: MsalAccount,
  id: string,
): Promise<{ status: Status; detail?: string }> {
  const res = await graphRequest(instance, account, {
    method: "DELETE",
    path: `/me/onenote/pages/${encodeURIComponent(id)}`,
    scopes: NOTES_WRITE_SCOPES,
    read: "none",
    quiet: true,
  })
  // Zaten silinmiş (404) not da silinmiş sayılır.
  if (res.status === STATUS.ready || (res.status === STATUS.error && res.httpStatus === 404))
    return { status: STATUS.ready }
  return { status: res.status, detail: detailOf(res) }
}
