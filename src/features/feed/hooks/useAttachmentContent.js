import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { graphGetBlob, STATUS } from "@/lib/graph"
import { attachmentValuePath, MAIL_SCOPES } from "@/features/feed/lib/mailAttachments"
import {
  blobType,
  PREVIEW_LIMIT,
  previewPlan,
  TEXT_READ,
} from "@/features/feed/lib/attachmentPreview"
import { saveBlob } from "@/features/feed/lib/saveBlob"

/**
 * Bir e-posta ekinin önizleme içeriği (`AttachmentPreviewDialog`). Ek bayt olarak okunur
 * (`$value`) ve türüne göre hazırlanır: resim ve PDF için nesne adresi (`url`), düz yazı ve HTML
 * için metin (`text`; yazı ilk `TEXT_READ` baytla sınırlı, `cut`), Word, Excel ve PowerPoint için
 * hızlı önizleme verisi (`office`; `features/feed/lib/officePreview`, ilk kullanımda ayrı parça olarak iner;
 * dosya açılamazsa "none").
 * Dönüş: `{ status, kind, url, text, cut, blob, download }` — `status`: "loading" | "ready" |
 * "error" | "none" (türün önizlemesi yok) | "tooLarge" (indirilmeden vazgeçildi). `download()`
 * okunmuş baytı kullanır, okunmadıysa okur. Nesne adresi kapanınca bırakılır.
 */
export function useAttachmentContent(item, locale = "tr") {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const plan = useMemo(() => previewPlan(item), [item])
  const [state, setState] = useState({ status: "loading" })
  const blobRef = useRef(null)
  const idle = !plan.kind ? "none" : plan.tooLarge ? "tooLarge" : null

  useEffect(() => {
    if (idle) return undefined
    let alive = true
    let url = null
    const { kind } = plan
    ;(async () => {
      const res = await graphGetBlob(instance, account, {
        path: attachmentValuePath(item),
        scopes: MAIL_SCOPES,
      })
      if (!alive) return
      if (res.status !== STATUS.ready || res.blob.size > PREVIEW_LIMIT[kind]) {
        setState({ status: res.status === STATUS.ready ? "tooLarge" : "error", detail: res.detail })
        return
      }
      blobRef.current = res.blob
      let value = { status: "ready", kind, blob: res.blob }
      if (kind === "image" || kind === "pdf") {
        url = URL.createObjectURL(new Blob([res.blob], { type: blobType(item, kind) }))
        value = { ...value, url }
      } else if (kind === "text") {
        const text = await res.blob.slice(0, TEXT_READ).text()
        value = { ...value, text, cut: res.blob.size > TEXT_READ }
      } else if (kind === "html") {
        value = { ...value, text: await res.blob.text() }
      } else if (kind === "office") {
        try {
          const { readOffice } = await import("@/features/feed/lib/officePreview")
          value = { ...value, office: await readOffice(res.blob, item.ext, locale) }
        } catch {
          if (alive) setState({ status: "none" })
          return
        }
      }
      if (!alive) {
        if (url) URL.revokeObjectURL(url)
        return
      }
      setState(value)
    })()
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [idle, account, instance, item, plan, locale])

  const download = useCallback(async () => {
    let blob = blobRef.current
    if (!blob) {
      const res = await graphGetBlob(instance, account, {
        path: attachmentValuePath(item),
        scopes: MAIL_SCOPES,
      })
      if (res.status !== STATUS.ready)
        throw Object.assign(new Error(res.error ?? res.status), { detail: res.detail })
      blob = res.blob
    }
    saveBlob(blob, item.name)
  }, [instance, account, item])

  return { ...(idle ? { status: idle } : state), kind: plan.kind, download }
}
