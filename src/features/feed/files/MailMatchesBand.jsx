import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useMailAttachments } from "@/features/feed/hooks/useMailAttachments"
import { useLocale } from "@/hooks/useLocale"
import { filterAttachments } from "@/features/feed/lib/mailAttachments"
import { FileGroup } from "./FileRow"
import { AttachmentRow } from "./AttachmentRow"
import { useAttachmentDownload } from "./useAttachmentDownload"

const SHOWN = 3

/**
 * "Tümü"de arama yapılınca dosya sonuçlarının üstünde E-POSTA EKLERİNDEKİ eşleşmeler: ilk
 * `SHOWN` ek ve "Tümünü gör" (aynı aramayla E-posta ekleri dilimi). Ekler arama başlayınca bir kez
 * okunur, yazdıkça istemcide süzülür; eşleşme yoksa hiçbir şey çizilmez.
 */
export function MailMatchesBand({ text, filters, now, nonce, onAll }) {
  const { t } = useLocale()
  const data = useMailAttachments(true, nonce)
  const { busyKey, run } = useAttachmentDownload(data.download)
  const matches = useMemo(
    () => filterAttachments(data.items, { text, types: filters.types, date: filters.date }, now),
    [data.items, text, filters.types, filters.date, now],
  )
  if (data.status !== "ready" || !matches.length) return null
  return (
    <section
      aria-label={t("myfiles.mail.band.title")}
      className="mb-6 min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
    >
      <FileGroup label={t("myfiles.mail.band.title")} count={matches.length}>
        {matches.slice(0, SHOWN).map((it) => (
          <AttachmentRow key={it.key} item={it} busy={busyKey === it.key} onDownload={run} />
        ))}
      </FileGroup>
      <button
        type="button"
        onClick={onAll}
        className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        {t("myfiles.mail.band.all")}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="size-3.5"
          strokeWidth={2}
        />
      </button>
    </section>
  )
}
