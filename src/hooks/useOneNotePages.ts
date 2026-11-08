import { useCallback, useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { worstMode } from "@/dev/worstCase/mode"
import { worstWidgetData } from "@/dev/worstCase/widgets"
import { STATUS } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { CHUNK } from "@/lib/onenote/onenotePages"
import type { OneNotePage } from "@/lib/onenote/onenotePages"
import type { RecentSource } from "@/lib/onenote/onenoteRecent"
import { fetchOneNotePages } from "@/lib/onenote/onenoteSource"
import type { PagesResult } from "@/lib/onenote/onenoteSource"
import { createSessionCache } from "@/lib/sessionCache"

// Son sayfa listesi (kişisel içerik): 2 dk taze, hesap başına; çıkışta silinir (`createSessionCache`).
// YALNIZ tam liste önbelleğe girer: parça parça okunan listenin devamı kaynağın içinde (kapanış), saklanamaz.
const cache = createSessionCache<string, OneNotePage[]>({
  ttlMs: 2 * 60_000,
  maxEntries: 4,
  name: "onenotePages",
})

export interface OneNoteList {
  /** loading | ready | denied | error | unauthenticated */
  status: string
  pages: OneNotePage[]
  /** Başarısızlıkta kişisel veri içermeyen neden kodu (`ErrorCause`a verilir). */
  detail?: string
  /** Liste tam değil: `loadMore()` sıradaki parçayı ekler. */
  hasMore: boolean
  loadingMore: boolean
  /** Sıradaki parçanın neden kodu; `loadMore` yeniden dener. */
  moreError: string | null
  loadMore: () => Promise<void>
  refresh: () => void
}

type Shown = Omit<OneNoteList, "loadMore" | "refresh">
const IDLE: Omit<Shown, "status"> = {
  pages: [],
  hasMore: false,
  loadingMore: false,
  moreError: null,
}

/**
 * OneNote'un son düzenlenen sayfaları — Keşfet › Bul ve OneNote widget'ı ortak kullanır. Büyük hesapta
 * liste PARÇA PARÇA gelir (`onenoteSource`): `hasMore` iken `loadMore()` sıradaki parçayı ekler (liste
 * sonu görününce çağrılır). `refresh` önbelleği atlar.
 */
export function useOneNotePages(enabled = true): OneNoteList {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const key = isMsalConfigured && account ? account.homeAccountId : null
  // `nonce`: yenileme sayacı; sonuç hangi isteğe aitse onu taşır, bayat sonuç gösterilmez.
  const [state, setState] = useState<Shown & { nonce: number }>({
    nonce: -1,
    status: "loading",
    ...IDLE,
  })
  const [nonce, setNonce] = useState(0)
  const [devCount, setDevCount] = useState(CHUNK)
  const cached = enabled && key && nonce === 0 ? cache.get(key) : undefined
  // Parça kaynağı ve süren istek: durumdan ayrı, çünkü yenilemede ikisi de bırakılır.
  const sourceRef = useRef<RecentSource | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (!enabled || !key || cached) return undefined
    let live = true
    sourceRef.current = null
    busyRef.current = false
    cache
      .dedupe<PagesResult>(
        key,
        async (commit) => {
          const res = await fetchOneNotePages(instance, account)
          if (res.status === STATUS.ready && !res.data?.source) commit(res.data?.pages ?? [])
          return res
        },
        { share: false },
      )
      .catch((): PagesResult => ({ status: STATUS.error, data: null }))
      .then((res) => {
        if (!live) return
        if (res.status === STATUS.ready) {
          const source = res.data?.source ?? null
          sourceRef.current = source
          setState({
            nonce,
            status: STATUS.ready,
            ...IDLE,
            pages: res.data?.pages ?? [],
            hasMore: !!source,
          })
        } else {
          if (res.status === STATUS.error)
            console.warn(`[onenote] sayfa listesi okunamadı: ${res.detail ?? "neden yok"}`)
          setState({ nonce, status: res.status, ...IDLE, detail: res.detail })
        }
      })
    return () => {
      live = false
    }
  }, [enabled, key, cached, instance, account, nonce])

  const refresh = useCallback(() => {
    if (key) cache.delete(key)
    sourceRef.current = null
    setNonce((n) => n + 1)
  }, [key])

  const loadMore = useCallback(async () => {
    const source = sourceRef.current
    if (!source || busyRef.current) return
    busyRef.current = true
    setState((s) => ({ ...s, loadingMore: true, moreError: null }))
    const r = await source.next()
    busyRef.current = false
    // Yenileme sırasında geldiyse bayat: eski kaynağın parçası yeni listeye karışmaz.
    if (sourceRef.current !== source) return
    if (r.status === "ready") {
      if (r.done) sourceRef.current = null
      setState((s) => {
        const seen = new Set(s.pages.map((p) => p.id))
        const added = r.pages.filter((p) => !seen.has(p.id))
        return { ...s, pages: [...s.pages, ...added], hasMore: !r.done, loadingMore: false }
      })
    } else {
      const reason = "detail" in r.failure ? r.failure.detail : undefined
      setState((s) => ({ ...s, loadingMore: false, moreError: reason ?? "error" }))
    }
  }, [])

  // DEV: `?data=…` sahte liste (src/dev/worstCase); `huge` gerçek büyük hesap gibi parça parça gelir.
  const worst = import.meta.env.DEV ? worstWidgetData("onenote") : null
  if (worst) {
    const all: OneNotePage[] = worst.data?.pages ?? []
    const partial = worstMode() === "huge"
    return {
      ...IDLE,
      status: worst.status,
      pages: partial ? all.slice(0, devCount) : all,
      hasMore: partial && devCount < all.length,
      loadMore: async () => setDevCount((n) => n + CHUNK),
      refresh,
    }
  }
  if (!key) return { ...IDLE, status: STATUS.unauthenticated, loadMore, refresh }
  // Yenilerken eski liste ekranda kalır (`state` hazırsa); ilk yüklemede iskelet.
  let shown: Shown =
    state.nonce === nonce || state.status === STATUS.ready ? state : { ...IDLE, status: "loading" }
  if (cached) shown = { ...IDLE, status: STATUS.ready, pages: cached }
  return { ...shown, loadMore, refresh }
}
