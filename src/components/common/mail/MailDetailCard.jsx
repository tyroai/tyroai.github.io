import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowExpandIcon from "@hugeicons/core-free-icons/ArrowExpandIcon"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { Separator } from "@/components/ui/separator"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { useMailReader } from "@/hooks/useMailReader"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { draftReplyWithAssistant } from "./mailAssist"
import { OPTS_FULL_STAMP } from "./mailFormat"
import { ReaderBody } from "./ReaderBody"

/**
 * Postanın kartı — çentiğin/header'ın posta panelinde üstüne gelince açılan okuma bölmesi;
 * Anasayfa'nın önizlemesi de aynısını çizer. Gövde Keşfet'in okuyucusuyla AYNI yoldan
 * (`useMailReader`): postanın kendi HTML'i beyaz kâğıtta, gömülü görseller çözülmüş.
 * Gövde gelene kadar Graph'ın 255 karakterlik özeti kartı işe yarar tutar.
 *
 * Sağ üst düğme postayı GENİŞ okuyucuda açar (`onExpand`, Keşfet'in genişlet düğmesi gibi);
 * Outlook yolu altta, tek yerde. `onExpand` yoksa düğme çizilmez: büyük okuyucu panel
 * kapansa da ayakta kalan bir kökte yaşamalı (bkz. `MailReaderDialog`).
 * `footer`: çağıranın kendi eylemi (ör. Keşfet bildirimi → "Keşfet'te aç").
 */
export function MailDetailCard({ m, photo, footer, onExpand }) {
  const { t, locale } = useLocale()
  // Kart yalnız açıkken mount olur: gövde ancak o an istenir.
  const { body, html, waiting, failed } = useMailReader(m.id, Boolean(m.id))

  const toLine = m.to?.length
    ? m.to.slice(0, 3).join(", ") + (m.to.length > 3 ? ` +${m.to.length - 3}` : "")
    : ""
  const subject = m.subject || t("mail.noSubject")

  return (
    <div className="flex min-h-0 flex-col text-[0.75rem]">
      <div className="shrink-0 p-3.5 pb-3">
        <div className="flex items-start gap-2.5">
          <PersonAvatar name={m.from || "?"} photo={photo} className="mt-0.5 size-9" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span data-private="" className="min-w-0 truncate text-[0.8125rem] font-semibold">
                {m.from || t("mail.unknownSender")}
              </span>
              {!m.isRead && (
                <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.59375rem] font-semibold text-brand-ink">
                  {t("mail.unreadTag")}
                </span>
              )}
            </div>
            {m.fromAddress && (
              <p data-private="" className="truncate text-[0.6875rem] text-muted-foreground">
                {m.fromAddress}
              </p>
            )}
          </div>
          {onExpand && (
            <button
              type="button"
              onClick={() => onExpand(m)}
              aria-haspopup="dialog"
              aria-label={t("mail.wide")}
              title={t("mail.wide")}
              className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"
            >
              <HugeiconsIcon icon={ArrowExpandIcon} className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>

        <p data-private="" className="mt-2.5 text-[0.875rem] font-semibold leading-snug">
          {subject}
        </p>

        <div className="mt-2 space-y-1.5 text-foreground/85">
          {m.received && (
            <p className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Clock01Icon}
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="inline-block min-w-0 truncate [&::first-letter]:uppercase">
                {getDateTimeFormat(locale, OPTS_FULL_STAMP).format(m.received)}
              </span>
            </p>
          )}
          {toLine && (
            <p className="flex items-center gap-2">
              <HugeiconsIcon
                icon={UserGroupIcon}
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span data-private="" className="min-w-0 truncate">
                {t("mail.to", { names: toLine })}
              </span>
            </p>
          )}
          {(m.hasAttachments || m.importance === "high") && (
            <p className="flex items-center gap-3">
              {m.importance === "high" && (
                <span className="flex items-center gap-1 font-semibold text-destructive">
                  <HugeiconsIcon icon={Alert02Icon} className="size-3.5" strokeWidth={2} />
                  {t("mail.important")}
                </span>
              )}
              {m.hasAttachments && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={Attachment01Icon} className="size-3.5" strokeWidth={1.8} />
                  {t("mail.hasAttachment")}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Gövde ekranın payından boy alır; kart sığmazsa yalnız o daralır, başlık ve düğmeler
          hep görünür. Tablo kâğıdın İÇİNDE kayar, sayfa taşmaz. */}
      <ReaderBody
        post={m}
        body={body}
        html={html}
        waiting={waiting}
        failed={failed}
        title={subject}
        className="h-[min(20rem,42vh)] flex-auto"
        fallback={
          m.preview ? (
            <div className="h-full overflow-y-auto overscroll-contain p-3.5 py-3">
              <p className="whitespace-pre-line text-[0.71875rem] leading-relaxed text-muted-foreground">
                {m.preview}
              </p>
            </div>
          ) : undefined
        }
      />

      <Separator className="shrink-0" />
      {footer ? (
        <div className="shrink-0 p-3.5 py-3">{footer}</div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 p-3.5 py-3">
          <a
            href={m.webLink ?? "https://outlook.office.com/mail/"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 text-[0.75rem] font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={Mail01Icon} className="size-3.5" strokeWidth={2} />
            {t("mail.openOutlook")}
          </a>
          <button
            type="button"
            onClick={() => draftReplyWithAssistant(m, t)}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand/30 bg-brand/5 px-3 text-[0.75rem] font-semibold text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={AiChat02Icon} className="size-3.5 shrink-0" strokeWidth={2} />
            {t("mail.assist")}
          </button>
        </div>
      )}
    </div>
  )
}
