import { useMemo } from "react"
import { useMailAttachments } from "@/features/feed/hooks/useMailAttachments"
import { useLocale } from "@/hooks/useLocale"
import { groupByDay } from "@/lib/filesDates"
import { filterAttachments } from "@/features/feed/lib/mailAttachments"
import { AttachmentRow } from "./AttachmentRow"
import { FileGroup } from "./FileRow"
import { RowsSkeleton, StateRow } from "./FilesStates"
import { useAttachmentDownload } from "./useAttachmentDownload"
import { LoadMore, SectionTitle } from "./FilesViews"

/**
 * Dosyalarım › E-POSTA EKLERİ — postalardaki dosyalar (OneDrive'da değil, posta kutusunda):
 * güne göre gruplar (dosyalarınkiyle aynı), satıra basınca büyük önizleme açılır, ⋯ menüsünde
 * Önizle · İndir · Postayı Outlook'ta aç (`AttachmentRow`). Arama ve tür/tarih süzgeci istemcide (`filterAttachments`); daha eski postalar
 * "Daha fazla" ile.
 */
export function MailAttachmentsView({ text, filters, now, firstDay, nonce }) {
  const { t } = useLocale()
  const data = useMailAttachments(true, nonce)
  const { busyKey, run: download } = useAttachmentDownload(data.download)
  const shown = useMemo(
    () => filterAttachments(data.items, { text, types: filters.types, date: filters.date }, now),
    [data.items, text, filters.types, filters.date, now],
  )
  const groups = useMemo(() => groupByDay(shown, now, firstDay), [shown, now, firstDay])
  const filtered = Boolean(text || filters.types.length || filters.date)

  return (
    <section aria-labelledby="files-mail-title" className="min-w-0">
      <h2 id="files-mail-title" className="sr-only">
        {t("myfiles.source.mail")}
      </h2>
      <SectionTitle
        count={data.status === "ready" ? shown.length : null}
        hint={t("myfiles.mail.hint")}
      >
        {t("myfiles.source.mail")}
      </SectionTitle>
      {data.status === "loading" ? (
        <RowsSkeleton rows={6} />
      ) : data.status !== "ready" ? (
        <StateRow title={t("myfiles.mail.error")} cause={data.detail} />
      ) : !shown.length ? (
        <StateRow
          tone="muted"
          title={t(filtered ? "myfiles.mail.noMatch" : "myfiles.mail.empty")}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <FileGroup key={g.id} label={t(`myfiles.bucket.${g.id}`)} count={g.items.length}>
              {g.items.map((it) => (
                <AttachmentRow
                  key={it.key}
                  item={it}
                  busy={busyKey === it.key}
                  onDownload={download}
                />
              ))}
            </FileGroup>
          ))}
          <LoadMore hasMore={Boolean(data.more)} loading={data.loadingMore} onMore={data.more} />
        </div>
      )}
    </section>
  )
}
