import { dvApi } from "./dataverse"

/**
 * tyro'nun yetki ekranı ↔ tyroTrade'in yetki tablosu (`tyro_TradeUserSecurity`, TYRO ortamı).
 *
 * Kural: bir kişiye tyro'da **tyroTrade** app'i verildiğinde tyroTrade tablosuna BOŞ bir satır
 * açılır (her şey kapalı; ekranlarını tyroTrade'in Güvenlik sayfası seçer). App kaldırıldığında
 * satır SİLİNİR, kişinin adresi değiştiğinde satır yeni adrese TAŞINIR (yetkileri korunur).
 *
 * ⚠️ tyroTrade satırının içeriğine (bayraklar, listeler) buradan HİÇ dokunulmaz: o tablonun
 * sahibi tyroTrade. Burası yalnız satırın VARLIĞINI tyro ile eşitler.
 *
 * ⚠️ tyro'nun kendi yazması ÖNCE yapılır ve eşitleme onu geri almaz: eşitleme düşerse tyro'daki
 * yetki yazılmış kalır ve Güvenlik sayfası bir uyarı gösterir (`TRADE_SYNC_FAILED` olayı →
 * `useTradeSyncNotice`). Sessizce yutmak, tyroTrade'e giremeyen bir kişiyi açıklamasız bırakırdı.
 */

const SET = "tyro_tradeusersecurities"
/** Eşitleme düştüğünde yayılan pencere olayı; `detail` hata metni. */
export const TRADE_SYNC_FAILED = "tyro:trade-sync-failed"
const TRADE_APP = "tyrotrade"

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
const quote = (v) => String(v).replace(/'/g, "''")

/** App listesinde tyroTrade var mı (ad büyük/küçük harften bağımsız). */
export function hasTradeApp(apps) {
  return (apps ?? []).some((a) => norm(a) === TRADE_APP)
}

async function findRows(upn) {
  const key = norm(upn)
  if (!key) return []
  const data = await dvApi(
    `/${SET}?$select=tyro_tradeusersecurityid&$filter=tyro_useremail eq '${quote(key)}'`,
  )
  return data?.value ?? []
}

/** Satır yoksa boş açar; varsa dokunmaz (yetkileri ezilmesin). */
export async function ensureTradeRow(upn) {
  const key = norm(upn)
  if (!key || (await findRows(key)).length) return
  await dvApi(`/${SET}`, { method: "POST", body: JSON.stringify({ tyro_useremail: key }) })
}

export async function removeTradeRow(upn) {
  for (const r of await findRows(upn)) {
    await dvApi(`/${SET}(${r.tyro_tradeusersecurityid})`, { method: "DELETE" })
  }
}

/** Adres değişti: satır yeni adrese taşınır; yeni adresin zaten satırı varsa eskisi silinir. */
export async function moveTradeRow(fromUpn, toUpn) {
  const [from, to] = [norm(fromUpn), norm(toUpn)]
  if (!from || !to || from === to) return
  const old = await findRows(from)
  if (!old.length) return ensureTradeRow(to)
  if ((await findRows(to)).length) return removeTradeRow(from)
  await dvApi(`/${SET}(${old[0].tyro_tradeusersecurityid})`, {
    method: "PATCH",
    body: JSON.stringify({ tyro_useremail: to }),
  })
}

/** Eşitleme hatası tyro'nun işini düşürmez; sayfa uyarır, konsola ayrıntı yazılır. */
async function guard(work) {
  try {
    await work()
  } catch (err) {
    console.error("[tyroTrade eşitleme]", err)
    window.dispatchEvent(
      new CustomEvent(TRADE_SYNC_FAILED, { detail: String(err?.message ?? err).slice(0, 240) }),
    )
  }
}

/**
 * Bir yetki satırının önceki ve sonraki hâline göre tyroTrade satırını eşitler.
 * `before`/`after`: `{ upn, apps }`; satır yeni açılıyorsa `before` null, siliniyorsa `after` null.
 */
export function syncTradeAccess(before, after) {
  const had = before ? hasTradeApp(before.apps) : false
  const has = after ? hasTradeApp(after.apps) : false
  return guard(async () => {
    if (had && has && norm(before.upn) !== norm(after.upn))
      return moveTradeRow(before.upn, after.upn)
    if (!had && has) return ensureTradeRow(after.upn)
    if (had && !has) return removeTradeRow(before.upn)
  })
}
