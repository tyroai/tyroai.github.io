import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { ENTITY_SET as HR_VIEW } from "@/lib/celebrations"
import { companyParams, pickCompany, toCompany } from "@/lib/hrCompany"
import { isMsalConfigured } from "@/lib/msal"
import { quote } from "@/lib/selfServiceOdata"
import { createSessionCache } from "@/lib/sessionCache"
import { list, token } from "@/lib/selfServiceHttp"

/**
 * Kişinin şirketi İK görünümünden (`lib/hrCompany.js`: eşleşme kuralı ve ölçümü). Dönüş
 * `{ code, name }` ya da null — null'da çağıran Graph'ın değerini gösterir; hata ekrana çıkmaz.
 *
 * ⚠️ Yalnız bellekte, hesap ve kimlikle anahtarlı; çıkışta düşer (`lib/sessionCache`).
 * Okunamayan cevap önbelleğe yazılmaz (bir sonraki açılış yeniden sorar).
 */
// anahtar → { code, name } | null (yalnız tamamlanmış cevap)
const cache = createSessionCache({ name: "hrCompany" })

export function clearHrCompanyCache() {
  cache.clear()
}

const WORKERS = "mserp_tryaiworkersentities"

/** Adresin ERP personnel number'ı (Self Servis'in eşleşmesi: network alias → borax_oldemplid). */
async function personnelOf(auth, address) {
  if (!address) return ""
  const rows = await list(auth, WORKERS, {
    $select: "mserp_borax_oldemplid",
    $filter: `mserp_userinfo_networkalias eq ${quote(address.toLowerCase())}`,
  })
  return rows.map((r) => String(r.mserp_borax_oldemplid ?? "").trim()).find(Boolean) ?? ""
}

/**
 * Kişinin şirketi. `personnel` biliniyorsa (Self Servis) yalnız görünüm sorulur; bilinmiyorsa ve
 * `resolve` açıksa (sohbetteki form) ilk adresin ERP numarası görünümle PARALEL sorulur. Fırlatır
 * (yetki, ağ) — çağıran yakalar.
 */
export async function fetchHrCompany({ personnel = "", addresses = [], resolve = false } = {}) {
  const auth = await token()
  const known = String(personnel ?? "").trim()
  const [number, ...pages] = await Promise.all([
    known || !resolve ? known : personnelOf(auth, addresses[0]).catch(() => ""),
    ...companyParams({ personnel: known, addresses }).map((p) => list(auth, HR_VIEW, p)),
  ])
  let rows = pages.flat().map(toCompany)
  // Numara sonradan çözüldüyse ve maille gelen satırlarda yoksa (adres görünümde başka) kendisiyle.
  if (number && !known && !rows.some((r) => r?.personnel === number)) {
    const [params] = companyParams({ personnel: number })
    rows = rows.concat((await list(auth, HR_VIEW, params)).map(toCompany))
  }
  return pickCompany(rows, { personnel: number, addresses })
}

function load(key, query) {
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  return cache.dedupe(key, (commit) =>
    fetchHrCompany(query)
      .then((value) => {
        commit(value)
        return value
      })
      .catch(() => null),
  )
}

/**
 * @param {{ personnel?: string, addresses?: string[], enabled?: boolean }} query
 * @returns {{ status: "idle" | "loading" | "ready", company: { code, name } | null }}
 */
export function useHrCompany({ personnel = "", addresses = [], enabled = true } = {}) {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const ids = useMemo(
    () =>
      [...new Set((addresses ?? []).filter(Boolean).map((a) => String(a).trim().toLowerCase()))]
        .filter(Boolean)
        .sort(),
    [addresses],
  )
  const number = String(personnel ?? "").trim()
  const key =
    enabled && isMsalConfigured && account && (number || ids.length)
      ? `${account.homeAccountId}|${number}|${ids.join(",")}`
      : null
  const [state, setState] = useState(null) // { key, value }

  // Yalnız anahtar değişince sorulur: adres dizisinin her çizimde yeni olması istek doğurmasın.
  useEffect(() => {
    if (!key || cache.has(key)) return undefined
    let alive = true
    const [, p, joined] = key.split("|")
    load(key, { personnel: p, addresses: joined ? joined.split(",") : [] }).then(
      (value) => alive && setState({ key, value }),
    )
    return () => {
      alive = false
    }
  }, [key])

  if (!key) return { status: "idle", company: null }
  if (cache.has(key)) return { status: "ready", company: cache.get(key) }
  return state?.key === key
    ? { status: "ready", company: state.value }
    : { status: "loading", company: null }
}
