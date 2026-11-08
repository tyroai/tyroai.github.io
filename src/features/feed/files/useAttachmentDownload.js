import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { causeText, withCause } from "@/lib/causeText"
import { errorCause } from "@/lib/errorCause"
import { notify } from "@/lib/notify"

/** Ekin indirilmesi: hangi satırın beklediği (`busyKey`) ve hata bildirimi. */
export function useAttachmentDownload(download) {
  const { t } = useLocale()
  const [busyKey, setBusyKey] = useState(null)
  const run = async (item) => {
    setBusyKey(item.key)
    try {
      await download(item)
    } catch (err) {
      notify.error(t("myfiles.mail.downloadError"), {
        description: withCause("", causeText(t, errorCause("graph", err))) || undefined,
      })
    } finally {
      setBusyKey(null)
    }
  }
  return { busyKey, run }
}
