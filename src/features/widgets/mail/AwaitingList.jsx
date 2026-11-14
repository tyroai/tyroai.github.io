import MailSend01Icon from "@hugeicons/core-free-icons/MailSend01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { AWAIT_DAYS, AWAIT_MIN_DAYS } from "@/features/widgets/lib/mailFollow"
import { ago } from "../format"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { PageBody } from "../paging/Pager"

/** Alıcılar kısa: "Ayşe Yılmaz +2". */
const toText = (names) => (names.length > 1 ? `${names[0]} +${names.length - 1}` : (names[0] ?? ""))

/** "Yanıt bekleyen"in açıklama satırı: hangi postalar sayılıyor. */
export function AwaitingSummary() {
  const { t } = useLocale()
  return (
    <p className="min-w-0 truncate text-[0.75rem] text-muted-foreground">
      {t("widgets.mail.awaitSummary", { days: AWAIT_DAYS, min: AWAIT_MIN_DAYS })}
    </p>
  )
}

/**
 * "Yanıt bekleyen" görünümü: son 14 günde gönderip en az iki gündür yanıt alamadığın postalar
 * (`features/widgets/lib/awaitingReply`); satır postayı Outlook'ta açar.
 */
export function AwaitingList({ res, pager }) {
  const { t, locale } = useLocale()
  return (
    <WidgetBody status={res.status} rows={3}>
      {pager.items.length ? (
        <PageBody pager={pager} className="mt-1">
          {pager.items.map((m) => (
            <li key={m.id}>
              <a
                href={m.webLink ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-xl px-2 transition hover:bg-accent/60"
              >
                <PersonAvatar name={m.to[0] ?? ""} className="size-7 text-[0.6875rem]" />
                <span data-private="" className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium">
                    {m.subject || t("widgets.mail.noSubject")}
                  </span>
                  <span className="block truncate text-[0.6875rem] text-muted-foreground">
                    {t("widgets.mail.to", { names: toText(m.to) })} · {ago(m.sent, locale)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </PageBody>
      ) : (
        <WidgetEmpty icon={MailSend01Icon}>{t("widgets.mail.awaitEmpty")}</WidgetEmpty>
      )}
    </WidgetBody>
  )
}
