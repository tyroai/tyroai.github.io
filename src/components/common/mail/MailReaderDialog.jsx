import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowExpandIcon from "@hugeicons/core-free-icons/ArrowExpandIcon"
import ArrowShrinkIcon from "@hugeicons/core-free-icons/ArrowShrinkIcon"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe"
import { useLocale } from "@/hooks/useLocale"
import { useMailReader } from "@/hooks/useMailReader"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { draftReplyWithAssistant } from "./mailAssist"
import { OPTS_FULL_STAMP } from "./mailFormat"
import { ReaderBody } from "./ReaderBody"
import { Recipients } from "./Recipients"

const ICON_BTN =
  "grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"

/**
 * Postanın GENİŞ okuyucusu — Keşfet'in okuma bölmesinin kabuğu ve gövdesi: konu · gönderen
 * kartı (Kime/Bilgi, tarih) · eylemler · kâğıt gövde; masaüstünde sağdan açılan bölme
 * (genişlet/daralt düğmesiyle), telefonda tam ekran.
 *
 * ⚠️ **KONUM ZORUNLU.** `MailPopover`in KÖKÜNDE çizilir, panelin içinde değil: düğmeye basınca
 * odak bölmeye geçiyor, açılır panel kapanıyor ve Radix içeriğini söküyor — panelin içindeki
 * bir bölme doğar doğmaz ölürdü.
 */
export function MailReaderDialog({ mail, photo, onOpenChange }) {
  if (!mail) return null
  // `key`: her posta kendi durumuyla (geniş görünüm, alıcı listesi) açılır.
  return <ReaderSheet key={mail.id} mail={mail} photo={photo} onOpenChange={onOpenChange} />
}

function ReaderSheet({ mail, photo, onOpenChange }) {
  const { t, locale } = useLocale()
  // Geniş görünüm bölmeyi büyütür (bülten tabloları 600–800 px) — Keşfet'in düğmesi.
  const [wide, setWide] = useState(false)
  // Telefonda tam ekran: Geri tuşu ve sol kenardan sağa kaydırma kapatır (iOS geri hareketi gibi).
  const phone = useIsMobile()
  useBackToClose(phone, () => onOpenChange(false))
  const { contentRef, overlayRef, edge } = useEdgeSwipe(() => onOpenChange(false))
  const { body, html, waiting, failed } = useMailReader(mail.id, true)
  const subject = mail.subject || t("mail.noSubject")
  const sender = mail.from || t("mail.unknownSender")
  const stamp = mail.received
    ? getDateTimeFormat(locale, OPTS_FULL_STAMP).format(mail.received)
    : ""

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        overlayRef={overlayRef}
        side="right"
        showCloseButton={false}
        // Sohbet rıhtımı da Escape dinliyor: bölmeyi kapatan Escape rıhtımı kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className={cn(
          "gap-0 overflow-hidden p-0 text-[0.8125rem] transition-[width] data-[side=right]:w-full data-[side=right]:sm:max-w-none sm:rounded-l-2xl",
          wide
            ? "data-[side=right]:sm:w-[min(92rem,calc(100vw-1.5rem))]"
            : "data-[side=right]:sm:w-[min(54rem,calc(100vw-1.5rem))]",
        )}
      >
        {phone && <div {...edge} />}
        <div className="shrink-0 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-4 sm:px-6 sm:pt-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle
                data-private=""
                className="text-pretty text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] [overflow-wrap:anywhere] sm:text-[1.125rem]"
              >
                {subject}
              </SheetTitle>
              {(!mail.isRead || mail.importance === "high" || mail.hasAttachments) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem]">
                  {!mail.isRead && (
                    <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.59375rem] font-semibold text-brand-ink">
                      {t("mail.unreadTag")}
                    </span>
                  )}
                  {mail.importance === "high" && (
                    <span className="flex items-center gap-1 font-semibold text-destructive">
                      <HugeiconsIcon icon={Alert02Icon} className="size-3.5" strokeWidth={2} />
                      {t("mail.important")}
                    </span>
                  )}
                  {mail.hasAttachments && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <HugeiconsIcon
                        icon={Attachment01Icon}
                        className="size-3.5"
                        strokeWidth={1.8}
                      />
                      {t("mail.hasAttachment")}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="-mr-1.5 -mt-0.5 flex shrink-0 items-center gap-0.5">
              {/* Yalnız `sm` üstünde: telefonda bölme zaten ekranın tamamı. */}
              <button
                type="button"
                onClick={() => setWide((v) => !v)}
                aria-pressed={wide}
                aria-label={t(wide ? "feed.narrow" : "feed.wide")}
                title={t(wide ? "feed.narrow" : "feed.wide")}
                className="hidden size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:grid"
              >
                <HugeiconsIcon
                  icon={wide ? ArrowShrinkIcon : ArrowExpandIcon}
                  className="size-4"
                  strokeWidth={2}
                />
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("mail.close")}
                className={ICON_BTN}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* GÖNDEREN KARTI — foto · ad <adres> · Kime / Bilgi · sağda tarih (Keşfet'in bölmesi). */}
          <PersonPopover person={{ name: sender, address: mail.fromAddress }}>
            {(trigger) => (
              <div className="mt-4 flex items-start gap-3">
                {/* Foto, adla AYNI kartı açan fare kısayolu: klavye ve ekran okuyucu adı kullanır. */}
                <button
                  {...trigger}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="grid shrink-0 rounded-full transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <PersonAvatar name={mail.from || "?"} photo={photo} className="size-10" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                    <button
                      {...trigger}
                      data-private=""
                      className="rounded text-left text-[0.875rem] font-semibold underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {sender}
                    </button>
                    {mail.fromAddress && mail.fromAddress !== mail.from?.toLowerCase() && (
                      <span
                        data-private=""
                        className="min-w-0 truncate text-[0.78125rem] text-muted-foreground"
                      >
                        {"<"}
                        {mail.fromAddress}
                        {">"}
                      </span>
                    )}
                  </div>
                  <SheetDescription className="sr-only">{stamp}</SheetDescription>
                  <p
                    aria-hidden="true"
                    className="mt-0.5 text-[0.75rem] text-muted-foreground sm:hidden [&::first-letter]:uppercase"
                  >
                    {stamp}
                  </p>
                  {waiting ? (
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-3.5 w-48 max-w-full rounded-full bg-muted"
                    />
                  ) : (
                    <>
                      <Recipients label={t("feed.mail.to")} list={body?.to} />
                      <Recipients label={t("feed.mail.cc")} list={body?.cc} />
                    </>
                  )}
                </div>
                <time
                  aria-hidden="true"
                  dateTime={mail.received?.toISOString()}
                  className="hidden shrink-0 text-[0.75rem] tabular-nums text-muted-foreground sm:block [&::first-letter]:uppercase"
                >
                  {stamp}
                </time>
              </div>
            )}
          </PersonPopover>

          {/* Eylemler — kartın ikilisi: asistanla yanıt ve Outlook (birincil, sağda). */}
          <div className="mt-3 flex flex-wrap items-center gap-2 max-sm:mb-2">
            <button
              type="button"
              onClick={() => {
                draftReplyWithAssistant(mail, t)
                onOpenChange(false)
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand/30 bg-brand/5 px-3 text-[0.75rem] font-semibold text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
            >
              <HugeiconsIcon icon={AiChat02Icon} className="size-3.5 shrink-0" strokeWidth={2} />
              {t("mail.assist")}
            </button>
            <a
              href={mail.webLink ?? "https://outlook.office.com/mail/"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-solid px-3 text-[0.75rem] font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:ms-auto pointer-coarse:h-11"
            >
              <HugeiconsIcon icon={Mail01Icon} className="size-3.5" strokeWidth={2} />
              {t("mail.openOutlook")}
            </a>
          </div>
        </div>

        <ReaderBody
          post={mail}
          body={body}
          html={html}
          waiting={waiting}
          failed={failed}
          title={subject}
        />
      </SheetContent>
    </Sheet>
  )
}
