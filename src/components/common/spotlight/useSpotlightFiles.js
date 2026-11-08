import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { normaliseDriveItem } from "@/lib/driveItem"
import { graphPost, STATUS } from "@/lib/graph"
import { onSessionClear } from "@/lib/sessionCache"

const MIN = 3
const WAIT_MS = 350
const TTL_MS = 2 * 60_000

// sorgu → { at, value } — başkasının belge adları; yalnız bellekte, çıkışta silinir.
const cache = new Map()
let epoch = 0
export function clearSpotlightFiles() {
  cache.clear()
  epoch += 1
}
onSessionClear(clearSpotlightFiles)

/**
 * Spotlight'ın dosya araması: OneDrive + SharePoint (Graph `/search/query`, `driveItem`), ilk
 * altı dosya. Yazarken her tuşta istek gitmesin diye kısa bekleme; aynı sorgu iki dakika
 * önbellekten. `{ status, items }` — `idle` (kısa sorgu ya da kapalı), `loading`, `ready`, hata.
 */
export function useSpotlightFiles(query, enabled) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const q = query.trim()
  const want = enabled && Boolean(account) && q.length >= MIN
  const [answer, setAnswer] = useState(null) // { q, value }

  useEffect(() => {
    if (!want) return undefined
    let live = true
    const started = epoch
    const timer = setTimeout(async () => {
      const hit = cache.get(q)
      if (hit && Date.now() - hit.at < TTL_MS) {
        if (live) setAnswer({ q, value: hit.value })
        return
      }
      const res = await graphPost(instance, account, {
        path: "/search/query",
        scopes: ["Files.Read.All"],
        body: {
          requests: [
            {
              entityTypes: ["driveItem"],
              query: { queryString: q },
              from: 0,
              size: 6,
              fields: [
                "id",
                "name",
                "webUrl",
                "lastModifiedDateTime",
                "lastModifiedBy",
                "parentReference",
                "file",
                "folder",
              ],
            },
          ],
        },
      })
      const hits = res.data?.value?.[0]?.hitsContainers?.[0]?.hits ?? []
      const value =
        res.status === STATUS.ready
          ? {
              status: STATUS.ready,
              items: hits
                .map((h) => h.resource)
                .filter(Boolean)
                .map(normaliseDriveItem)
                .filter((it) => it.webUrl),
            }
          : { status: res.status, items: [] }
      // Çıkıştan sonra dönen cevap önbelleğe yazılmaz.
      if (value.status === STATUS.ready && started === epoch)
        cache.set(q, { at: Date.now(), value })
      if (live) setAnswer({ q, value })
    }, WAIT_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [want, q, instance, account])

  if (!want) return { status: "idle", items: [] }
  return answer?.q === q ? answer.value : { status: "loading", items: [] }
}
