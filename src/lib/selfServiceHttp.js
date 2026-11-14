import { hrRequest, HR_DATAVERSE_URL, msalInstance } from "@/lib/msal"
import { erpAuthCause, erpDeniedCause, erpErrorCause } from "@/lib/errorCause"
import { suspectSession } from "@/lib/sessionHealth"

/**
 * Self Servis — ERP'nin Dataverse'üne tarayıcıdan istek (kişinin KENDİ oturumuyla, `hrRequest`
 * kapsamı). Kişisel ve ekip sorguları (`selfServiceApi.js`, `selfServiceTeamApi.js`) bunu
 * paylaşır. Belirteç ve yanıt loglanmaz.
 */

const API = `${HR_DATAVERSE_URL}/api/data/v9.2`

// Süzgeç parçaları saf modülde (sorgu kurucuları MSAL'siz test edilsin); eski çağıranlar için buradan da.
export { anyOf, CHUNK, chunks, quote } from "@/lib/selfServiceOdata"

export class SelfServiceError extends Error {
  constructor(kind, detail) {
    super(detail || kind)
    this.kind = kind // "denied" | "error"
  }
}

// İlk açılışta geçici hata olabiliyor (zaman aşımı, ağ; F&O sanal tabloları yavaş uyanıyor):
// kalıcı olmayan hatada bir kez daha denenir — kişi boş ekran ya da "Bağlan" görmesin. Süresi dolan
// yenileme belirteci kalıcıdır: beklemek bir şey çözmez, kişi "Bağlan"ı bir an önce görsün.
const RETRY_MS = 1200
const PERMANENT =
  /consent_required|interaction_required|login_required|invalid_grant|refresh_token_expired|no_tokens_found/
const POPUP_BLOCKED = /popup_window_error|empty_window_error/
const TRANSIENT_HTTP = new Set([502, 503, 504])
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const silent = async (account) =>
  (await msalInstance.acquireTokenSilent({ ...hrRequest, account })).accessToken

/**
 * "Bağlan" (kişinin tıklaması): Microsoft penceresi HEMEN açılır. Önce sessiz denenirse (iki deneme
 * + bekleme, gizli çerçeve zaman aşımıyla saniyeler sürer) tarayıcı tıklamayı eskimiş sayıp pencereyi
 * engelliyor ve düğme sessizce hiçbir şey yapmıyordu (canlıda görüldü: `refresh_token_expired`).
 * Pencere yine de engellenirse tam sayfa yönlendirmeye düşülür (`lib/graph` › `requestGraphScopes`
 * ile aynı kural): dönüşte kişi aynı sayfaya gelir. Vazgeçen kişi yönlendirilmez.
 */
async function connect(account) {
  try {
    return (await msalInstance.acquireTokenPopup({ ...hrRequest, account })).accessToken
  } catch (popupErr) {
    if (!POPUP_BLOCKED.test(popupErr?.errorCode ?? ""))
      throw new SelfServiceError("denied", erpAuthCause(popupErr))
    try {
      await msalInstance.acquireTokenRedirect({
        ...hrRequest,
        account,
        redirectStartPage: window.location.href,
      })
    } catch (redirectErr) {
      throw new SelfServiceError("denied", erpAuthCause(redirectErr))
    }
    // Sayfa ayrılıyor: buradan dönülmez; ayrılana dek kart "pencere" nedenini gösterir.
    throw new SelfServiceError("denied", erpAuthCause(popupErr))
  }
}

export async function token(interactive = false) {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  if (!account) throw new SelfServiceError("denied", "no account")
  if (interactive) return connect(account)
  try {
    return await silent(account)
  } catch (first) {
    let err = first
    if (!PERMANENT.test(first?.errorCode ?? "")) {
      await wait(RETRY_MS)
      try {
        return await silent(account)
      } catch (again) {
        err = again
      }
    }
    // Oturum dolduysa her sayfadaki tek şerit açılır (tek tık, çoğu zaman şifresiz geri döner).
    suspectSession(msalInstance, Date.now(), undefined, err)
    // Hata kodu ekranda görünür (`StateDetail`): izin mi, ek doğrulama mı, pencere mi — ayırt edilsin.
    throw new SelfServiceError("denied", erpAuthCause(err))
  }
}

const query = (params) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&")

/** Geçici sunucu hatası (502/503/504) ya da ağ kopmasında bir kez daha. */
async function fetchRetry(url, init) {
  try {
    const res = await fetch(url, init)
    if (!TRANSIENT_HTTP.has(res.status)) return res
  } catch (err) {
    if (err?.name === "AbortError") throw err
  }
  await wait(RETRY_MS)
  return fetch(url, init)
}

async function page(auth, url) {
  const res = await fetchRetry(url, {
    headers: {
      Authorization: `Bearer ${auth}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    },
  })
  if (res.status === 401 || res.status === 403) {
    // Dataverse hata kodu ve eksik yetkinin adı (ör. prvRead…) koda girer; ileti metni girmez.
    const body = await res.json().catch(() => null)
    throw new SelfServiceError("denied", erpDeniedCause(res.status, body))
  }
  if (!res.ok) {
    // Kod + tablo + kişisel verisi ayıklanmış kısa ileti: neden ekranda okunsun (`StateDetail`).
    const body = await res.json().catch(() => null)
    throw new SelfServiceError("error", erpErrorCause(res.status, body))
  }
  return res.json()
}

/** Tablonun satırları; 401/403 → `denied`, öteki hatalar → `error`. */
export async function list(auth, entity, params) {
  return (await page(auth, `${API}/${entity}?${query(params)}`)).value ?? []
}

/**
 * En çok `max` satır, sunucu sayfalarsa `@odata.nextLink` izlenerek → `{ rows, more }`.
 * `more`: sınıra varıldı, daha eski satır olabilir — çağıran bölümü "kesik" diye işaretler.
 */
export async function listAll(auth, entity, params, max) {
  const rows = []
  let url = `${API}/${entity}?${query({ ...params, $top: max })}`
  while (url && rows.length < max) {
    const body = await page(auth, url)
    rows.push(...(body.value ?? []))
    url = body["@odata.nextLink"] ?? null
  }
  return { rows: rows.slice(0, max), more: Boolean(url) || rows.length >= max }
}

/**
 * Önce `params` ile; izin dışı bir hatada `fallback` parametreleriyle bir kez daha (ör.
 * doğrulanmış `$select`). Bilinmeyen kolon adı Dataverse'te 400 verir: ekran bugünkünden
 * geriye gitmesin. `read`: okuyucu (`list` ya da sayfalı `listAll`'ın sarmalı).
 */
export async function listSafe(auth, entity, params, fallback, read = list) {
  try {
    return await read(auth, entity, params)
  } catch (err) {
    if (err?.kind === "denied" || !fallback) throw err
    return read(auth, entity, { ...params, ...fallback })
  }
}
