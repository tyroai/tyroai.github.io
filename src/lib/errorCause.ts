/**
 * Hata nedeni hattının GİRİŞİ. Her veri kaynağının hatası kısa, kişisel veri içermeyen tek bir
 * satıra (kod) çevrilir — "Graph · HTTP 403 · ErrorAccessDenied · scope Calendars.Read.Shared" —
 * ve her yerde `detail` diye bu kod taşınır. Ekranda neden cümlesiyle görünür (`ErrorCause`):
 * kişi ya da BT, eksiğin Microsoft izninde mi, rolde mi, ağda mı olduğunu ekran görüntüsünden anlar.
 *
 * Koda belirteç, e-posta, GUID, ad ya da kayıt değeri girmez; yalnız servis adı, HTTP durumu,
 * servisin hata kodu, MSAL kodu ve AADSTS numarası, eksik kapsam / yetki / tablo adı ve
 * ayıklanmış kısa ileti (`shortMessage`). Bu dosya ilk pakette: koddan neden ve cümle
 * (`causeOf`, `causeText`) tembel yarıda (`lib/causeText`), buradan `loadCauseText` ile iner.
 */
import type { Translate } from "@/lib/translate"

type CauseTextModule = typeof import("@/lib/causeText")

/** Kodun ilk parçası. Eski Self Servis kodlarında yok: onlar ERP'nin sayılır. */
export const SERVICES = Object.freeze({
  graph: "Graph",
  dataverse: "Dataverse",
  erp: "ERP",
  copilot: "Copilot",
  web: "Web",
})

/** Servisin iç kimliği ("graph" · "dataverse" · "erp" · "copilot" · "web"). */
export type ServiceId = keyof typeof SERVICES

/**
 * Neden kodu: kişisel veri taşımayan tek satır, parçalar " · " ile ("Graph · HTTP 403 ·
 * ErrorAccessDenied"). Boş dize = kod yok. Her yerde `detail` diye taşınır.
 */
export type CauseCode = string

/** İstenen Graph kapsamları; yalnız `SCOPE` biçimindekiler koda girer. */
export type Scopes = readonly unknown[] | null | undefined

/** Servisin hata nesnesi (Graph, Dataverse, ERP): `{ code, message }`; Graph'ta ileti nesne olabilir. */
export interface ServiceError {
  code?: unknown
  message?: string | { value?: string } | null
}

/** Ayrıştırılmış hata gövdesi; MSAL belirteç ucunda `error` dize, açıklaması `error_description`. */
export interface ErrorBody {
  error?: ServiceError | string | null
  error_description?: string
}

/** ERP'nin (F&O, Dataverse) hata gövdesi. */
export interface ErpErrorBody {
  error?: { code?: string; message?: string } | null
}

/**
 * Atılan hatanın okunan alanları: `Error`, MSAL `AuthError` (`errorCode`, `errorMessage`,
 * `subError`) ya da kendi kodunu taşıyan hata (`detail`). Hepsi isteğe bağlı: her değer atılabilir.
 */
export interface ThrownLike {
  name?: unknown
  message?: unknown
  detail?: unknown
  errorCode?: unknown
  errorMessage?: unknown
  subError?: unknown
}

/** Graph sonucunun koda giren alanları (`lib/graphRequest` › `GraphResult`). */
export interface ResultLike {
  status?: string
  detail?: string
  httpStatus?: number
  code?: string
  error?: string
}

// Atılan değerin alanları isteğe bağlı zincirle okunur: ilkel değerde de hepsi `undefined`.
const thrown = (err: unknown) => err as ThrownLike | null | undefined

// F&O sanal tablosunun adı (ör. BoraxAllowanceTransSelfServiceEntity): hangi tabloda takıldığı.
export const ENTITY = /\b([A-Z][A-Za-z0-9]{2,}Entity)\b/
export const PRIVILEGE = /\b(prv[A-Za-z0-9_]+)\b/
const AADSTS = /AADSTS\d+/
// Servisin hata kodu: Graph "ErrorAccessDenied", Dataverse "0x80040220". Başka biçim koda girmez.
const SAFE_CODE = /^[\w.-]{1,64}$/
const SCOPE = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/
const NETWORK = /failed to fetch|networkerror|load failed|network request failed|network error/i

/**
 * Servis iletisinin kişisel veriden arındırılmış kısası: bağlantı, belirteç, e-posta, GUID,
 * tırnak içi değer, uzun opak değer ve uzun sayı (sicil, kayıt no.) "…" olur; en çok 140
 * karakter. "Access denied" gibi cümle BT'ye ipucu verir.
 */
export function shortMessage(message: unknown): string {
  return String(message ?? "")
    .replace(/https?:\/\/\S+/gi, "…")
    .replace(/\beyJ[\w-]{8,}(\.[\w-]+){0,2}/g, "…")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "…")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "…")
    .replace(/'[^']*'|"[^"]*"/g, "'…'")
    .replace(/[A-Za-z0-9+/_=-]{48,}/g, "…")
    .replace(/\d{5,}/g, "…")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140)
}

const offline = () => globalThis.navigator?.onLine === false

/** İstenen Graph kapsamlarından koda girebilenler ("scope Mail.Read,Tasks.ReadWrite"). */
function scopePart(scopes: Scopes): string | null {
  const names = (scopes ?? [])
    .filter((s): s is string => typeof s === "string" && SCOPE.test(s))
    .slice(0, 4)
  return names.length ? `scope ${names.join(",")}` : null
}

/** Parçaları " · " ile birleştirir; boş ve yinelenen parça düşer, kod en çok 220 karakter. */
function join(parts: unknown[]): CauseCode {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    const text = String(part ?? "").trim()
    if (!text || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    out.push(text)
  }
  return out.join(" · ").slice(0, 220)
}

/**
 * Servisin HTTP cevabı → kod. `body`: ayrıştırılmış JSON (Graph ve Dataverse `{ error: { code,
 * message } }`) ya da null. `scopes` yalnız 401/403'te koda girer: reddedilen çağrı hangi
 * kapsamı istemişti.
 */
export function httpCause(
  service: ServiceId,
  status: number | null | undefined,
  body: ErrorBody | null | undefined,
  scopes?: Scopes,
): CauseCode {
  const err = body?.error
  // Dize `error`in alanı yok: nesne değilse alanları `undefined` (eski `err?.message` ile aynı).
  const obj = typeof err === "object" ? err : null
  const msg = obj?.message
  const raw =
    (typeof msg === "object" ? msg?.value : undefined) ?? msg ?? body?.error_description ?? err
  const message = typeof raw === "string" ? raw : ""
  const code = typeof obj?.code === "string" && SAFE_CODE.test(obj.code) ? obj.code : ""
  const denied = status === 401 || status === 403
  const short = shortMessage(message)
  return join([
    SERVICES[service],
    status ? `HTTP ${status}` : null,
    code,
    PRIVILEGE.exec(message)?.[1],
    denied ? scopePart(scopes) : null,
    ENTITY.exec(message)?.[1],
    short === code ? null : short,
  ])
}

/**
 * Atılan hata → kod: MSAL (`errorCode`, AADSTS, `subError`), ağ ("Failed to fetch", çevrimdışı),
 * zaman aşımı (`AbortError`/`TimeoutError`), kendi kodunu taşıyan hata (`err.detail`) ve ne
 * olduğu bilinmeyen `Error` (iletisinde HTTP durumu varsa o). `scopes`: MSAL'da eksik kapsam.
 */
export function errorCause(service: ServiceId, error: unknown, scopes?: Scopes): CauseCode {
  const err = thrown(error)
  if (typeof err?.detail === "string" && err.detail) return err.detail
  const name = String(err?.name ?? "")
  const message = String(err?.message ?? "")
  const head = SERVICES[service]
  if (name === "AbortError" || name === "TimeoutError") return join([head, "timeout"])
  if (err?.errorCode) {
    const text = [err.errorMessage, err.subError, message].filter(Boolean).join(" ")
    const sub = typeof err.subError === "string" && SAFE_CODE.test(err.subError) ? err.subError : ""
    return join([head, err.errorCode, sub, AADSTS.exec(text)?.[0], scopePart(scopes)])
  }
  if (NETWORK.test(message)) {
    return join([head, offline() ? "offline" : "network", shortMessage(message)])
  }
  const status = /(?:status|HTTP)\s*:?\s*(\d{3})\b/i.exec(message)?.[1]
  return join([head, status ? `HTTP ${status}` : shortMessage(message)])
}

/** Çevrimdışıyken ya da ağ koptuğunda `fetch`in düştüğü durum için kod. */
export const networkCause = (service: ServiceId, message: unknown = ""): CauseCode =>
  join([SERVICES[service], offline() ? "offline" : "network", shortMessage(message)])

// — Self Servis (ERP): servis adı olmayan eski biçim; `causeOf` bunları ERP'nin sayar. —

/** MSAL hatası → "consent_required · AADSTS65001" (kod yoksa "unknown"). */
export function erpAuthCause(error: unknown): CauseCode {
  const err = thrown(error)
  const text = [err?.errorMessage, err?.subError, err?.message].filter(Boolean).join(" ")
  const parts = [err?.errorCode, AADSTS.exec(text)?.[0]].filter(Boolean)
  return [...new Set(parts)].join(" · ") || "unknown"
}

/** ERP'nin 401/403 cevabı → "HTTP 403 · 0x80040220 · prvReadmserp_tryaiworkersentity". */
export function erpDeniedCause(status: number, body: ErpErrorBody | null | undefined): CauseCode {
  const code = body?.error?.code
  const privilege = PRIVILEGE.exec(body?.error?.message ?? "")?.[1]
  return [`HTTP ${status}`, code, privilege].filter(Boolean).join(" · ")
}

/**
 * ERP'nin 401/403 DIŞINDAKİ cevabı → "HTTP 500 · 0x80060891 · BoraxAllowanceTransSelfServiceEntity ·
 * <kısa ileti>". Sanal tabloda F&O'nun yetki hatası 400/500 gelebiliyor: kod ve ileti olmadan
 * ekranda yalnız "okunamadı" kalıyordu.
 */
export function erpErrorCause(status: number, body: ErpErrorBody | null | undefined): CauseCode {
  const message = body?.error?.message ?? ""
  return [`HTTP ${status}`, body?.error?.code, ENTITY.exec(message)?.[1], shortMessage(message)]
    .filter(Boolean)
    .join(" · ")
}

/**
 * Graph sonucu (`lib/graph.ts`) → kod; `where`: hangi çağrı düştü ("lists" · "tasks"). Sonuç
 * kodunu taşıyorsa o; taşımıyorsa HTTP durumu ve servis kodundan "Graph · HTTP 400 · invalidRequest".
 */
export function resultCause(res: ResultLike | null | undefined, where = ""): CauseCode {
  if (!res) return ""
  if (res.detail) return [res.detail, where].filter(Boolean).join(" · ")
  // Ham hata metni kişisel veri taşıyabilir (adres, ad): koda yalnız süzülmüş hâli girer.
  const head = res.httpStatus
    ? `HTTP ${res.httpStatus}`
    : shortMessage(res.error) || res.status || ""
  const code = res.httpStatus && res.code ? ` · ${res.code}` : ""
  return `Graph · ${head}${code}${where ? ` · ${where}` : ""}`
}

// — Tembel girişler: ilk paketteki çağıranlar açıklama yarısını hata olunca indirir. —

/** Açıklama yarısı (`lib/causeText`). `waitMs`: yavaş ağda bu kadar beklenir, sonra vazgeçilir. */
export function loadCauseText(waitMs?: number): Promise<CauseTextModule> {
  const load = import("@/lib/causeText")
  if (!waitMs) return load
  return Promise.race([load, new Promise<never>((_, reject) => setTimeout(reject, waitMs))])
}

/**
 * `causeNote`un tembel hâli. Açıklama inmezse (ağ yok) yalnız etiket ve kod döner (cümle yok);
 * servis adından başka bir şey yoksa not da yok.
 */
export async function causeNoteLazy(
  t: Translate,
  service: ServiceId,
  err: unknown,
  scopes?: Scopes,
): Promise<string | undefined> {
  try {
    const { causeNote } = await loadCauseText()
    return causeNote(t, service, err, scopes)
  } catch {
    const code = errorCause(service, err, scopes)
    return code.includes(" · ") ? `${t("cause.code")} ${code}` : undefined
  }
}
