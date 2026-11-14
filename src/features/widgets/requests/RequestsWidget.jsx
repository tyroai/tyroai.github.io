import "@/lib/i18n/selfService"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import ClipboardClockIcon from "@hugeicons/core-free-icons/ClipboardClockIcon"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { cn } from "@/lib/utils"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { PageBody, Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { requestRow } from "./requestRow"
import { useMyRequests } from "./useMyRequests"
import "./requests.css"

// Self Servis soruları birincil asistana (İK araçları onda; Self Servis sayfasıyla aynı).
const OFFICE = "tyroOffice"
const TONE = {
  warning: "bg-warning/12 text-warning-ink",
  info: "bg-brand/10 text-brand-ink",
  neutral: "bg-muted/60 text-muted-foreground",
}
const ROW =
  "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 text-start outline-none transition hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40"

// Fareli cihazda soru sorulunca imleç sohbetin yazma alanına geçer; dokunmatikte klavye açılmasın.
const finePointer = () => Boolean(window.matchMedia?.("(pointer: fine)").matches)

function ask(question) {
  setPendingAsk({ question, agent: OFFICE })
  requestOpenChat({ focusComposer: finePointer() })
}

function Row({ item }) {
  const { t, locale } = useLocale()
  const row = requestRow(item, { t, locale })
  const body = (
    <>
      <span
        className={cn("rq-icon grid size-8 shrink-0 place-items-center rounded-xl", TONE[row.tone])}
      >
        <HugeiconsIcon icon={row.icon} className="size-4" strokeWidth={1.8} />
      </span>
      <span data-private="" className="min-w-0 flex-1">
        <span
          data-wrap={row.sub ? undefined : ""}
          className="rq-title block text-[0.8125rem] font-medium leading-snug"
        >
          {row.title}
        </span>
        {row.sub && (
          <span className="rq-sub block truncate text-[0.6875rem] text-muted-foreground">
            {row.sub}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-[0.75rem] font-medium text-brand">
        <span className="rq-action">{row.action}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-3.5 rtl:rotate-180"
          strokeWidth={2}
        />
      </span>
    </>
  )
  return (
    <li className="-mx-2">
      {row.ask ? (
        <button type="button" onClick={() => ask(row.ask)} className={ROW}>
          {body}
        </button>
      ) : (
        <Link to={row.to} className={ROW}>
          {body}
        </Link>
      )}
    </li>
  )
}

/**
 * Taleplerim — Self Servis'te seni bekleyen her şey tek listede, her satırda tek eylem: iade
 * edilen kayıt, gönderilmemiş masraf raporu, kapatılmamış avans, yarım kalan form, onaydaki
 * talepler, yıl sonuna kalan izin (`features/widgets/lib/myRequests`). Sayfa başına üç satır. Veri Self Servis'in
 * tam okuması (`useMyRequests`); yalnız Self Servis'e erişimi olana açık.
 */
export function RequestsWidget({ ctx, className }) {
  const { t } = useLocale()
  const { status, items } = useMyRequests(ctx.now)
  const pager = usePager(items, 3)
  return (
    <WidgetFrame
      id="requests"
      title={t("widgets.requests.title")}
      icon={ClipboardClockIcon}
      busy={status === "loading"}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.requests.title")} />}
    >
      {status === "notFound" ? (
        <WidgetEmpty icon={ClipboardClockIcon}>{t("selfService.state.notFound.title")}</WidgetEmpty>
      ) : (
        <WidgetBody status={status}>
          {items.length ? (
            <PageBody pager={pager} className="mt-2 space-y-0.5">
              {pager.items.map((item) => (
                <Row key={item.key} item={item} />
              ))}
            </PageBody>
          ) : (
            <WidgetEmpty icon={CheckmarkCircle02Icon}>{t("widgets.requests.empty")}</WidgetEmpty>
          )}
        </WidgetBody>
      )}
    </WidgetFrame>
  )
}
