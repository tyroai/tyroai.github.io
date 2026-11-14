import "@/lib/i18n/tibot"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { TicketSheet } from "@/components/tibot/TicketSheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { buckets } from "@/lib/tibot/tibotModel"
import { weekOf, weekStart } from "@/lib/tibot/tibotStats"
import { TIBOT_PATH } from "@/lib/tibotPolicy"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { TibotStatPop } from "./TibotStatPop"
import { useTibotStats } from "./useTibotStats"
import { useTibotYear } from "@/hooks/useTibotYear"
import "./tibotPace.css"

const YEAR = new Date().getFullYear()
const DAY = 24 * 60 * 60 * 1000
const R = 52
const C = 2 * Math.PI * R
const WEEKDAY = { weekday: "short" }
const LONG_DAY = { weekday: "long" }

/** Sağ üstte kapsam: Ben (varsayılan) · Ekip — Toplantı ritmi kartının hafta seçicisiyle aynı giysi. */
function ScopeSelect({ value, onChange }) {
  const { t } = useLocale()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={t("tibot.pace.scopeAria")}
        className="gap-1 rounded-full border-border/70 bg-background/60 px-3 text-[0.75rem] font-medium text-muted-foreground shadow-none transition hover:border-foreground/20 hover:text-foreground data-[state=open]:border-foreground/25 data-[state=open]:text-foreground dark:bg-background/40 [@media(pointer:coarse)]:data-[size=default]:h-9"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="end"
        sideOffset={6}
        // Escape RIHTIMA KAÇMAZ (sohbet rıhtımı pencerede Escape dinliyor).
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="min-w-[9.5rem]"
      >
        {["me", "team"].map((id) => (
          <SelectItem key={id} value={id} className="pr-8">
            {t(`tibot.pace.scope.${id}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Halka: payda gerçek veri (atanan ya da açtığın), hedef uydurulmaz; ilk çizimde dolarak gelir. */
function Ring({ done, total, label, aria }) {
  const { locale } = useLocale()
  const reduce = useReducedMotion()
  const share = total > 0 ? Math.min(1, done / total) : 0
  return (
    <Link to={TIBOT_PATH} className="tbq-ring" aria-label={aria}>
      <svg viewBox="0 0 120 120" aria-hidden="true" className="tbq-ring-svg">
        <circle className="tbq-track" cx="60" cy="60" r={R} />
        <motion.circle
          className="tbq-arc"
          data-done={share >= 1 ? "" : undefined}
          cx="60"
          cy="60"
          r={R}
          strokeDasharray={C}
          initial={reduce ? false : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - share) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="tbq-center" aria-hidden="true">
        <span className="tbq-num tabular-nums">
          <AnimatedCounter value={done} locale={locale} fallback={done} />
        </span>
        <span className="tbq-unit">{label}</span>
      </span>
    </Link>
  )
}

/** Bu haftanın yedi günü: yoğunluk dört basamak (sayı ipucunda ve listede), bugün çerçeveli, gelecek boş. */
function Week({ week, lastWeek, now, onOpen }) {
  const { t, locale } = useLocale()
  const start = weekStart(now)
  const max = Math.max(1, ...week.days.map((d) => d.length))
  const diff = week.total - lastWeek
  const day = (i) => getDateTimeFormat(locale, WEEKDAY).format(start + i * DAY + 12 * 3600000)
  const long = (i) => getDateTimeFormat(locale, LONG_DAY).format(start + i * DAY + 12 * 3600000)
  return (
    <div className="tbq-week">
      <p className="tbq-week-title">
        {t("tibot.pace.week")}
        <span className="tabular-nums"> · {week.total}</span>
      </p>
      <ol className="tbq-days">
        {week.days.map((items, i) => {
          const future = i > week.today
          const level = items.length ? Math.ceil((items.length / max) * 4) : 0
          return (
            <li key={i} className="tbq-day">
              <TibotStatPop title={long(i)} items={items} bucket="assigned" onOpen={onOpen}>
                <button
                  type="button"
                  className="tbq-cell"
                  data-level={level}
                  data-today={i === week.today ? "" : undefined}
                  data-future={future ? "" : undefined}
                  disabled={future || !items.length}
                  aria-label={t("tibot.pace.dayAria", { day: long(i), n: items.length })}
                ></button>
              </TibotStatPop>
              <span className="tbq-day-label" aria-hidden="true">
                {day(i)}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="tbq-delta" data-trend={diff > 0 ? "up" : diff < 0 ? "down" : "same"}>
        {diff !== 0 && (
          <HugeiconsIcon
            icon={diff > 0 ? ArrowUp01Icon : ArrowDown01Icon}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        {diff > 0
          ? t("tibot.pace.up", { n: diff })
          : diff < 0
            ? t("tibot.pace.down", { n: -diff })
            : t("tibot.pace.same")}
      </p>
    </div>
  )
}

/**
 * TIBOT · TEMPO — "bu yıl ne kadarını kapattım": tek halka, payda gerçek (BT çalışanında kapattığın
 * / sana atanan, talep edende açtığından kapanan / açtığın; sağ üstte Ekip: ekiplerinde kapanan /
 * gelen; akışın `year` işlemi). Ortada sayı
 * sayaçla gelir; halka Ticket sayfasına götürür. Genişte sağda bu haftanın yedi günü (yoğunluk,
 * bugün çerçeveli) ve geçen haftayla fark. Seri (streak) yok: geçmiş veri yok, baskı kurmaz.
 */
export default function TibotPaceWidget({ className }) {
  const { t, locale } = useLocale()
  const [now] = useState(() => Date.now())
  const { data, bodyStatus, status, busy } = useTibotStats()
  const year = useTibotYear(YEAR)
  const [open, setOpen] = useState(null)
  const [scope, setScope] = useState("me")
  const y = year.data
  const team = scope === "team"
  const staff = (y?.closed ?? 0) > 0 || (y?.assigned ?? 0) > 0
  // Ben: kapattığın / sana atanan (talep edende kapanan / açtığın). Ekip: ekiplerinde kapanan / gelen.
  const done = team ? (y?.teamClosed ?? 0) : staff ? (y?.closed ?? 0) : (y?.openedClosed ?? 0)
  const total = team ? (y?.teamAssigned ?? 0) : staff ? (y?.assigned ?? 0) : (y?.opened ?? 0)
  const { week, lastWeek } = useMemo(() => {
    const v = Object.fromEntries(buckets(data, now).map((b) => [b.id, b.items]))
    return weekOf(team ? [v.team ?? []] : [v.assigned ?? [], v.mine ?? []], now)
  }, [data, now, team])
  const nf = (n) => n.toLocaleString(locale)

  return (
    <WidgetFrame
      personal
      id="tibot-intro"
      title={t("widgets.tibotIntro.title")}
      shortTitle={t("widgets.tibotIntro.short")}
      icon={Ticket01Icon}
      busy={status === "loading" || busy || (!y && !year.failed)}
      className={className}
      action={data?.person ? <ScopeSelect value={scope} onChange={setScope} /> : null}
    >
      <WidgetBody status={bodyStatus} rows={3}>
        {!data?.person ? (
          <WidgetEmpty icon={Ticket01Icon}>{t("tibot.noPerson")}</WidgetEmpty>
        ) : (
          <div className="tbq">
            <div className="tbq-main">
              {year.failed && !y ? (
                <div className="tbq-failed">
                  <p>{t("tibot.pace.failed")}</p>
                  <button type="button" onClick={year.retry} className="tbq-retry">
                    {t("tibot.pace.retry")}
                  </button>
                </div>
              ) : !y ? (
                <span aria-hidden="true" className="tbq-ring tbq-ghost" />
              ) : (
                <>
                  <Ring
                    done={done}
                    total={total}
                    label={t(staff && !team ? "tibot.pace.closed" : "tibot.pace.closedReq")}
                    aria={t("tibot.pace.ringAria", { year: YEAR, done, total })}
                  />
                  <p className="tbq-caption">
                    {total === 0
                      ? t("tibot.pace.zero")
                      : t(
                          team
                            ? "tibot.pace.ofReceived"
                            : staff
                              ? "tibot.pace.ofAssigned"
                              : "tibot.pace.ofOpened",
                          { n: nf(total) },
                        )}
                  </p>
                </>
              )}
            </div>
            <Week week={week} lastWeek={lastWeek} now={now} onOpen={setOpen} />
          </div>
        )}
      </WidgetBody>
      <TicketSheet row={open} onOpenChange={(o) => !o && setOpen(null)} />
    </WidgetFrame>
  )
}
