import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { worstMailBody } from "@/dev/worstCase/mailBody"
import { graphGet, STATUS } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Postanın TAM gövdesi ve alıcıları (Kime · Bilgi) — Keşfet'in okuma bölmesi, çentiğin posta
 * kartı ve büyük okuyucusu aynı kancayı okur.
 *
 * ⚠️ **KIRPMA YOK, TAVAN VAR.** Gömülü görselli bir bülten 200 KB'yi rahat aşıyor ve HTML
 * etiketin ortasından kesilince çerçeve sessizce bozuk çiziyor. Sınır 1,5 MB; aşılırsa gövde
 * hiç gösterilmez (`oversize`), ekran özete ve "Outlook'ta aç"a düşer.
 *
 * ⚠️ Önbellek YALNIZ BELLEKTE (başkasının yazdığı metin) ve çıkışta düşer (`lib/sessionCache`).
 */
const BODY_CAP = 1_500_000
const bodyCache = new Map()

export function clearMailBodyCache() {
  bodyCache.clear()
}
onSessionClear(clearMailBodyCache)

const people = (list) =>
  (list ?? [])
    .map((r) => ({
      name: r.emailAddress?.name?.trim() || r.emailAddress?.address || "",
      address: (r.emailAddress?.address ?? "").toLowerCase(),
    }))
    .filter((r) => r.name || r.address)

export function useMailBody(id, enabled = true) {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  // ⚠️ Kimlikle birlikte (`{ key, value }`): okuyucu tek yerde mount kalıyor; çıplak durum
  // ikinci postada bir önceki postanın gövdesini gösteriyordu.
  const [state, setState] = useState(() =>
    bodyCache.has(id) ? { key: id, value: bodyCache.get(id) } : null,
  )

  useEffect(() => {
    if (!enabled || !isMsalConfigured || !account || !id) return
    if (bodyCache.has(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ key: id, value: bodyCache.get(id) })
      return
    }
    let cancelled = false
    ;(async () => {
      // Alıcılar AYNI istekte: ikinci bir tur, posta kutusunun eşzamanlı istek sınırını zorlar.
      const res = await graphGet(instance, account, {
        path: `/me/messages/${encodeURIComponent(id)}?$select=body,toRecipients,ccRecipients`,
        scopes: ["Mail.Read"],
        headers: { Prefer: 'outlook.body-content-type="html"' },
        // Kısıtlamada (429, posta kutusunun eşzamanlı istek sınırı) `Retry-After` kadar bekleyip
        // yeniden dener: okuyucuda hızlı gezinme ekrana "istek sınırı" düşürmesin.
        retry: 2,
      })
      if (cancelled) return
      if (res.status !== STATUS.ready) {
        setState({ key: id, value: { ...res, html: null, text: null, oversize: false } })
        return
      }
      const raw = res.data.body?.content ?? ""
      const isHtml = res.data.body?.contentType === "html"
      const to = people(res.data.toRecipients)
      const cc = people(res.data.ccRecipients)
      const value =
        raw.length > BODY_CAP
          ? { status: STATUS.ready, html: null, text: null, oversize: true, to, cc }
          : {
              status: STATUS.ready,
              html: isHtml ? raw : null,
              text: isHtml ? null : raw.trim(),
              oversize: false,
              to,
              cc,
            }
      bodyCache.set(id, value)
      setState({ key: id, value })
    })()
    return () => {
      cancelled = true
    }
  }, [id, enabled, account, instance])

  // DEV: `?data=worst` örnek posta gövdesi (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV && enabled ? worstMailBody(id) : null
  if (worst) return worst
  // ⚠️ `state &&` ŞART: kapalı okuyucuda `id` tanımsız ve `undefined === undefined` doğru çıkar.
  return state && state.key === id ? state.value : null
}
