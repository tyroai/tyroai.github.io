import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import InboxUnreadIcon from "@hugeicons/core-free-icons/InboxUnreadIcon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { useLocale } from "@/hooks/useLocale"
import { useWidgetData } from "@/hooks/useWidgetData"
import { AWAIT_TTL, fetchAwaitingReply, idleAwaiting } from "@/features/widgets/lib/awaitingReply"
import { sortFlagged } from "@/features/widgets/lib/mailFollow"
import { requestPanel } from "@/lib/panelBus"
import { fetchPendingMail } from "@/features/widgets/lib/widgetSources"
import { ago } from "./format"
import { AwaitingList, AwaitingSummary } from "./mail/AwaitingList"
import { DueChip } from "./mail/DueChip"
import { WidgetBody } from "./WidgetBody"
import { WidgetEmpty } from "./WidgetEmpty"
import { FrameAction, WidgetFrame } from "./WidgetFrame"
import { PageBody, Pager } from "./paging/Pager"
import { usePager } from "./paging/usePager"
import { formatCount } from "@/lib/intl-cache"
import { isolate } from "@/lib/bidi"

function Row({ m, locale, now }) {
  return (
    <li>
      <a
        href={m.webLink ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-xl px-2 transition hover:bg-accent/60"
      >
        <PersonAvatar name={m.from} className="size-7 text-[0.625rem]" />
        <span data-private="" className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {m.important && (
              <span aria-hidden="true" className="font-bold text-red-600 dark:text-red-400">
                !
              </span>
            )}
            <span dir="auto" title={m.subject} className="truncate text-[0.8125rem] font-medium">
              {m.subject}
            </span>
          </span>
          <span className="block truncate text-[0.6875rem] text-muted-foreground">
            {isolate(m.from)} · {ago(m.received, locale)}
          </span>
        </span>
        {m.flagged && m.due ? (
          <DueChip due={m.due} now={now} />
        ) : (
          m.flagged && (
            <HugeiconsIcon
              icon={Flag02Icon}
              className="size-3.5 shrink-0 fill-current text-red-500"
              strokeWidth={1.8}
            />
          )
        )}
      </a>
    </li>
  )
}

/**
 * Bekleyen postalar — takip masası, iki görünüm:
 * - **Gelen:** önce bayraklılar vadesine göre (gecikenler başta, "−2g" kırmızı; vadesizler sonda,
 *   en uzun bekleyen önce — `features/widgets/lib/mailFollow`), sonra gelen kutusunun okunmamışları;
 * - **Yanıt bekleyen:** son 14 günde gönderip en az iki gündür yanıt alamadığın postalar; yalnız bu
 *   görünüm açılınca okunur (`features/widgets/lib/awaitingReply`).
 * Satıra basınca posta Outlook'ta açılır (bayrak burada kaldırılmaz); "Posta" uygulamanın posta
 * panelini açar.
 */
export function PendingMailWidget({ className }) {
  const { t, locale } = useLocale()
  const now = useMinuteNow()
  const [view, setView] = useState("inbox")
  const awaitingOn = view === "awaiting"
  const res = useWidgetData("pending-mail", fetchPendingMail)
  const awaiting = useWidgetData(
    awaitingOn ? "awaiting-reply" : "awaiting-idle",
    awaitingOn ? fetchAwaitingReply : idleAwaiting,
    AWAIT_TTL,
  )
  const inbox = useMemo(() => {
    const flagged = sortFlagged(res.data?.flagged ?? [])
    const unread = (res.data?.unread ?? []).filter((m) => !flagged.some((f) => f.id === m.id))
    return [...flagged, ...unread]
  }, [res.data])
  const flaggedCount = res.data?.flaggedTotal ?? res.data?.flagged?.length ?? 0
  const total = res.data?.unreadTotal
  const summary =
    total != null
      ? t("widgets.mail.summary", {
          n: formatCount(locale, total),
          f: formatCount(locale, flaggedCount),
        })
      : ""
  // Görünüm seçici bir satır aldı: kartın sabit boyunda sayfa başına iki posta.
  const pager = usePager(awaitingOn ? (awaiting.data?.items ?? []) : inbox, 2)
  return (
    <WidgetFrame
      id="pending-mail"
      title={t("widgets.mail.title")}
      shortTitle={t("widgets.mail.titleShort")}
      icon={InboxUnreadIcon}
      busy={res.status === "loading" || (awaitingOn && awaiting.status === "loading")}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.mail.title")} />}
    >
      <SegmentedControl
        fill
        label={t("widgets.mail.viewLabel")}
        value={view}
        onChange={setView}
        options={[
          { value: "inbox", label: t("widgets.mail.tab.inbox") },
          { value: "awaiting", label: t("widgets.mail.tab.awaiting") },
        ]}
        itemClassName="h-7 px-2.5 text-[0.75rem]"
        className="mt-1"
      />
      {/* Başlıkta sayfa çevirici var: panel kısayolu özet satırının sonunda. */}
      <div className="mt-1.5 flex min-h-6 items-center justify-between gap-2">
        {awaitingOn ? (
          <AwaitingSummary />
        ) : (
          // Dar kartta kesilir: tam metin üstüne gelince.
          <p
            title={summary || undefined}
            className="min-w-0 truncate text-[0.75rem] text-muted-foreground"
          >
            {summary}
          </p>
        )}
        <FrameAction onClick={() => requestPanel("mail")} className="-me-2.5 h-6">
          {t("widgets.mail.open")}
        </FrameAction>
      </div>
      {awaitingOn ? (
        <AwaitingList res={awaiting} pager={pager} />
      ) : (
        <WidgetBody status={res.status} rows={3}>
          {pager.items.length ? (
            <PageBody pager={pager} className="mt-1">
              {pager.items.map((m) => (
                <Row key={m.id} m={m} locale={locale} now={now} />
              ))}
            </PageBody>
          ) : (
            <WidgetEmpty icon={InboxUnreadIcon}>{t("widgets.mail.empty")}</WidgetEmpty>
          )}
        </WidgetBody>
      )}
    </WidgetFrame>
  )
}
