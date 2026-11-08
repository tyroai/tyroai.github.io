import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { ENTITY_SET as HR_VIEW } from "@/lib/celebrations"
import { isMsalConfigured } from "@/lib/msal"
import { createSessionCache } from "@/lib/sessionCache"
import { list, token } from "@/lib/selfServiceHttp"
import { teamDateParams, teamDatesFrom } from "@/lib/teamOccasions"
import { worstTeamDates } from "@/dev/worstCase/team"

/**
 * Ekibin İK tarihleri (doğum gününün gün-ayı, kıdem tarihi) — Anasayfa'nın tebrikleriyle aynı İK
 * görünümü, yalnız ekibin adresleriyle (`teamDateParams`). Dönüş `{ [adres]: { birth, since } }`;
 * okunamazsa (yetki yok, ağ) boş nesne: ekranda doğum günü yok, hata da yok.
 *
 * ⚠️ Yalnız bellekte, hesap ve adres kümesiyle anahtarlı; çıkışta düşer
 * (`lib/sessionCache`). Doğum yılı tutulmaz (`teamDatesFrom`).
 */
const EMPTY = Object.freeze({})
// anahtar → { [adres]: … } (yalnız başarılı cevap)
const cache = createSessionCache({ name: "teamDates" })

export function clearTeamDatesCache() {
  cache.clear()
}

async function fetchTeamDates(addresses) {
  const auth = await token()
  const parts = await Promise.all(
    teamDateParams(addresses).map((params) => list(auth, HR_VIEW, params)),
  )
  return teamDatesFrom(parts.flat())
}

function load(key, addresses) {
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  return cache.dedupe(key, (commit) =>
    fetchTeamDates(addresses)
      .then((value) => {
        commit(value)
        return value
      })
      .catch(() => EMPTY),
  )
}

export function useTeamDates(people, enabled = true) {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const addresses = useMemo(
    () =>
      [...new Set((people ?? []).flatMap((p) => [p.address, p.upn]).filter(Boolean))]
        .map((a) => a.toLowerCase())
        .sort(),
    [people],
  )
  const key =
    enabled && isMsalConfigured && account && addresses.length
      ? `${account.homeAccountId}|${addresses.join(",")}`
      : null
  const [state, setState] = useState(null) // { key, value }

  // Yalnız anahtar değişince sorulur (adres listesi anahtarın içinde): liste dizisinin her
  // çizimde yeni olması yeniden istek ya da döngü doğurmasın.
  useEffect(() => {
    if (!key) return undefined
    let alive = true
    load(key, key.slice(key.indexOf("|") + 1).split(",")).then(
      (value) =>
        alive &&
        setState((prev) => (prev?.key === key && prev.value === value ? prev : { key, value })),
    )
    return () => {
      alive = false
    }
  }, [key])

  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstTeamDates() : null
  if (worst) return worst
  if (!key) return EMPTY
  return state?.key === key ? state.value : (cache.get(key) ?? EMPTY)
}
