import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"

/**
 * Talep numarası (başlığın yanında) — basınca numara panoya kopyalanır (Xurrent'te aramak ya da
 * iletmek için), kısa onay: tik + ekran okuyucuya duyuru. Self Servis'in `CopyNumber`ının eşi.
 */
export function TicketCode({ id }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(id))
      setCopied(true)
    } catch {
      // Pano kapalı (izin yok): numara seçilebilir metin olarak duruyor.
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={t("tibot.copyNumber", { id })}
        title={t("tibot.copyNumber", { id })}
        className="tb-code"
        data-copied={copied || undefined}
      >
        #{id}
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} aria-hidden="true" strokeWidth={2} />
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? t("tibot.numberCopied") : ""}
      </span>
    </>
  )
}
