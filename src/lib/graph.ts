import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"
import type { ThrownLike } from "@/lib/errorCause"
import { ensureMsalInitialized } from "@/lib/msal"
import { graphRequest } from "@/lib/graphRequest"
import type {
  GraphRequestOptions,
  GraphResult,
  MsalAccount,
  MsalInstance,
} from "@/lib/graphRequest"

export { CONSENT_CODES, GRAPH_BASE, STATUS, graphRequest, tokenDenied } from "@/lib/graphRequest"
export type {
  GraphFailure,
  GraphMethod,
  GraphRead,
  GraphReady,
  GraphRequestOptions,
  GraphResult,
  GraphStatus,
  MsalAccount,
  MsalInstance,
} from "@/lib/graphRequest"

type Opts<K extends keyof GraphRequestOptions> = Pick<GraphRequestOptions, "path" | "scopes" | K>

/** Graph'ın `dateTimeTimeZone` değeri (etkinlik başı/sonu). */
export interface GraphDateTime {
  dateTime?: string | null
  timeZone?: string | null
}

/**
 * Microsoft Graph reads for the header panels. İstek iskeleti (belirteç, fetch, hata → durum,
 * yeniden deneme) `lib/graphRequest`te; buradaki fiil işlevleri ona ince birer kapı.
 *
 * Two rules this module exists to enforce:
 *
 * 1. **Silent or nothing.** Tokens come from `acquireTokenSilent` and a
 *    failure is reported, never escalated. A header widget mounts on every
 *    route, so an automatic `acquireTokenRedirect` would bounce people out of
 *    the app mid-task — and the panel it serves is never what the user was
 *    doing. The only interactive escalation here comes from a click (see
 *    `requestGraphScopes`).
 *
 * 2. **"Couldn't ask" is not "no data".** Callers get a status, so a missing
 *    consent renders an explanation rather than an empty inbox. Collapsing
 *    the two is the exact bug that hid the settings admin tabs from everyone
 *    (see useIsInGroup's UNKNOWN sentinel).
 *
 * `Calendars.Read` and `Mail.Read` DO ride the login request (see msal.js) —
 * safe only because both are granted tenant-wide and neither needs admin
 * consent, so they add no prompt. That is what makes the silent path below
 * work at all: a scope the session never carried can only be renewed through
 * a hidden iframe, which third-party-cookie rules block. Any scope that is
 * NOT already granted must stay out of the login request, or sign-in turns
 * into an "Approval required" wall for everyone.
 */

/**
 * GET a Graph resource.
 *
 * `retry` (varsayılan 0): geçici hatada (429 · 502 · 503 · 504 ve ağ
 * hatası) kaç kez yeniden denensin. Varsayılan KAPALI — bugünkü panellerin
 * davranışı değişmesin; isteyen çağıran açar (To Do: posta kutusunun
 * eşzamanlılık sınırı 429 döndürüyor).
 *
 * Never throws — every failure is a status. HTTP hatalarında `code` ve `error` Graph'ın kendi
 * hata kodu ve cümlesi.
 */
export function graphGet<T = unknown>(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, headers, retry, quiet }: Opts<"headers" | "retry" | "quiet">,
): Promise<GraphResult<T>> {
  return graphRequest<T>(instance, account, { path, scopes, headers, retry, quiet })
}

/**
 * Ham bayt (`/$value`) — postanın EKİNİ indirmek için (okuma penceresinin ek kartları).
 * Belirteç yine yalnız SESSİZCE alınır, sonuç yine `STATUS` taşır.
 * ⚠️ Blob bellekte kalır ve çağıran onu hemen bir `blob:` adresine çevirip
 * bırakır — kalıcı bir önbelleğe GİRMEZ (başkasının eki, paylaşılan tarayıcı).
 */
export function graphGetBlob(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, quiet }: Opts<"quiet">,
): Promise<GraphResult<never>> {
  return graphRequest(instance, account, { path, scopes, read: "blob", quiet })
}

/**
 * POST — Graph'ın arama ucu (`/search/query` GET kabul etmiyor) ve kayıt yaratma.
 * Yeniden deneme YALNIZ 429'da (`lib/graphRequest` › RETRY_ON). Ek başlık taşımaz.
 */
export function graphPost<T = unknown>(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, body, retry, quiet }: Opts<"body" | "retry" | "quiet">,
): Promise<GraphResult<T>> {
  return graphRequest<T>(instance, account, { method: "POST", path, scopes, body, retry, quiet })
}

/**
 * Gövdesiz cevap bekleyen POST. `/me/sendMail` 202 Accepted döner ve gövdesi BOŞTUR;
 * `graphPost` onu "parse hatası" sayardı. Birleştirmek gerçek bir ayrıştırma hatasını da
 * sessizce başarı sayardı. Hata gövdesi (izin yok, alıcı çözülemedi, ek çok büyük) yüzeye çıkar.
 */
export function graphPostNoContent(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, body }: Opts<"body">,
): Promise<GraphResult<never>> {
  return graphRequest(instance, account, { method: "POST", path, scopes, body, read: "none" })
}

/**
 * PATCH — To Do görevini güncellemek için (tamamla, teslim tarihini kaldır); Planner `headers`
 * ile sürüm ister (`If-Match`). Graph bazı uçlarda 200 + gövde, bazılarında 204 döner; ikisi de
 * başarı. İdempotent: geçici hataların hepsinde yeniden denenebilir.
 */
export function graphPatch<T = unknown>(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, body, headers, retry }: Opts<"body" | "headers" | "retry">,
): Promise<GraphResult<T>> {
  const opts: GraphRequestOptions = {
    method: "PATCH",
    path,
    scopes,
    body,
    headers,
    retry,
    read: "jsonOrNull",
  }
  return graphRequest<T>(instance, account, opts)
}

/**
 * DELETE — To-Do sayfası (görev, adım, liste silme). Graph 204 döner; 404 de başarı.
 * ⚠️ Yeniden deneme YALNIZ 429'da: ikinci silme 404 döner ve "silinemedi" düşerdi.
 */
export function graphDelete(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes, retry }: Opts<"retry">,
): Promise<GraphResult<null>> {
  return graphRequest(instance, account, { method: "DELETE", path, scopes, retry, read: "null" })
}

/** Dosyanın İKİLİ içeriği. JSON uçlarından ayrı: `res.json()` burada patlar. */
export function graphGetBinary(
  instance: MsalInstance,
  account: MsalAccount,
  { path, scopes }: Opts<never>,
): Promise<GraphResult<ArrayBuffer>> {
  return graphRequest<ArrayBuffer>(instance, account, { path, scopes, read: "arrayBuffer" })
}

/**
 * Ask for a scope interactively, from a click.
 *
 * Needed when a session predates a permission grant: silent acquisition for a
 * scope the session never carried is renewed through a hidden iframe, which
 * third-party-cookie rules block. A popup is user-initiated, so it is exempt —
 * and unlike acquireTokenRedirect it doesn't throw the user out of whatever
 * they were doing. Returns true if a token was obtained.
 */
export async function requestGraphScopes(
  instance: IPublicClientApplication,
  account: AccountInfo | undefined,
  scopes: string[],
): Promise<boolean> {
  try {
    await ensureMsalInitialized()
    await instance.acquireTokenPopup({ scopes, account })
    return true
  } catch (error) {
    const err = error as ThrownLike | null | undefined
    const code = err?.errorCode ?? ""
    // Açılır pencere ENGELLENDİYSE yönlendirmeye düşülür. Bu, modülün
    // "sessiz ya da hiç" kuralını ÇİĞNEMEZ: o kural otomatik yükseltmeyi
    // yasaklar, çünkü header her rotada mount oluyor ve kullanıcıyı işinin
    // ortasında atardı. Buradaki yönlendirme kullanıcının bastığı "Bağlan"
    // düğmesinden geliyor, yani kullanıcının işini kesmiyor.
    // Telefonda gerekli: iOS'ta açılır pencere sıklıkla engelleniyor
    // ve engellendiğinde düğme sessizce hiçbir şey yapmıyordu (ölçüldü
    // 2026-08-19), yani kullanıcı için izin verilemez bir duvar oluyordu.
    //
    // `user_cancelled` HARİÇ: vazgeçen kullanıcıyı tam sayfa bir yönlendirmeye
    // sokmak, vazgeçmesini yok saymak olurdu.
    if (code === "popup_window_error" || code === "empty_window_error") {
      try {
        await instance.acquireTokenRedirect({ scopes, account })
        return false // buraya dönülmez; sayfa zaten ayrıldı
      } catch (redirectError) {
        const redirectErr = redirectError as ThrownLike | null | undefined
        console.warn(
          "[graph] redirect consent failed:",
          redirectErr?.errorCode ?? redirectErr?.message,
        )
        return false
      }
    }
    console.warn(
      `[graph] interactive consent for ${scopes.join(", ")} failed:`,
      code || err?.message,
    )
    return false
  }
}

/**
 * The browser's IANA zone, sent to Graph so event times come back as local
 * wall-clock. Without it Graph answers in UTC and all-day events land on the
 * wrong day — the classic bug in this feature.
 */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

/**
 * Turns Graph's dateTimeTimeZone into a real Date.
 *
 * `dateTime` has no offset and no trailing Z — it is wall-clock in the zone
 * named alongside it. If Graph honoured our Prefer header that zone is the
 * browser's, so plain parsing is correct; if it did not (some zone names are
 * rejected) the payload says UTC and we must say so explicitly, or every time
 * shifts by the local offset.
 */
export function parseGraphDateTime(value: GraphDateTime | null | undefined): Date | null {
  if (!value?.dateTime) return null
  const raw = value.dateTime
  const isUtc = (value.timeZone ?? "").toUpperCase() === "UTC"
  const d = new Date(isUtc && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw) ? `${raw}Z` : raw)
  return Number.isNaN(d.getTime()) ? null : d
}
