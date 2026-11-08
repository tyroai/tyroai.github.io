import { graphRequest, STATUS } from "@/lib/graphRequest"
import type { GraphFailure, GraphResult, MsalAccount, MsalInstance } from "@/lib/graphRequest"
import { createSessionCache } from "@/lib/sessionCache"
import type { PatchCommand } from "./onenoteEdit"
import { BIG_ACCOUNT_CODES, chainDetail, isBigAccount } from "./onenoteErrors"
import { mapSections, SECTION_QUERIES } from "./onenoteNewPage"
import type { OneNoteSection } from "./onenoteNewPage"
import { mapPages, PAGE_QUERIES } from "./onenotePages"
import type { OneNotePage } from "./onenotePages"
import { openRecentPages } from "./onenoteRecent"
import type { RecentSource } from "./onenoteRecent"
import { NOTES_SCOPES } from "./onenoteScopes"
import { flattenOneNoteHtml } from "./onenoteHtml"
import { imageRefs, isGraphResource, sniffImageType, swapImages } from "./onenoteImages"
import type { ImageRef } from "./onenoteImages"

/**
 * OneNote okumaları — yalnız `Notes.Read` (yönetici onaylı; girişte istenmez, kullanım anında
 * sessizce). Belirteç alınamazsa `denied` döner, konsola yazılmaz (`quiet`): kart sakin bir
 * "erişim yok" hâli çizer. Sayfa listesinin önbelleği `useWidgetData`ın (`lib/widgetCache`),
 * içeriğinki burada (`createSessionCache`) — ikisi de çıkışta silinir.
 */
export { NOTES_SCOPES }

// Süre sınırları (ms): hesap genelindeki liste büyük hesapta dakikalarca takılabiliyor (Safari'nin kendi
// sınırı bir dakikayı aşar). Ana istek yavaşsa bölüm bölüm okuma `HEDGE_MS` sonra PARALEL başlar ve ilk
// parça gelince liste gösterilir; ana istek bu arada sürer (hızlı hesaplar bunu hiç yaşamaz).
const ALL_PAGES_TIMEOUT_MS = 30_000
const HEDGE_MS = 2_500

type Status = (typeof STATUS)[keyof typeof STATUS]

export interface PagesResult {
  status: Status | "loading"
  /** `source` varsa liste tam değil: ilk parça burada, devamı `source.next()` ile (aşağı kaydırınca). */
  data: { pages: OneNotePage[]; source?: RecentSource } | null
  /**
   * Başarısızlıkta kişisel veri içermeyen neden kodu (`lib/errorCause`; hata zinciri "A · → B"):
   * ekranda `ErrorCause` cümle ve teknik ayrıntıyla gösterir.
   */
  detail?: string
}

const detailOf = (f: GraphFailure | null | undefined): string | undefined =>
  f && "detail" in f ? f.detail : undefined

function failureOf(first: GraphFailure | null, then?: GraphFailure): PagesResult {
  const detail = chainDetail(detailOf(first), detailOf(then))
  return { status: first?.status ?? STATUS.error, data: null, ...(detail ? { detail } : {}) }
}

type PrimaryOutcome =
  | { kind: "pages"; pages: OneNotePage[] }
  /** Sonuç olduğu gibi döner (OneNote hiç açılmamış hesap: boş liste; izin yok; …). */
  | { kind: "stop"; result: PagesResult }
  /** Hata; `eligible`: parça parça okumak denenmeye değer. */
  | { kind: "fail"; failure: GraphFailure; eligible: boolean }

type RecentOutcome = Awaited<ReturnType<typeof openRecentPages>>

/**
 * Hesap genelindeki liste (`/me/onenote/pages`, en çok 100): hızlı hesaplarda tek istek. Sorgu seçeneği
 * reddedilirse (400) bir sonraki, daha sade sorgu denenir (`PAGE_QUERIES`); hesap büyüklüğü hataları
 * (20266 …) sade sorguda da sürer, o yüzden onlarda düşülmez. Yeniden deneme YOK: 504 / zaman aşımında
 * aynı ağır isteği tekrarlamak bekleyişi ikiye katlar; çare parça parça okumak. Kısıtlamada (429)
 * kullanıcı "Yeniden dene"ye basar.
 */
async function fetchAllPages(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<PrimaryOutcome> {
  let last: GraphResult<{ value?: unknown[] }> | null = null
  for (const path of PAGE_QUERIES) {
    last = await graphRequest<{ value?: unknown[] }>(instance, account, {
      path,
      scopes: NOTES_SCOPES,
      retry: 0,
      timeoutMs: ALL_PAGES_TIMEOUT_MS,
      quiet: true,
    })
    if (last.status === STATUS.ready) return { kind: "pages", pages: mapPages(last.data?.value) }
    if (
      last.status !== STATUS.error ||
      last.httpStatus !== 400 ||
      BIG_ACCOUNT_CODES.has(last.code ?? "")
    )
      break
  }
  // OneNote'u hiç açılmamış hesap 404 verir: boş liste.
  if (last?.status === STATUS.error && last.httpStatus === 404)
    return { kind: "stop", result: { status: STATUS.ready, data: { pages: [] } } }
  if (last?.status === STATUS.error)
    return { kind: "fail", failure: last, eligible: isBigAccount(last) }
  return { kind: "stop", result: failureOf(last as GraphFailure | null) }
}

const ready = (pages: OneNotePage[], source?: RecentSource | null): PagesResult => ({
  status: STATUS.ready,
  data: source ? { pages, source } : { pages },
})

/** Sonuç: parça parça okuma ya da başarısızlık zinciri. */
const fromRecent = (alt: RecentOutcome, first?: GraphFailure): PagesResult =>
  "pages" in alt
    ? ready(alt.pages, alt.source)
    : failureOf(first ?? alt.failure, first ? alt.failure : undefined)

function hedgeTimer(ms: number): { promise: Promise<"hedge">; cancel: () => void } {
  let id: ReturnType<typeof setTimeout> | undefined
  const promise = new Promise<"hedge">((resolve) => {
    id = setTimeout(() => resolve("hedge"), ms)
  })
  return { promise, cancel: () => clearTimeout(id) }
}

/**
 * Son düzenlenen sayfalar. İKİ yol, hızlı olan kazanır:
 *  1. hesap genelindeki tek istek (en çok 100 sayfa; hızlı hesaplarda birkaç yüz ms),
 *  2. parça parça okuma (`onenoteRecent`: ilk 10 sayfa, devamı aşağı kaydırınca): ana istek `HEDGE_MS`
 *     içinde bitmezse PARALEL başlar, ana istek büyük-hesap hatasıyla düşerse hemen.
 * Ana istek yavaşsa kullanıcı ilk notları saniyeler içinde görür, bekleyip hiçbir şey görmez.
 * OneNote'u hiç açılmamış hesap (404) boş liste.
 */
export async function fetchOneNotePages(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<PagesResult> {
  const recent = () => openRecentPages(instance, account)
  const primary = fetchAllPages(instance, account)
  const hedge = hedgeTimer(HEDGE_MS)
  const quick = await Promise.race([primary, hedge.promise])
  hedge.cancel()
  if (quick !== "hedge") {
    if (quick.kind === "pages") return ready(quick.pages)
    if (quick.kind === "stop") return quick.result
    if (!quick.eligible) return failureOf(quick.failure)
    return fromRecent(await recent(), quick.failure)
  }

  // Ana istek yavaş: parça parça okuma da başlar; önce bitenin sonucu gösterilir.
  const alt = recent()
  const first = await Promise.race([
    primary.then((outcome) => ({ from: "primary" as const, outcome })),
    alt.then((outcome) => ({ from: "alt" as const, outcome })),
  ])
  if (first.from === "primary") {
    const p = first.outcome
    if (p.kind === "pages") return ready(p.pages)
    if (p.kind === "stop") return p.result
    // Ana istek düştü: parça parça okumanın sonucu belirler.
    return fromRecent(await alt, p.failure)
  }
  // Parça parça okuma önce bitti. Notlar varsa göster; boş ve bitmişse ya da başarısızsa ana isteği bekle.
  const a = first.outcome
  if ("pages" in a && (a.pages.length || a.source)) return fromRecent(a)
  const p = await primary
  if (p.kind === "pages") return ready(p.pages)
  if (p.kind === "stop") return p.result
  return fromRecent(a, p.failure)
}

export interface PatchResult {
  /** Yazılan komut sayısı. */
  done: number
  /** Reddedilenler; `detail` kişisel veri içermeyen neden kodu (HTTP · Graph kodu). */
  failed: { command: PatchCommand; status: string; detail?: string }[]
}

/** Okuyucunun içeriği: çerçeveye hazır gövde ve gösterilemeyen görsel sayısı. */
export interface PageContent {
  status: Status
  html: string
  raw: string
  /** Okunamadıysa kişisel veri içermeyen neden kodu (`lib/errorCause`): okuyucu `ErrorCause` gösterir. */
  detail?: string
}

// Okunan son sayfalar (kişisel içerik): 10 dk taze, en çok 12 sayfa; çıkışta silinir.
const contentCache = createSessionCache<string, PageContent>({
  ttlMs: 10 * 60_000,
  maxEntries: 12,
  name: "onenoteContent",
})

const IMAGE_MAX_BYTES = 3 * 1024 * 1024

/** Baytlar → `data:` adresi (tür imzadan; yanıtın türüne güvenilmez). */
function toDataUrl(bytes: Uint8Array, type: string): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${type};base64,${btoa(bin)}`
}

/** Tek görsel: adayları sırayla dener (web boyutu, sonra asıl dosya); ilk çizilebilen `data:`. */
async function fetchImage(
  instance: MsalInstance,
  account: MsalAccount,
  ref: ImageRef,
): Promise<string | null> {
  for (const url of ref.urls) {
    if (!isGraphResource(url)) continue
    const res = await graphRequest(instance, account, {
      path: url,
      scopes: NOTES_SCOPES,
      read: "blob",
      // OneNote kaynak ucu sık 429 veriyor; bir kez `Retry-After` kadar beklenir.
      retry: 1,
      quiet: true,
    })
    const blob = res.status === STATUS.ready ? res.blob : null
    if (!blob || !blob.size || blob.size > IMAGE_MAX_BYTES) continue
    // Tür yanıttan değil imzadan: kaynak `application/octet-stream` da gelebiliyor.
    const bytes = new Uint8Array(await blob.arrayBuffer().catch(() => new ArrayBuffer(0)))
    const type = sniffImageType(bytes, /^image\//i.test(blob.type) ? blob.type : ref.type)
    if (type) return toDataUrl(bytes, type)
  }
  return null
}

/** Sayfadaki Graph görsellerini (en çok 8, her biri ≤ 3 MB) indirip `data:` adresine çevirir. */
async function resolveImages(
  instance: MsalInstance,
  account: MsalAccount,
  html: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  await Promise.all(
    imageRefs(html).map(async (ref) => {
      const data = await fetchImage(instance, account, ref)
      if (data) out.set(ref.key, data)
    }),
  )
  return out
}

/**
 * Sayfanın içeriği (`/pages/{id}/content`): konumsuz gövde, görseller gömülü. Aynı sayfanın
 * ikinci açılışı bellekten; `images: false` (kartın ön izlemesi) görsel indirmez.
 */
export async function fetchPageContent(
  instance: MsalInstance,
  account: MsalAccount,
  id: string,
  { images = true }: { images?: boolean } = {},
): Promise<PageContent> {
  const key = `${account?.homeAccountId ?? ""}:${id}:${images ? "full" : "text"}`
  const hit = contentCache.get(key)
  if (hit) return hit
  return contentCache.dedupe(key, async (commit) => {
    const res = await graphRequest(instance, account, {
      path: `/me/onenote/pages/${encodeURIComponent(id)}/content`,
      scopes: NOTES_SCOPES,
      read: "blob",
      retry: 1,
      quiet: true,
    })
    if (res.status !== STATUS.ready || !res.blob) {
      const detail = res.status === STATUS.ready ? undefined : detailOf(res)
      return {
        status: res.status === STATUS.ready ? STATUS.error : res.status,
        html: "",
        raw: "",
        ...(detail ? { detail } : {}),
      }
    }
    const raw = await res.blob.text().catch(() => "")
    let html = flattenOneNoteHtml(raw)
    if (images) html = swapImages(html, await resolveImages(instance, account, html))
    const value: PageContent = { status: STATUS.ready, html, raw }
    commit(value)
    return value
  })
}

/**
 * Düzenleme `Notes.ReadWrite` ister (yönetici onaylı): okuma kapsamından ayrı, yalnız
 * düzenleyici açılınca sessizce alınır. Belirteç alınamazsa `denied` — düğme kalır, kayıt
 * "izin yok" der.
 */
export const NOTES_WRITE_SCOPES = ["Notes.ReadWrite"]

/** Düzenleyicinin ham içeriği: öğe kimlikleriyle (`includeIDs=true`), görseller indirilmez. */
export async function fetchEditableContent(
  instance: MsalInstance,
  account: MsalAccount,
  id: string,
): Promise<{ status: Status; raw: string }> {
  const res = await graphRequest(instance, account, {
    path: `/me/onenote/pages/${encodeURIComponent(id)}/content?includeIDs=true`,
    scopes: NOTES_WRITE_SCOPES,
    read: "blob",
    retry: 1,
    quiet: true,
  })
  if (res.status !== STATUS.ready || !res.blob)
    return { status: res.status === STATUS.ready ? STATUS.error : res.status, raw: "" }
  return { status: STATUS.ready, raw: await res.blob.text().catch(() => "") }
}

/**
 * Değişiklikleri yazar (`PATCH /pages/{id}/content`, komut dizisi — `onenoteEdit` › `buildPatch`).
 * Komutlar TEK TEK gönderilir: Graph bir komutu reddederse (örn. başlık) bütün istek düşer;
 * tek tek gidince ötekiler kaydedilir, reddedilen hangisiyse o bildirilir. Bir şey yazıldıysa
 * sayfanın okuma önbelleği silinir: okuyucu yeni hâlini çeker.
 */
export async function patchPageContent(
  instance: MsalInstance,
  account: MsalAccount,
  id: string,
  commands: PatchCommand[],
): Promise<PatchResult> {
  let done = 0
  const failed: PatchResult["failed"] = []
  for (const command of commands) {
    const res = await graphRequest(instance, account, {
      method: "PATCH",
      path: `/me/onenote/pages/${encodeURIComponent(id)}/content`,
      scopes: NOTES_WRITE_SCOPES,
      body: [command],
      // 204 No Content: gövde okunmaz.
      read: "none",
      quiet: true,
    })
    if (res.status === STATUS.ready) done++
    else failed.push({ command, status: res.status, detail: (res as { detail?: string }).detail })
    // Belirteç hiç yoksa ötekiler de gitmez.
    if (res.status === STATUS.denied && !done) break
  }
  if (done) {
    const acct = account?.homeAccountId ?? ""
    contentCache.delete(`${acct}:${id}:full`)
    contentCache.delete(`${acct}:${id}:text`)
  }
  return { done, failed }
}

/** Yeni sayfanın gideceği bölümler (`SECTION_QUERIES`; 400'de sadesi). Okuma kapsamı yeterli. */
export async function fetchSections(
  instance: MsalInstance,
  account: MsalAccount,
): Promise<{ status: Status; sections: OneNoteSection[] }> {
  let last: GraphResult<{ value?: unknown[] }> | null = null
  for (const path of SECTION_QUERIES) {
    last = await graphRequest<{ value?: unknown[] }>(instance, account, {
      path,
      scopes: NOTES_SCOPES,
      retry: 1,
      quiet: true,
    })
    if (last.status === STATUS.ready)
      return { status: STATUS.ready, sections: mapSections(last.data?.value) }
    if (last.status !== STATUS.error || last.httpStatus !== 400) break
  }
  return { status: last?.status ?? STATUS.error, sections: [] }
}

/**
 * Bölüme yeni sayfa (`POST /sections/{id}/pages`, gövde XHTML — `onenoteNewPage` › `newPageHtml`).
 * POST yalnız 429'da yeniden denenir (`graphRequest`): aynı sayfa iki kez oluşmasın.
 */
export async function createPage(
  instance: MsalInstance,
  account: MsalAccount,
  sectionId: string,
  html: string,
): Promise<{ status: Status; page: OneNotePage | null; detail?: string }> {
  const res = await graphRequest(instance, account, {
    method: "POST",
    path: `/me/onenote/sections/${encodeURIComponent(sectionId)}/pages`,
    scopes: NOTES_WRITE_SCOPES,
    body: html,
    contentType: "text/html",
    quiet: true,
  })
  if (res.status !== STATUS.ready)
    return { status: res.status, page: null, detail: (res as { detail?: string }).detail }
  return { status: STATUS.ready, page: mapPages([res.data])[0] ?? null }
}
