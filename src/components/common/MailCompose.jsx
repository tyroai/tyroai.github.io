import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import SentIcon from "@hugeicons/core-free-icons/SentIcon"
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { RecipientField } from "@/components/common/RecipientField"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const ROW = "border-b border-border/60"
const ROW_LABEL = "w-16 shrink-0 text-[0.8125rem] text-muted-foreground"
const PILL =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-55"

/**
 * POSTA PENCERESİ — dosya gönderme (Dosyalarım, sohbetteki dosyalar) ve imzala & gönder aynı
 * kalıbı paylaşır: gri kabuk, başlıkta paletin renginde simge kutusu; ortada beyaz kart — `top`
 * (imza alanı), Kime (sağında "Bilgi" aç), Bilgi, Konu satırları ince çizgiyle ayrılır, mesaj
 * çerçevesiz, altta ek kartı; en altta not + yuvarlak düğmeler (`secondary`, gönder). `preview`
 * verilirse geniş ekranda solda, ayraçla ayrılmış önizleme bölümü. Başlıktaki düğme pencereyi tam
 * ekrana alır (önizleme büyür), yeniden basınca eski boyuna döner.
 */
export function MailCompose({
  icon,
  title,
  subtitle,
  onClose,
  preview = null,
  top = null,
  to,
  onTo,
  toHint = null,
  cc,
  onCc,
  suggestions,
  subject,
  onSubject,
  body,
  onBody,
  bodyPlaceholder,
  attachment,
  error = null,
  note,
  secondary = null,
  send,
  layerProps = {},
}) {
  const { t } = useLocale()
  const [showCc, setShowCc] = useState(cc.length > 0)
  const [full, setFull] = useState(false)
  const ccButton = !showCc && (
    <button
      type="button"
      onClick={() => setShowCc(true)}
      className="rounded-md px-1.5 py-1 text-[0.75rem] font-medium text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground"
    >
      {t("mail.compose.cc")}
    </button>
  )
  return (
    <DialogContent
      showCloseButton={false}
      {...layerProps}
      // Sohbet rıhtımı pencerede Escape dinliyor: kutuyu kapatan Escape rıhtımı da kapatmasın.
      onEscapeKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[1.75rem] border-border/60 bg-muted p-0 sm:max-h-[calc(100dvh-1.5rem)] sm:w-full sm:max-w-[34rem] sm:pb-0",
        preview &&
          !full &&
          "lg:h-[min(54rem,calc(100dvh-2rem))] lg:w-[calc(100vw-2rem)] lg:max-w-[82rem]",
        full &&
          "h-[calc(100dvh-1rem)] max-h-none w-[calc(100vw-1rem)] sm:max-h-none sm:w-[calc(100vw-1rem)] sm:max-w-none",
      )}
    >
      <div className="flex shrink-0 items-center gap-3.5 px-6 pb-4 pt-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-fill-deep text-brand-on-brand shadow-sm">
          <HugeiconsIcon icon={icon} aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-[1.0625rem] font-semibold tracking-[-0.01em]">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-0.5 truncate text-[0.75rem] leading-tight">
            {subtitle}
          </DialogDescription>
        </div>
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          aria-label={t(full ? "mail.compose.shrink" : "mail.compose.expand")}
          aria-pressed={full}
          title={t(full ? "mail.compose.shrink" : "mail.compose.expand")}
          className="hidden size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:grid"
        >
          <HugeiconsIcon
            icon={full ? ArrowShrink01Icon : ArrowExpand01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("sheet.close")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 px-3",
          preview && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(26rem,34rem)]",
        )}
      >
        {preview && (
          <div className="hidden min-h-0 min-w-0 lg:me-3 lg:flex lg:border-e lg:border-border/70 lg:pe-3">
            {preview}
          </div>
        )}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[1.375rem] bg-background px-6 py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_28px_-14px_rgb(0_0_0/0.14)] ring-1 ring-border/60"
          // Genel kural sağda kalıcı oluk ayırıyor (içerik sola kayardı); iki kenarda eşit.
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          {top && <div className={cn(ROW, "space-y-2 pb-3.5 pt-3.5")}>{top}</div>}
          <div className={ROW}>
            <RecipientField
              inline
              id="mail-to"
              label={t("files.mailTo")}
              value={to}
              onChange={onTo}
              suggestions={suggestions}
              placeholder={t("files.mailToPlaceholder")}
              action={ccButton}
            />
            {toHint && (
              <p className="-mt-1 pb-2.5 ps-[4.75rem] text-[0.6875rem] leading-snug text-muted-foreground">
                {toHint}
              </p>
            )}
          </div>
          {showCc && (
            <div className={ROW}>
              <RecipientField
                inline
                id="mail-cc"
                label={t("mail.compose.cc")}
                value={cc}
                onChange={onCc}
                suggestions={suggestions}
                placeholder={t("files.mailCcPlaceholder")}
              />
            </div>
          )}
          <div className={cn(ROW, "flex items-center gap-3 py-2.5")}>
            <label htmlFor="mail-subject" className={ROW_LABEL}>
              {t("files.mailSubject")}
            </label>
            <input
              id="mail-subject"
              value={subject}
              onChange={(e) => onSubject(e.target.value)}
              className="no-ios-zoom h-10 min-w-0 flex-1 bg-transparent text-[0.875rem] font-semibold text-foreground outline-none"
            />
          </div>
          <textarea
            aria-label={t("files.mailBody")}
            value={body}
            onChange={(e) => onBody(e.target.value)}
            placeholder={bodyPlaceholder}
            rows={4}
            className="no-ios-zoom block min-h-24 w-full resize-none bg-transparent py-3.5 [field-sizing:content] text-[0.8125rem] leading-relaxed text-foreground outline-none"
          />
          {attachment && (
            <div className="border-t border-border/60 pb-4 pt-3.5">
              <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t("mail.compose.attachments")}
              </p>
              <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background p-3 shadow-xs">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-[0.6875rem] font-bold uppercase tracking-wide text-brand-ink ring-1 ring-brand/10">
                  {attachment.badge}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-semibold text-foreground">
                    {attachment.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground">
                    {attachment.meta}
                  </span>
                </span>
              </div>
            </div>
          )}
          {error && (
            <p className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-[0.75rem] leading-snug text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-6 pb-5 pt-3.5">
        <p className="min-w-0 basis-full text-[0.6875rem] leading-snug text-muted-foreground sm:basis-0 sm:flex-1">
          {note}
        </p>
        {secondary && (
          <button
            type="button"
            disabled={secondary.disabled}
            onClick={secondary.onClick}
            className={cn(
              PILL,
              "ms-auto border border-border bg-background text-foreground shadow-xs hover:bg-foreground/[0.04]",
            )}
          >
            <HugeiconsIcon
              icon={secondary.icon}
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.9}
            />
            {secondary.label}
          </button>
        )}
        <button
          type="button"
          disabled={send.disabled}
          aria-busy={send.busy || undefined}
          title={send.title}
          onClick={send.onClick}
          className={cn(
            PILL,
            "bg-brand-solid px-5 text-brand-on-brand shadow-sm hover:brightness-110",
            !secondary && "ms-auto",
          )}
        >
          <HugeiconsIcon
            icon={send.busy ? Loading03Icon : SentIcon}
            aria-hidden="true"
            className={cn(
              "size-4",
              send.busy ? "animate-spin motion-reduce:animate-none" : "rtl:-scale-x-100",
            )}
            strokeWidth={1.9}
          />
          {send.label}
        </button>
      </div>
    </DialogContent>
  )
}
