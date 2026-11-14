import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { graphRequest } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { checkPhoto, photoDue, photoKey, readPhoto } from "@/lib/myPhoto"
import { currentUser as devUser } from "@/data/user"
import { worstMe } from "@/dev/worstCase/home"

// Oturum yokken dönen kişi. Geliştirmede örnek kullanıcı; üretimde boş — gerçek bir kişinin adı ve
// adresi herkesin indirdiği pakette durmasın (`import.meta.env.DEV`
// derlemede `false` olunca örnek kullanıcı paketten düşer).
const TITLE = { tr: "TYRO", en: "TYRO" }
const FALLBACK = import.meta.env.DEV
  ? devUser
  : { name: "", fullName: "", initials: "", email: "", title: TITLE }

function initialsFromName(name) {
  if (!name) return ""
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

const listeners = new Set()
let inflight = null

const storage = () => (typeof window === "undefined" ? null : window.localStorage)

function readCached(account) {
  const store = storage()
  if (!store || !account) return undefined
  try {
    return readPhoto(store, account.homeAccountId ?? "unknown")
  } catch {
    return undefined
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Fotoğrafı arka planda tazeler (`lib/myPhoto`): oturum açılınca ve uygulama açılırken en çok
 * günde bir; aynı anda tek istek. Değiştiyse saklar ve bütün `useMe`lere haber verir.
 * Ağ ya da belirteç hatasında saklanan fotoğraf kalır.
 */
async function revalidate(account, instance) {
  const store = storage()
  const id = account.homeAccountId ?? "unknown"
  if (!store || inflight || !photoDue(store, id, Date.now())) return
  inflight = (async () => {
    try {
      const got = await checkPhoto({
        get: (path, read) =>
          graphRequest(instance, account, { path, scopes: ["User.Read"], read, quiet: true }),
        knownEtag: store.getItem(photoKey(id, "etag")),
        hasPhoto: Boolean(readPhoto(store, id)),
      })
      if (!got) return
      if (!got.same) {
        const dataUrl = got.blob ? await blobToDataUrl(got.blob) : null
        store.setItem(photoKey(id), dataUrl ?? "none")
        if (got.etag) store.setItem(photoKey(id, "etag"), got.etag)
        else store.removeItem(photoKey(id, "etag"))
        for (const cb of listeners) cb()
      }
      store.setItem(photoKey(id, "at"), String(Date.now()))
    } catch {
      // Ağ, belirteç ya da kota hatası — saklanan fotoğraf kalır, sonraki bakış yeniden dener.
    } finally {
      inflight = null
    }
  })()
}

/**
 * Returns the currently signed-in user in a shape matching `currentUser`:
 *   { name, fullName, initials, email, title, photoUrl }
 *
 * When MSAL is configured and a session is active, values come from the active
 * MSAL account claims and (if available) the Microsoft Graph profile photo.
 * Otherwise it falls back to an empty user (the sample user only in development). `photoUrl` is null when the user has no photo or
 * MSAL isn't configured.
 */
export function useMe() {
  const { accounts, instance } = useMsal()
  const account = accounts[0]

  // Saklanan fotoğraf ilk çizimde anında; Graph'a arka planda yeniden sorulur (`revalidate`),
  // değiştiyse bütün `useMe`ler birlikte güncellenir.
  const [photoUrl, setPhotoUrl] = useState(() =>
    isMsalConfigured && account ? (readCached(account) ?? null) : null,
  )

  useEffect(() => {
    if (!isMsalConfigured || !account) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhotoUrl(null)
      return
    }
    const sync = () => setPhotoUrl(readCached(account) ?? null)
    sync()
    listeners.add(sync)
    revalidate(account, instance)
    return () => listeners.delete(sync)
  }, [account, instance])

  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstMe() : null
  if (worst) return worst
  if (!isMsalConfigured || !account) return { ...FALLBACK, photoUrl: null }

  const fullName = account.name || account.username || FALLBACK.fullName
  const firstName = fullName.split(/\s+/)[0]

  return {
    name: firstName,
    fullName,
    initials: initialsFromName(fullName) || FALLBACK.initials,
    email: account.username || FALLBACK.email,
    title: TITLE,
    photoUrl,
  }
}
