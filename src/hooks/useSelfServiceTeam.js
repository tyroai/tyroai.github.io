import { useCallback, useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { useMyTeam } from "@/hooks/useMyTeam"
import { useTeamAs } from "@/hooks/useTeamAs"
import { errorCause } from "@/lib/errorCause"
import { isMsalConfigured } from "@/lib/msal"
import { fetchTeamLeave } from "@/lib/selfServiceTeamApi"
import { teamPeople } from "@/lib/selfServiceTeamQuery"
import { createSessionCache } from "@/lib/sessionCache"
import { worstTeam } from "@/dev/worstCase/team"

/**
 * Ekibim'in TEK kancası (tarayıcı denemesinde bütünüyle sahtelenir). KAYNAK KURALI: ekip üyeleri
 * ve kimlikleri GRAPH'TAN — `useMyTeam` (yönetici, aynı yöneticiye bağlılar, bana bağlılar; her
 * üyede `relation`); fotoğraf ve varlık bileşende (`usePeoplePhotos`, `usePresence`). ERP'den
 * YALNIZ izin bakiyesi (yalnız bana bağlılar) ve izinler (`fetchTeamLeave`; bana bağlı olmayanın
 * izni türsüz), kişinin kendi oturumuyla; ekibin masrafı ve avansı okunmaz. Yalnız Ekibim
 * açıkken çalışır.
 *
 * Dönüş: `{ status, people, failed, leave, busy, refresh, connect }` — `status` Graph listesinin
 * durumu ("loading" · "ready" · "denied" · "error" · "unauthenticated"); `failed` okunamayan
 * Graph parçaları (`useMyTeam`: liste eksik); `leave` = `{ status, reason?, members, failed,
 * updatedAt? }`, `status`: "loading" · "ready" · "empty" (ERP'de eşleşen yok ya da rol
 * göstermedi) · "denied" (`reason`: "role" 401/403 · "consent" belirteç alınamadı) · "error" ·
 * "none" (ekip yok); `detail`/`errors` düşenin neden kodu. `refresh` okunamayan Graph parçasını da yeniden sorar; `connect` belirteci
 * tıklamaya bağlı onayla ister.
 *
 * ⚠️ ERP cevabı YALNIZ BELLEKTE (5 dk taze) ve çıkışta düşer (`lib/sessionCache`): iş
 * arkadaşlarının izinleri kişisel veri. Anahtar üyelerin ilişkisini
 * de taşır: ilişki değişirse (ör. ekip arkadaşı bana bağlandı) cevap yeniden sorulur.
 */
const cache = createSessionCache({ ttlMs: 5 * 60 * 1000, name: "selfServiceTeam" })

const LOADING = { status: "loading", members: {}, failed: [] }
const NONE = { status: "none", members: {}, failed: [] }

export function clearSelfServiceTeamCache() {
  cache.clear()
}

function load(key, people, { force = false, interactive = false } = {}) {
  if (!force && cache.has(key)) return Promise.resolve(cache.get(key))
  return cache.dedupe(
    key,
    (commit) =>
      fetchTeamLeave(people, { interactive })
        .then((res) => ({ ...res, updatedAt: Date.now() }))
        .catch((err) => ({
          status: err?.kind === "denied" ? "denied" : "error",
          // HTTP 401/403 rolün cevabı; belirteç hatası (onay yok) "Bağlan" ile çözülebilir.
          reason: /^HTTP /.test(err?.message ?? "") ? "role" : "consent",
          // Ekranda neden: ERP hatası kendi kodunu taşır, öteki hata (ağ, zaman aşımı) çözülür.
          detail: err?.kind ? err.message : errorCause("erp", err),
          members: {},
          failed: [],
        }))
        .then((value) => {
          if (value.status === "ready" || value.status === "empty") commit(value)
          return value
        }),
    { share: !interactive },
  )
}

export function useSelfServiceTeam(enabled = true, requestedAs = null) {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const signedIn = isMsalConfigured && Boolean(account)
  // Test görünümü (`asUpn`): ekip o kişinin gözünden (`useTeamAs`) — YALNIZ uygulama yöneticisi.
  // Çağıran (Ekibim) gözü ve `?as=`i ayrıca gizliyor; kapı burada da: başka bir çağıran yönetici
  // olmayan için başkasının ekibini ve izinlerini istetemesin. "Bilinmiyor" da hayır.
  const asUpn = useIsAppAdmin() === true ? requestedAs : null
  const mine = useMyTeam(enabled && signedIn && !asUpn)
  const other = useTeamAs(asUpn, enabled && signedIn && Boolean(asUpn))
  const team = asUpn ? other : mine
  const people = team.people
  const input = useMemo(() => teamPeople(people), [people])
  const key =
    signedIn && team.status === "ready" && input.length
      ? `${account.homeAccountId}|${input.map((p) => `${p.key}:${p.relation}`).join(",")}`
      : null
  const [state, setState] = useState(null) // { key, value }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!enabled || !key) return undefined
    let alive = true
    load(key, input).then((value) => alive && setState({ key, value }))
    return () => {
      alive = false
    }
  }, [enabled, key, input])

  // Yenile ve Bağlan: kullanıcının eylemi (ilk yükleme `leave.status` "loading" ile görünür).
  const run = useCallback(
    (opts) => {
      if (!key) return
      setBusy(true)
      load(key, input, opts).then((value) => {
        // Bu arada ekip değiştiyse (okunamayan parça geldi) yeni ekibin cevabı ezilmez.
        setState((prev) => (prev && prev.key !== key ? prev : { key, value }))
        setBusy(false)
      })
    },
    [key, input],
  )

  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstTeam() : null
  const cached = key ? cache.get(key, { stale: true }) : null
  const leave = !key
    ? team.status === "loading"
      ? LOADING
      : NONE
    : state?.key === key
      ? state.value
      : (cached ?? LOADING)
  if (worst) return { ...worst, busy: false, refresh: () => {}, connect: () => {} }
  return {
    status: team.status,
    // Graph ekip listesi okunamadıysa nedeninin kodu (`useMyTeam`); yoksa undefined.
    detail: team.detail,
    subject: asUpn ? (other.subject ?? null) : null,
    people,
    failed: team.failed,
    leave,
    busy,
    refresh: () => {
      if (team.failed.length) team.retry()
      run({ force: true })
    },
    connect: () => run({ force: true, interactive: true }),
  }
}
