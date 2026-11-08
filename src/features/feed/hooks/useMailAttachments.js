import { useCallback, useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { graphGet, graphGetBlob, STATUS } from "@/lib/graph"
import {
  attachmentsFromMessages,
  attachmentsPath,
  attachmentValuePath,
  MAIL_SCOPES,
} from "@/features/feed/lib/mailAttachments"
import { saveBlob } from "@/features/feed/lib/saveBlob"

const LOADING = { status: "loading", items: [], next: null }

/**
 * E-posta ekleri (Dosyalarım). Veri yalnız bileşen durumunda — modül önbelleği yok, çıkışta
 * temizlenecek bir şey kalmaz. Dönüş `{ status, items, more, loadingMore, download }`:
 * `more` daha eski postaların sayfası (yoksa null), `download(ek)` dosyayı indirir.
 */
export function useMailAttachments(enabled = true, nonce = 0) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [state, setState] = useState({ key: null, value: LOADING })
  const [loadingMore, setLoadingMore] = useState(false)
  // Aynı sayfa iki kez istenmesin (çift tık, kendiliğinden yükleme).
  const busy = useRef(false)
  const key = enabled && account ? `${account.homeAccountId}|${nonce}` : null

  useEffect(() => {
    if (!key) return undefined
    let alive = true
    graphGet(instance, account, { path: attachmentsPath(), scopes: MAIL_SCOPES }).then((res) => {
      if (!alive) return
      setState({
        key,
        value:
          res.status === STATUS.ready
            ? {
                status: "ready",
                items: attachmentsFromMessages(res.data?.value),
                next: res.data?.["@odata.nextLink"] ?? null,
              }
            : { status: res.status, items: [], next: null, detail: res.detail },
      })
    })
    return () => {
      alive = false
    }
  }, [key, instance, account])

  // Yenilemede (`nonce`) aynı hesabın son listesi yeni gelene dek kalır: liste iskelete dönmez.
  const sameAccount = Boolean(account && state.key?.startsWith(`${account.homeAccountId}|`))
  const value = !account
    ? { ...LOADING, status: STATUS.unauthenticated }
    : state.key === key
      ? state.value
      : sameAccount
        ? { ...state.value, stale: true }
        : LOADING
  const next = value.next

  const more = useCallback(async () => {
    if (!next || busy.current) return
    busy.current = true
    setLoadingMore(true)
    let res
    try {
      res = await graphGet(instance, account, { path: next, scopes: MAIL_SCOPES })
    } finally {
      busy.current = false
      setLoadingMore(false)
    }
    if (res.status !== STATUS.ready) return
    setState((prev) =>
      prev.key !== key
        ? prev
        : {
            key,
            value: {
              status: "ready",
              items: [...prev.value.items, ...attachmentsFromMessages(res.data?.value)],
              next: res.data?.["@odata.nextLink"] ?? null,
            },
          },
    )
  }, [next, instance, account, key])

  const download = useCallback(
    async (a) => {
      const res = await graphGetBlob(instance, account, {
        path: attachmentValuePath(a),
        scopes: MAIL_SCOPES,
      })
      if (res.status !== STATUS.ready)
        throw Object.assign(new Error(res.error ?? res.status), { detail: res.detail })
      saveBlob(res.blob, a.name)
    },
    [instance, account],
  )

  return { ...value, more: next ? more : null, loadingMore, download }
}
