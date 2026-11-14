import "@/lib/i18n/tibot"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import { TicketSheet } from "@/components/tibot/TicketSheet"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { runway } from "@/lib/tibot/tibotDeck"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { TibotStatPop } from "./TibotStatPop"
import { useTibotStats } from "./useTibotStats"
import "./tibotRunway.css"

const DAY = 24 * 60 * 60 * 1000
const ROWS = 5
const WEEKDAY = { weekday: "short" }
const time = (iso) => (iso ? Date.parse(iso) || 0 : 0)
const targetAt = (row) => time(row.nextTargetAt) || time(row.resolutionTargetAt)

/** Noktanın tonu: geçen kırmızı, 24 saat içinde dolan sarı, ileridekiler marka, hedefsiz boş. */
function toneOf(col, row, now) {
  if (col.key === "late") return "danger"
  const at = targetAt(row)
  if (!at || row.status === "waiting_for_customer") return "hollow"
  return at - now < DAY ? "warning" : "brand"
}

function label(col, t, locale, now) {
  if (col.key === "late") return t("tibot.runway.late")
  if (col.key === "week") return t("tibot.runway.week")
  if (col.key === "later") return t("tibot.runway.later")
  if (col.offset === 0) return t("tibot.runway.today")
  if (col.offset === 1) return t("tibot.runway.tomorrow")
  return getDateTimeFormat(locale, WEEKDAY).format(now + col.offset * DAY)
}

/** Sütun: üstte sayı, ortada nokta yığını (en çok 5 sıra; fazlası "+n"), altta ad. */
function Column({ col, now, onOpen }) {
  const { t, locale } = useLocale()
  const name = label(col, t, locale, now)
  const n = col.items.length
  const over = n > ROWS
  const dots = col.items.slice(0, over ? ROWS - 1 : ROWS)
  return (
    <li className="min-w-0">
      <TibotStatPop title={name} items={col.items} bucket="assigned" onOpen={onOpen}>
        <button
          type="button"
          className="tbp-col"
          data-key={col.key}
          data-today={col.key === "day" && col.offset === 0 ? "" : undefined}
          disabled={!n}
          aria-label={t("tibot.runway.colAria", { label: name, n })}
        >
          <span className="tbp-n tabular-nums" aria-hidden="true">
            {n || "·"}
          </span>
          <span className="tbp-dots" aria-hidden="true">
            {dots.map((row) => (
              <span key={row.requestId} className="tbp-dot" data-tone={toneOf(col, row, now)} />
            ))}
            {over && <span className="tbp-more tabular-nums">+{n - (ROWS - 1)}</span>}
          </span>
          <span className="tbp-label" aria-hidden="true">
            {name}
          </span>
        </button>
      </TibotStatPop>
    </li>
  )
}

/** Haftanın özeti (geniş kart): bu hafta dolan hedef ve en yoğun gün. */
function Foot({ cols, now }) {
  const { t, locale } = useLocale()
  const days = cols.filter((c) => c.key === "day")
  const total = days.reduce((s, c) => s + c.items.length, 0)
  if (!total) return <p className="tbp-foot">{t("tibot.runway.footNone")}</p>
  const top = days.reduce((a, b) => (b.items.length > a.items.length ? b : a))
  return (
    <p className="tbp-foot">
      {t("tibot.runway.foot", {
        n: total,
        day: label(top, t, locale, now),
        max: top.items.length,
      })}
    </p>
  )
}

/**
 * TIBOT · PİST — hedeflerin nereye düştüğü: sana atanan her talep bir nokta, hedef gününün
 * sütununda (`tibotDeck.runway`). Dar kartta Geçti · Bugün · Yarın · Hafta · Sonra, genişte
 * Geçti · yedi gün · Sonra ve altta haftanın özeti. Bugün yumuşak bir zeminde; renk anlamı sayı ve
 * adla da söylenir. Sütuna basınca o günün talepleri (`TibotStatPop`), talebe basınca ayrıntı.
 */
export default function TibotRunwayWidget({ className }) {
  const { t } = useLocale()
  const now = useMinuteNow().getTime()
  const { stats, data, bodyStatus, status, busy } = useTibotStats()
  const [open, setOpen] = useState(null)
  const items = stats.onMe.items
  const narrow = useMemo(() => runway(items, now, 2, true), [items, now])
  const wide = useMemo(() => runway(items, now, 7), [items, now])
  const clear = items.length === 0

  return (
    <WidgetFrame
      personal
      id="tibot-rhythm"
      title={t("widgets.tibotRhythm.title")}
      shortTitle={t("widgets.tibotRhythm.short")}
      icon={Ticket01Icon}
      busy={status === "loading" || busy}
      className={className}
    >
      <WidgetBody status={bodyStatus} rows={3}>
        {!data?.person ? (
          <WidgetEmpty icon={Ticket01Icon}>{t("tibot.noPerson")}</WidgetEmpty>
        ) : (
          <div className="tbp" data-clear={clear ? "" : undefined}>
            {/* İki düzen de çizilir; kartın enine göre biri görünür (kap sorgusu, `tibotRunway.css`). */}
            <ol className="tbp-cols tbp-narrow">
              {narrow.map((col) => (
                <Column key={`${col.key}${col.offset}`} col={col} now={now} onOpen={setOpen} />
              ))}
            </ol>
            <ol className="tbp-cols tbp-wide">
              {wide.map((col) => (
                <Column key={`${col.key}${col.offset}`} col={col} now={now} onOpen={setOpen} />
              ))}
            </ol>
            {clear ? (
              <p className="tbp-clear">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} aria-hidden="true" />
                {t("tibot.runway.clear")}
              </p>
            ) : (
              <div className="tbp-wide-only">
                <Foot cols={wide} now={now} />
              </div>
            )}
          </div>
        )}
      </WidgetBody>
      <TicketSheet row={open} onOpenChange={(o) => !o && setOpen(null)} />
    </WidgetFrame>
  )
}
