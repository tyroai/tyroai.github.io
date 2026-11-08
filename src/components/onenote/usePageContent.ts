import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { STATUS } from "@/lib/graph"
import { worstMode } from "@/dev/worstCase/mode"
import { worstOneNoteContent, worstOneNoteImage } from "@/dev/worstCase/onenote"
import { flattenOneNoteHtml } from "@/lib/onenote/onenoteHtml"
import { imageRefs, swapImages } from "@/lib/onenote/onenoteImages"
import { fetchPageContent } from "@/lib/onenote/onenoteSource"

/**
 * Bir OneNote sayfasının içeriği — okuyucu (`images`: görseller gömülü) ve kartın ön izlemesi
 * (yalnız metin). `id` yoksa istek yok. `retry` aynı sayfayı yeniden ister.
 * Döner: `{ status: "loading" | ready | denied | error, html, raw, retry }`.
 */
interface ContentState {
  key: string | null
  status: string
  html: string
  raw: string
  /** Okunamadıysa neden kodu (`ErrorCause`). */
  detail?: string
}

/** DEV: sahte sayfa, görseller sahte indirmeyle (`worstOneNoteImage`) gerçek akıştaki gibi yerinde. */
function fakeContent(raw: string): string {
  const html = flattenOneNoteHtml(raw)
  const images = new Map<string, string>()
  for (const ref of imageRefs(html)) {
    const data = ref.urls.map((u) => worstOneNoteImage(u)).find(Boolean)
    if (data) images.set(ref.key, data)
  }
  return swapImages(html, images)
}

export function usePageContent(id: string | null, { images = true }: { images?: boolean } = {}) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [state, setState] = useState<ContentState>({
    key: null,
    status: "loading",
    html: "",
    raw: "",
  })
  const [nonce, setNonce] = useState(0)
  const key = id ? `${id}:${images}:${nonce}` : null
  // DEV: `?data=…` sahte içerik (src/dev/worstCase); üretimde ölü kod.
  const fake: string | null =
    import.meta.env.DEV && id && worstMode() ? worstOneNoteContent(id) : null

  useEffect(() => {
    if (!key || !id || fake) return undefined
    let live = true
    fetchPageContent(instance, account, id, { images }).then((res) => {
      if (live) setState({ key, ...res })
    })
    return () => {
      live = false
    }
  }, [key, fake, instance, account, id, images])

  const retry = useCallback(() => setNonce((n) => n + 1), [])
  if (fake) return { status: STATUS.ready, html: fakeContent(fake), raw: fake, retry }
  if (!id) return { status: "idle", html: "", raw: "", retry }
  return state.key === key ? { ...state, retry } : { status: "loading", html: "", raw: "", retry }
}
