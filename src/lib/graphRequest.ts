import { kindOfStatus, kindOfSuccess, recordGraphOutcome } from "@/lib/serviceHealth"
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"
import { ensureMsalInitialized } from "@/lib/msal"
import { errorCause, httpCause } from "@/lib/errorCause"
import { loopTripped } from "@/lib/loopGuard"
import type { CauseCode, ThrownLike } from "@/lib/errorCause"

/**
 * Graph isteğinin TEK iskeleti: sessiz belirteç → fetch → hatayı durum ve neden koduna çevirme →
 * fiile göre yeniden deneme. `lib/graph`taki fiil işlevleri (graphGet, graphPost…) ve kendi
 * fetch'ini yazan kancalar buradan geçer; kural bir yerde değişir.
 *
 * Asla fırlatmaz: her sonuç `{ status, … }` (bkz. `lib/graph` başındaki iki kural).
 */

export const GRAPH_BASE = "https://graph.microsoft.com/v1.0"
const GRAPH_ORIGIN = "https://graph.microsoft.com"

export const STATUS = {
  ready: "ready",
  denied: "denied",
  error: "error",
  unauthenticated: "unauthenticated",
} as const

export type GraphStatus = (typeof STATUS)[keyof typeof STATUS]
export type GraphMethod = "GET" | "POST" | "PATCH" | "DELETE"
/** Başarılı gövdenin biçimi (`readBody`); varsayılan `json`. */
export type GraphRead = "json" | "jsonOrNull" | "null" | "none" | "blob" | "arrayBuffer"

/** Başarı. `data`: `json` · `jsonOrNull` · `null` · `arrayBuffer`te; `blob` yalnız `blob`ta. */
export interface GraphReady<T> {
  status: typeof STATUS.ready
  data?: T | null
  blob?: Blob
}

/**
 * Başarısızlık; `detail` her birinde neden kodu (`lib/errorCause`).
 * - `unauthenticated`: oturum (instance/account) yok, istek gitmedi.
 * - `denied` + `httpStatus` yok: belirteç alınamadı, `error` MSAL kodu (`tokenDenied`).
 * - `denied` + `httpStatus` (401/403): Graph reddetti, `code` Graph'ın hata kodu.
 * - `error`: HTTP hatası (`httpStatus`, `code`, `error` Graph'ın cümlesi) ya da ağ / gövde
 *   okunamadı (`error` ham ileti ya da "parse" · "read").
 */
export type GraphFailure =
  | { status: typeof STATUS.unauthenticated }
  | { status: typeof STATUS.denied; error: string; detail: CauseCode; httpStatus?: undefined }
  | { status: typeof STATUS.denied; httpStatus: number; code: string; detail: CauseCode }
  | {
      status: typeof STATUS.error
      error: string
      detail: CauseCode
      httpStatus?: number
      code?: string
    }

/** Graph isteğinin sonucu: asla fırlatılmaz, her durum `status` taşır. */
export type GraphResult<T = unknown> = GraphReady<T> | GraphFailure

export interface GraphRequestOptions {
  method?: GraphMethod
  /** `GRAPH_BASE` altı yol ya da mutlak adres (`@odata.nextLink`). */
  path: string
  /** Yalnız SESSİZCE istenir. */
  scopes: string[]
  /** Ek başlıklar (ConsistencyLevel, Prefer, If-Match…). */
  headers?: Record<string, string>
  /** POST/PATCH gövdesi (JSON'a çevrilir; `contentType` verilirse dize olarak olduğu gibi gider). */
  body?: unknown
  /** Ham gövdenin türü (OneNote sayfa oluşturma `text/html` ister). */
  contentType?: string
  /** Geçici hatada kaç kez yeniden denensin (varsayılan 0). */
  retry?: number
  /**
   * İstek başına süre sınırı (ms; yok = tarayıcının kendi sınırı, Safari'de dakikayı bulur). Gövdenin
   * okunması da kapsanır. Aşılırsa `error` + `detail: "Graph · timeout"`; zaman aşımı YENİDEN
   * DENENMEZ (aynı beklemeyi ikiye katlar). İstisna posta kutusu okumaları: verilmezse To Do 8 sn,
   * öteki JSON okumaları 45 sn ve bir kez yeniden (`TODO_READ_TIMEOUT_MS`, `MAILBOX_READ_TIMEOUT_MS`).
   */
  timeoutMs?: number
  read?: GraphRead
  /** Belirteç hatasını konsola yazma. */
  quiet?: boolean
}

/** MSAL örneği ve hesabı; ikisinden biri yoksa istek gitmez (`unauthenticated`). */
export type MsalInstance = IPublicClientApplication | null | undefined
export type MsalAccount = AccountInfo | null | undefined

type RetryPolicy = { statuses: Set<number>; network: boolean }

/**
 * Belirteç hiç alınamadı mı (istek gitmedi; `error` MSAL kodu). HTTP 401/403'ten ayrı: onlar
 * belirteç vardı ama Graph reddetti demek.
 */
export const tokenDenied = (r: { status: string; httpStatus?: number }): boolean =>
  r.status === STATUS.denied && !r.httpStatus

/** Kalıcı "onay yok" MSAL kodları: oturum boyu yeniden sormaya değmez. */
export const CONSENT_CODES = /interaction_required|consent_required|login_required|invalid_grant/

/** Geçici sayılan HTTP kodları — yeniden denemeye değer. */
const TRANSIENT = new Set([429, 502, 503, 504])
const ONLY_THROTTLE = new Set([429])
const RETRY_CAP_MS = 8000

/**
 * Fiile göre yeniden deneme. GET ve PATCH aynı gövdeyle tekrarlanınca aynı sonucu verir
 * (idempotent): geçici hataların hepsinde ve ağ hatasında denenir. POST ve DELETE YALNIZ 429'da:
 * kısıtlama cevabı isteğin işlenmediğini söylüyor; 503/504'te sunucu işi yapmış olabilir —
 * POST'u tekrarlamak aynı kaydı iki kez yaratır (To Do'da çift görev), DELETE'i tekrarlamak 404
 * döndürüp "silinemedi" gösterir.
 */
const RETRY_ON: Record<GraphMethod, RetryPolicy> = {
  GET: { statuses: TRANSIENT, network: true },
  PATCH: { statuses: TRANSIENT, network: true },
  POST: { statuses: ONLY_THROTTLE, network: false },
  DELETE: { statuses: ONLY_THROTTLE, network: false },
}

/**
 * Graph'ın hata gövdesi: `{ error: { code, message } }`. Okunamazsa boş.
 * Teşhisin tek kaynağı bu — "HTTP 400" tek başına NEYİN reddedildiğini
 * söylemiyor, `invalidRequest: Invalid filter clause` söylüyor.
 */
async function readGraphError(res: Response): Promise<{ code: string; message: string }> {
  try {
    const j = (await res.json()) as { error?: { code?: string; message?: string } } | null
    return { code: j?.error?.code ?? "", message: j?.error?.message ?? "" }
  } catch {
    return { code: "", message: "" }
  }
}

/**
 * Yeniden denemeden önce beklenecek süre. Graph 429'da `Retry-After`
 * (saniye) gönderiyor; tarayıcı onu CORS yüzünden okuyamayabilir, o zaman
 * artan bekleme (1 sn, 2 sn…) + biraz rastgelelik — aynı anda düşen iki
 * isteğin aynı anda yeniden çarpışmaması için.
 */
function retryDelayMs(res: Response | null, attempt: number): number {
  const header = Number(res?.headers?.get?.("Retry-After"))
  const base = Number.isFinite(header) && header > 0 ? header * 1000 : 1000 * 2 ** attempt
  return Math.min(base + Math.random() * 250, RETRY_CAP_MS)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Belirteç alınamadı → `denied`. `error`: MSAL kodu; `detail`: ekranda neden kodu
 * (`lib/errorCause`; eksik kapsam adı dahil).
 *
 * Yutulmaz, loglanır: `consent_required` kimse izni onaylamamış demek;
 * `interaction_required` / `login_required` / `invalid_grant` çoğu kez izin onaylı ama bu
 * tarayıcının oturumu ondan eski demek — gizli iframe yenilemesi üçüncü taraf çerez kuralına
 * takılıyor, yalnız yeniden giriş düzeltir. `quiet`: sonucu kendisi yorumlayan kanca (avatar
 * başına istek) konsolu doldurmasın.
 */
function tokenFail(error: unknown, scopes: string[], quiet?: boolean): GraphFailure {
  const err = error as ThrownLike | null | undefined
  // MSAL `errorCode` ve `Error.name` dize.
  const code = (err?.errorCode ?? err?.name ?? "interaction_required") as string
  if (!quiet) {
    console.warn(
      `[graph] silent token for ${scopes.join(", ")} failed: ${code}`,
      err?.message ?? "",
    )
  }
  return { status: STATUS.denied, error: code, detail: errorCause("graph", err, scopes) }
}

/** İstek hiç gitmedi (ağ, çevrimdışı, zaman aşımı): `error` ham ileti, `detail` neden kodu. */
const netFail = (err: unknown): GraphFailure => ({
  status: STATUS.error,
  error: ((err as ThrownLike | null | undefined)?.message ?? "network") as string,
  detail: errorCause("graph", err),
})

/** Süre sınırı (`timeoutMs`) doldu: neden kodu `errorCause`un zaman aşımı kodu. */
const timeoutFail = (): GraphFailure => ({
  status: STATUS.error,
  error: "timeout",
  detail: errorCause("graph", { name: "TimeoutError" }),
})

/**
 * Başarısız HTTP cevabı → 401/403 `denied`, ötekiler `error`. `code` ve `error` Graph'ın kendi
 * hata kodu ve cümlesi; `detail` kişisel veri içermeyen kısa neden kodu (HTTP durumu, kod, kapsam).
 */
async function httpFail(res: Response, scopes: string[]): Promise<GraphFailure> {
  const { code, message } = await readGraphError(res)
  const denied = res.status === 401 || res.status === 403
  const detail = httpCause("graph", res.status, { error: { code, message } }, scopes)
  if (denied) return { status: STATUS.denied, httpStatus: res.status, code, detail }
  return { status: STATUS.error, httpStatus: res.status, code, error: message, detail }
}

/**
 * Başarılı cevabın gövdesi, istenen biçimde. Biçim farkı cevabın ŞEKLİNDE olduğu için ayrı:
 * `none` (202 sendMail boş gövde — JSON'a çevirmek başarıyı "parse hatası" sayardı),
 * `jsonOrNull` (PATCH: bazı uçlar 200 + gövde, bazıları 204), `null` (DELETE), `blob` (ek,
 * fotoğraf), `arrayBuffer` (dosyanın ikili içeriği).
 */
async function readBody(res: Response, read: GraphRead): Promise<GraphResult> {
  switch (read) {
    case "none":
      return { status: STATUS.ready }
    case "null":
      return { status: STATUS.ready, data: null }
    case "jsonOrNull":
      if (res.status === 204) return { status: STATUS.ready, data: null }
      try {
        return { status: STATUS.ready, data: await res.json() }
      } catch {
        return { status: STATUS.ready, data: null }
      }
    case "blob":
      try {
        return { status: STATUS.ready, blob: await res.blob() }
      } catch {
        return { status: STATUS.error, error: "read", detail: "Graph · read" }
      }
    case "arrayBuffer":
      try {
        return { status: STATUS.ready, data: await res.arrayBuffer() }
      } catch (err) {
        return netFail(err)
      }
    default:
      try {
        return { status: STATUS.ready, data: await res.json() }
      } catch {
        return { status: STATUS.error, error: "parse", detail: "Graph · parse" }
      }
  }
}

/** fetch'in ikinci argümanı: GET'te yalnız başlık, gövdeli fiillerde JSON + Content-Type. */
function requestInit(
  method: GraphMethod,
  token: string,
  headers: Record<string, string>,
  body: unknown,
  contentType?: string,
): RequestInit {
  if (method === "GET") return { headers: { Authorization: `Bearer ${token}`, ...headers } }
  if (method === "DELETE")
    return { method, headers: { Authorization: `Bearer ${token}`, ...headers } }
  const type = contentType ?? "application/json"
  return {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": type, ...headers },
    body: contentType ? String(body) : JSON.stringify(body),
  }
}

type Gate = <R>(run: () => Promise<R>) => Promise<R>

/**
 * Aynı anda en çok `slots` istek uçar, gerisi sırada bekler. Boşalan yer doğrudan sıradakine
 * devredilir (araya kimse giremez). Cevabı hiç gelmeyen istek sırayı kilitlemesin diye yer
 * `leaseMs` sonra yine devredilir (istek sürer, yalnız sıradaki beklemez). `onIdle`: son iş bitti.
 */
function createGate(slots: number, onIdle?: () => void, leaseMs = 15_000): Gate {
  let active = 0
  const queue: (() => void)[] = []
  const handOver = () => {
    const next = queue.shift()
    if (next) next()
    else if ((active -= 1) === 0) onIdle?.()
  }
  return async (run) => {
    if (active < slots) active += 1
    else await new Promise<void>((resolve) => queue.push(resolve))
    let held = true
    const free = () => {
      if (!held) return
      held = false
      handOver()
    }
    const lease = setTimeout(free, leaseMs)
    try {
      return await run()
    } finally {
      clearTimeout(lease)
      free()
    }
  }
}

// Posta kutusu (posta, takvim, To Do, kişiler): Exchange bir uygulamadan bir posta kutusuna aynı anda en
// çok 4 istek kabul ediyor; fazlası 429 ve ~8 sn `Retry-After`. Keşfet açılışında akış, işaretliler,
// takvim ve kartlar birlikte 7 istek atıyordu: işaretliler 9–10. saniyede gelip akışın tepesine
// giriyor, her şeyi itiyordu. To Do da aynı kutuda (Anasayfa'da odak kartı, Ufukta ve görev
// widget'ları listeleri birlikte tarıyor). Sınır kutu başına: paylaşılan takvimlerde her kişinin kutusu kendi
// sırasında. Kapı işi bitince silinir — iş arkadaşının adresi bellekte birikmez.
const MAILBOX =
  /\/(me|users\/[^/?]+)\/(messages|mailFolders|events|calendar|calendars|calendarView|calendarGroups|contacts|contactFolders|mailboxSettings|outlook|inferenceClassification|findMeetingTimes|sendMail)\b/
const MAILBOX_SLOTS = 4
// To Do kendi sırasında: To Do servisi takılınca (ölçüldü: aynı okuma bir kez 0,35 sn, hemen
// ardından 25 sn'de bile dönmedi) asılı görev okumaları posta kutusunun dört yerini tutuyor, takvim,
// posta ve onlara bağlı her kart (brifing, sıradaki toplantı, sahne geçişi) bekliyordu.
export const TODO = /\/(me|users\/[^/?]+)\/todo\b/
const TODO_SLOTS = 2
// Görev OKUMASI 8 sn'de dönmezse bırakılır ve bir kez daha istenir (takılma çoğu zaman geçici);
// yazma süre sınırsız kalır — yeniden denenen bir oluşturma görevi iki kez yazabilirdi.
export const TODO_READ_TIMEOUT_MS = 8_000
// Posta kutusunun öteki JSON okumaları (posta, takvim, ayarlar) da sonsuza dek asılı kalmasın: aynı
// akşam `mailboxSettings` 20 sn'de dönmedi. Ama sınır YAVAŞ CEVABI KESMEMELİ: kesinti sürerken takvim
// 16 sn'de geliyordu ve 15 sn'lik ilk sınır onu her denemede kesip kartı hiç doldurmuyordu. Sırayı
// bekletmemek kapının işi (yer 15 sn sonra devredilir); bu sınır yalnız ölü isteği bitirir. Dosya
// indirmeleri (`read` json değil) sınırsız.
export const MAILBOX_READ_TIMEOUT_MS = 45_000
const gates = new Map<string, Gate>()

function gateFor(url: string): Gate | null {
  const todo = TODO.exec(url)
  const owner = (todo ?? MAILBOX.exec(url))?.[1].toLowerCase()
  if (!owner) return null
  const key = `${todo ? "todo" : "mail"}:${owner}`
  let gate = gates.get(key)
  if (!gate) {
    gate = createGate(todo ? TODO_SLOTS : MAILBOX_SLOTS, () => gates.delete(key))
    gates.set(key, gate)
  }
  return gate
}

/*
 * Uçuştaki aynı okumaya bağlanma. Anasayfa'da birbirinden habersiz kartlar aynı şeyi aynı anda
 * soruyordu (ölçüldü: gelen kutusu aynı milisaniyede iki kez, okunmamış sayısı yarım saniyede üç
 * kez, To Do listeleri iki kez). Aynı hesap + aynı JSON okuması uçuştayken ikinci çağrı yeni
 * istek atmaz, ilkinin cevabının KOPYASINI alır (biri veriyi değiştirirse öteki etkilenmesin).
 * Arada bir yazma başladı ya da bittiyse (`writeEpoch`) bağlanılmaz: yazmadan önce başlamış okuma
 * yazmanın sonucunu göstermeyebilir. Önbellek DEĞİL: cevap gelince kayıt silinir.
 */
let writeEpoch = 0
const inflightReads = new Map<string, { epoch: number; job: Promise<GraphResult<unknown>> }>()

function readKey(account: MsalAccount, opts: GraphRequestOptions): string | null {
  if ((opts.method ?? "GET") !== "GET" || (opts.read ?? "json") !== "json" || !account) return null
  const { path, scopes, headers, retry, timeoutMs } = opts
  return JSON.stringify([account.homeAccountId, path, scopes, headers ?? {}, retry ?? 0, timeoutMs])
}

function copyOf<T>(res: GraphResult<T>): GraphResult<T> {
  try {
    return structuredClone(res)
  } catch {
    return res
  }
}

/**
 * Tek Graph isteği. `T`: başarılı JSON gövdesinin çağıranca beklenen şekli (doğrulanmaz). Aynı
 * okuma uçuştaysa ona bağlanır (yukarıda).
 */
export async function graphRequest<T = unknown>(
  instance: MsalInstance,
  account: MsalAccount,
  opts: GraphRequestOptions,
): Promise<GraphResult<T>> {
  const key = readKey(account, opts)
  if (!key) {
    if ((opts.method ?? "GET") === "GET") return sendRequest<T>(instance, account, opts)
    writeEpoch += 1
    try {
      return await sendRequest<T>(instance, account, opts)
    } finally {
      writeEpoch += 1
    }
  }
  const flying = inflightReads.get(key)
  if (flying && flying.epoch === writeEpoch) return copyOf((await flying.job) as GraphResult<T>)
  const job = sendRequest<T>(instance, account, opts) as Promise<GraphResult<unknown>>
  const entry = { epoch: writeEpoch, job }
  inflightReads.set(key, entry)
  try {
    return (await job) as GraphResult<T>
  } finally {
    if (inflightReads.get(key) === entry) inflightReads.delete(key)
  }
}

/** Yazma sayacı: başka modüllerin uçuştaki işleri (To Do taraması) de yazmadan sonra bağlanmasın. */
export const graphWriteEpoch = (): number => writeEpoch

async function sendRequest<T>(
  instance: MsalInstance,
  account: MsalAccount,
  opts: GraphRequestOptions,
): Promise<GraphResult<T>> {
  const {
    method = "GET",
    path,
    scopes,
    headers = {},
    body,
    contentType,
    retry = 0,
    read = "json",
    quiet,
  } = opts
  // To Do okuması kendiliğinden süre sınırlı ve zaman aşımında bir kez yeniden denenir.
  const plainRead = method === "GET" && opts.timeoutMs == null && read === "json"
  const todoRead = plainRead && TODO.test(path)
  const mailRead = plainRead && !todoRead && MAILBOX.test(path)
  const timeoutMs = todoRead
    ? TODO_READ_TIMEOUT_MS
    : mailRead
      ? MAILBOX_READ_TIMEOUT_MS
      : opts.timeoutMs
  let timeoutsLeft = todoRead || mailRead ? 1 : 0
  if (!instance || !account) return { status: STATUS.unauthenticated }
  // Mutlak adres yalnız Graph'ın kendisi olabilir (`@odata.nextLink`): token başka bir adrese
  // gitmesin (docs/deployment.md › Güvenlik başlıkları).
  if (/^https?:/i.test(path) && !path.startsWith(`${GRAPH_ORIGIN}/`))
    return { status: STATUS.error, error: "foreignUrl", detail: "Graph · foreign URL" }
  // Döngü sigortası (`lib/loopGuard`): durdurulan çağrı kısıtlama gibi döner — çağıran önbelleğe
  // yazmaz, sonra yeniden dener; döngü sürdükçe sigorta kapalı kalır.
  if (loopTripped(method, path, body))
    return {
      status: STATUS.error,
      error: "loopGuard",
      code: "loopGuard",
      httpStatus: 429,
      detail: httpCause("graph", 429, null),
    }

  let token: string
  try {
    await ensureMsalInitialized()
    const resp = await instance.acquireTokenSilent({ scopes, account })
    token = resp.accessToken
  } catch (err) {
    return tokenFail(err, scopes, quiet)
  }

  // `path` mutlak olabilir: `@odata.nextLink` tam URL döner ve onu tekrar
  // GRAPH_BASE'e eklemek bozuk bir adres üretirdi.
  const url = /^https?:/i.test(path) ? path : `${GRAPH_BASE}${path}`
  const policy = RETRY_ON[method] ?? RETRY_ON.POST
  for (let attempt = 0; ; attempt += 1) {
    // Cevap gövdesiyle birlikte okunur ve kapının İÇİNDE: yer cevap tamamen inince boşalır.
    // Başlık gelince boşaltmak, gövdesi hâlâ inen istekle sıradakini Exchange'in gözünde üst
    // üste bindiriyordu — sayfa içinde 4 sanılan, sunucuda 5 oluyordu (429).
    const exchange = async (): Promise<{ result: GraphResult<T> } | { again: Response }> => {
      // Süre sınırı gövdenin okunmasını da kapsar: başlık gelip gövde takılırsa da kesilir.
      const ctl = timeoutMs ? new AbortController() : null
      let timedOut = false
      const timer = ctl
        ? setTimeout(() => {
            timedOut = true
            ctl.abort()
          }, timeoutMs)
        : undefined
      // Microsoft 365 durumu (`lib/serviceHealth`): yalnız ağda geçen süre — sırada bekleme değil.
      const started = Date.now()
      try {
        const init = requestInit(method, token, headers, body, contentType)
        const res = await fetch(url, ctl ? { ...init, signal: ctl.signal } : init)
        // DELETE'te 404 de başarı: silinmek istenen şey zaten yok.
        if (res.ok || (method === "DELETE" && res.status === 404)) {
          const result = (await readBody(res, read)) as GraphResult<T>
          recordGraphOutcome(url, timedOut ? "timeout" : kindOfSuccess(Date.now() - started))
          return { result: timedOut ? timeoutFail() : result }
        }
        recordGraphOutcome(url, kindOfStatus(res.status))
        if (attempt < retry && policy.statuses.has(res.status)) return { again: res }
        return { result: await httpFail(res, scopes) }
      } catch (err) {
        // İptal bizim sınırımızdan: ağ hatası gibi yeniden denenmez.
        if (timedOut) {
          recordGraphOutcome(url, "timeout")
          return { result: timeoutFail() }
        }
        // Çevrimdışıyken Microsoft'un sağlığı hakkında bir şey bilinmez.
        if (typeof navigator === "undefined" || navigator.onLine !== false)
          recordGraphOutcome(url, "server")
        throw err
      } finally {
        if (timer) clearTimeout(timer)
      }
    }
    let out: { result: GraphResult<T> } | { again: Response }
    try {
      // Her denemede yeniden: bekleme sırasında boşalıp silinen kapı yeniden kurulur.
      const gate = gateFor(url)
      out = await (gate ? gate(exchange) : exchange())
    } catch (err) {
      // CORS başlığı taşımayan bir kısıtlama cevabı da buraya düşüyor
      // (tarayıcı onu `TypeError: Failed to fetch` olarak veriyor).
      if (policy.network && attempt < retry) {
        await wait(retryDelayMs(null, attempt))
        continue
      }
      return netFail(err)
    }
    if ("result" in out) {
      if (
        out.result.status === STATUS.error &&
        out.result.error === "timeout" &&
        timeoutsLeft > 0
      ) {
        timeoutsLeft -= 1
        continue
      }
      return out.result
    }
    // Bekleme kapının DIŞINDA: kısıtlanan istek yer tutarak sırayı durdurmaz.
    await wait(retryDelayMs(out.again, attempt))
  }
}
