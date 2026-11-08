import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { FileBadge } from "@/components/common/FileBadge"
import { ACTION, QUIET } from "@/components/common/FilePreviewDialog"
import { OfficeQuickLook } from "./OfficeQuickLook"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAttachmentContent } from "@/features/feed/hooks/useAttachmentContent"
import { useLocale } from "@/hooks/useLocale"
import { causeText, withCause } from "@/lib/causeText"
import { errorCause } from "@/lib/errorCause"
import { formatSize } from "@/lib/fileMeta"
import { HTML_SANDBOX, htmlPreviewDoc } from "@/lib/htmlPreview"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

/**
 * E-POSTA EKİNİN BÜYÜK ÖNİZLEMESİ — dosyaların önizleme penceresinin (`FilePreviewDialog`)
 * posta eki karşılığı: satıra basınca açılır, indirme yerine içeriği gösterir. Posta ekinde
 * Office Online yok (yalnız OneDrive/SharePoint dosyası için); ek bayt olarak okunup tarayıcıda
 * çizilir (`useAttachmentContent`): resim, PDF, düz yazı, HTML (kilitli çerçeve) ve Word · Excel ·
 * PowerPoint için hızlı önizleme (`OfficeQuickLook`: yazı ve tablo). Önizlenemeyen
 * ya da çok büyük ekte pencere boş kalmaz: tür rozeti, nedeni ve aynı eylemler ortada durur.
 * Eylemler: İndir ve "Postayı Outlook'ta aç"; darda başlığın altında kendi satırında.
 */
export function AttachmentPreviewDialog({ item, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <Body item={item} onClose={onClose} />
    </Dialog>
  )
}

function Actions({ item, onDownload, busy, openUrl = null, fill = false }) {
  const { t } = useLocale()
  const grow = fill ? "min-w-0" : ""
  return (
    <>
      {/* Resim ve PDF'in nesne adresi yeni sekmede tarayıcının kendi görüntüleyicisinde açılır
          (telefonda tam sayfa; gömülü görünüm yetmezse). */}
      {openUrl && (
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(ACTION, QUIET, grow)}
        >
          <span className="truncate">{t("myfiles.mail.openTab")}</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
        </a>
      )}
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        aria-busy={busy || undefined}
        className={cn(ACTION, QUIET, grow, "disabled:opacity-60")}
      >
        <HugeiconsIcon
          icon={busy ? Loading03Icon : Download04Icon}
          strokeWidth={2}
          className={busy ? "animate-spin motion-reduce:animate-none" : undefined}
        />
        <span className="truncate">{t("files.download")}</span>
      </button>
      {item.webLink && (
        <a
          href={item.webLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(ACTION, QUIET, grow)}
        >
          <span className="truncate">{t("myfiles.mail.openMail")}</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
        </a>
      )}
    </>
  )
}

/** Düz yazı: boşluklar korunur, uzun satır kayar değil sarılır. */
function TextView({ text, cut }) {
  const { t } = useLocale()
  return (
    <div className="flex h-full flex-col bg-background">
      {cut && (
        <p className="shrink-0 border-b border-border/60 bg-card px-4 py-1.5 text-[0.71875rem] text-muted-foreground">
          {t("myfiles.mail.previewCut")}
        </p>
      )}
      <pre
        tabIndex={0}
        className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[0.78125rem] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        {text}
      </pre>
    </div>
  )
}

function Body({ item, onClose }) {
  const { t, locale } = useLocale()
  const content = useAttachmentContent(item, locale)
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      await content.download()
    } catch (err) {
      notify.error(t("myfiles.mail.downloadError"), {
        description: withCause("", causeText(t, errorCause("graph", err))) || undefined,
      })
    } finally {
      setBusy(false)
    }
  }
  const when = item.received
    ? getDateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(item.received),
      )
    : ""
  const meta = [item.from, when, formatSize(item.size, locale)].filter(Boolean).join(" · ")
  const html = useMemo(
    () => (content.kind === "html" ? htmlPreviewDoc(content.text, { scripts: false }) : ""),
    [content.kind, content.text],
  )
  // Tarayıcı PDF'i sayfada göstermiyorsa (Android Chrome gibi) gömülü çerçeve boş kalır:
  // kart ve "Yeni sekmede aç" gösterilir.
  const noPdfViewer =
    content.kind === "pdf" &&
    typeof navigator !== "undefined" &&
    navigator.pdfViewerEnabled === false
  const shown = content.status === "ready" && !noPdfViewer
  const message =
    content.status === "error"
      ? t("myfiles.mail.previewError")
      : content.status === "tooLarge"
        ? t("myfiles.mail.previewTooLarge", { size: formatSize(item.size, locale) })
        : noPdfViewer
          ? t("myfiles.mail.pdfNoViewer")
          : t("myfiles.mail.previewNone")

  return (
    <DialogContent
      showCloseButton={false}
      data-files-layer=""
      // Sohbet rıhtımı pencerede Escape dinliyor: pencereyi kapatan Escape rıhtımı kapatmasın.
      onEscapeKeyDown={(e) => e.stopPropagation()}
      className="flex h-[min(92dvh,56rem)] w-[min(78rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-none sm:max-w-none sm:pb-0"
    >
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <FileBadge item={{ kind: "file", ext: item.ext }} size="md" />
        <div className="min-w-0 flex-1">
          <DialogTitle
            data-private=""
            className="truncate text-[0.875rem] font-semibold leading-tight"
          >
            {item.name}
          </DialogTitle>
          <DialogDescription className="mt-0.5 truncate text-[0.71875rem] leading-tight">
            {meta || t("files.preview")}
            {item.subject && (
              <>
                <span aria-hidden="true"> · </span>
                <span lang="tr" data-private="">
                  {item.subject}
                </span>
              </>
            )}
          </DialogDescription>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Actions item={item} onDownload={download} busy={busy} openUrl={content.url} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("sheet.close")}
          onClick={onClose}
          className="size-8 shrink-0 rounded-lg [&_svg]:!size-4 [@media(pointer:coarse)]:size-10"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border/60 px-4 py-2.5 sm:hidden">
        <Actions item={item} onDownload={download} busy={busy} openUrl={content.url} fill />
      </div>

      <div className="min-h-0 flex-1 bg-foreground/[0.04]">
        {content.status === "loading" && (
          <div className="grid h-full place-items-center">
            <span className="size-7 animate-spin rounded-full border-2 border-foreground/15 border-t-brand motion-reduce:animate-none" />
          </div>
        )}
        {shown && content.kind === "image" && (
          <div className="grid h-full place-items-center overflow-auto p-4">
            <img
              src={content.url}
              alt={item.name}
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg ring-1 ring-foreground/10"
            />
          </div>
        )}
        {shown && content.kind === "pdf" && (
          <iframe
            title={item.name}
            src={content.url}
            className="h-full w-full border-0 bg-background"
          />
        )}
        {shown && content.kind === "text" && <TextView text={content.text} cut={content.cut} />}
        {shown && content.kind === "office" && <OfficeQuickLook data={content.office} />}
        {shown && content.kind === "html" && (
          <iframe
            title={item.name}
            sandbox={HTML_SANDBOX.safe}
            referrerPolicy="no-referrer"
            srcDoc={html}
            className="h-full w-full border-0 bg-white"
          />
        )}
        {content.status !== "loading" && !shown && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <FileBadge item={{ kind: "file", ext: item.ext }} size="lg" />
            <div>
              <p className="max-w-sm text-[0.8125rem] font-medium text-foreground/80">{message}</p>
              {content.status === "error" && (
                <ErrorCause detail={content.detail} className="mx-auto" />
              )}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Actions item={item} onDownload={download} busy={busy} openUrl={content.url} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  )
}
