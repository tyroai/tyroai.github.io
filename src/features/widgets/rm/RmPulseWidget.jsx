import { useMemo, useRef } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Pulse01Icon from "@hugeicons/core-free-icons/Pulse01Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useRmData } from "@/features/rm/data/useRmData"
import { useLocale } from "@/hooks/useLocale"
import { errorCause } from "@/lib/errorCause"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { todayDay } from "@/lib/rm/engine/dates"
import { rmPulse } from "@/features/widgets/lib/rm/pulse"
import { cn } from "@/lib/utils"
import { useNarrow } from "../useNarrow"
import { WidgetBody } from "../WidgetBody"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import "@/components/common/fill.css"

const LONG = { month: "long" }
const SHORT = { month: "short" }
const PCT = { style: "percent", maximumFractionDigits: 0 }
const NAMES = 2
// Bu genişliğin altında (sağ sütunun en dar hâli) yalnız ay adı ve sayılar kalır.
const TIGHT_PX = 128
// tyroRM'in doluluk tonları: aşım kırmızı, yüksek kehribar, olağan marka.
const BAR = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-muted" }
const TEXT = { over: "text-danger-ink", high: "text-warning-ink", ok: "text-foreground", none: "" }
const ROW =
  "-mx-2 rounded-xl px-2 transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

function Chevron({ className }) {
  return (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      aria-hidden="true"
      className={cn("size-3.5 shrink-0 rtl:rotate-180", className)}
      strokeWidth={2}
    />
  )
}

/** Sayı önde, cümle gibi okunur ("11 Kapasiteyi aşanlar"); adlar yalnız geniş kartta. */
function Stat({ count, label, names, to, tight, num }) {
  return (
    <Link to={to} className={cn(ROW, "flex min-h-11 items-center gap-2.5")}>
      <span
        className={cn(
          "min-w-6 shrink-0 text-[1.0625rem] font-semibold tabular-nums",
          count ? "text-danger-ink" : "text-muted-foreground",
        )}
      >
        {num.format(count)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[0.8125rem] font-medium leading-tight">{label}</span>
        {names && (
          <span className="block truncate text-[0.75rem] text-muted-foreground @max-[16rem]/widget:hidden">
            {names}
          </span>
        )}
      </span>
      {!tight && <Chevron className="text-muted-foreground" />}
    </Link>
  )
}

/**
 * tyroRM nabzı — yalnız tyroRM yetkisi olana (katalogda da): bu ayın proje doluluğu (çubuk,
 * tyroRM'in tonlarıyla) ve gelecek ay, kapasiteyi aşanlar ve takvim riskindeki projeler. Doluluk
 * Genel bakış'ı, satırlar Kapasite ve Projeler sayfalarını açar. Plan tyroRM'in veri katmanından
 * (bölümle aynı önbellek). Dar kartta başlık eylemi yok (doluluk zaten bağlantı), adlar gizli.
 */
export default function RmPulseWidget({ className }) {
  const { t, locale } = useLocale()
  const data = useRmData()
  const today = todayDay()
  const body = useRef(null)
  const tight = useNarrow(body, TIGHT_PX)
  const pulse = useMemo(
    () => (data.st && data.plan ? rmPulse(data.st, data.plan, today) : null),
    [data.st, data.plan, today],
  )
  const month = (mo, opts = LONG) =>
    mo ? getDateTimeFormat(locale, opts).format(new Date(mo.y, mo.m, 1)) : ""
  const pct = getNumberFormat(locale, PCT)
  const num = getNumberFormat(locale)
  const status = pulse ? "ready" : data.status === "error" ? "error" : "loading"
  const names = (list) =>
    list.length
      ? list
          .slice(0, NAMES)
          .map((x) => x.name)
          .join(", ") +
        (list.length > NAMES ? ` ${t("widgets.rm.more", { n: list.length - NAMES })}` : "")
      : null
  const utilText = pulse?.util == null ? "—" : pct.format(pulse.util)
  return (
    <WidgetFrame
      id="rm-pulse"
      title={t("widgets.rm.title")}
      shortTitle={t("widgets.rm.titleShort")}
      icon={Pulse01Icon}
      busy={status === "loading"}
      className={className}
      action={
        <FrameAction to="/rm" className="@max-[16rem]/widget:hidden">
          {t("widgets.rm.open")}
          <Chevron />
        </FrameAction>
      }
    >
      <div ref={body} className="flex min-h-0 flex-1 flex-col">
        <WidgetBody status={status === "loading" ? "loading" : "ready"} rows={3}>
          {status === "error" || !pulse ? (
            <>
              <p className="mt-3 text-[0.8125rem] text-muted-foreground">{t("widgets.rm.error")}</p>
              <ErrorCause
                detail={data.error ? errorCause("dataverse", data.error) : null}
                className="mt-2"
              />
            </>
          ) : (
            <div className="mt-2 flex min-h-0 flex-1 flex-col">
              <Link to="/rm" className={cn(ROW, "block py-1")}>
                <span className="block truncate text-[0.75rem] text-muted-foreground [&::first-letter]:uppercase">
                  {tight ? month(pulse.month) : t("widgets.rm.util", { month: month(pulse.month) })}
                </span>
                <span className="mt-1 flex items-end justify-between gap-2">
                  <span
                    className={cn(
                      "text-[1.75rem] font-semibold leading-none tabular-nums",
                      TEXT[pulse.tone],
                    )}
                  >
                    {utilText}
                  </span>
                  {!tight && pulse.next && pulse.utilNext != null && (
                    <span className="shrink-0 text-[0.75rem] text-muted-foreground tabular-nums [&::first-letter]:uppercase">
                      <span className="@max-[16rem]/widget:hidden">{month(pulse.next)}</span>
                      <span className="hidden @max-[16rem]/widget:inline">
                        {month(pulse.next, SHORT)}
                      </span>{" "}
                      {pct.format(pulse.utilNext)}
                    </span>
                  )}
                </span>
                <span
                  role="img"
                  aria-label={t("widgets.rm.barAria", { month: month(pulse.month), pct: utilText })}
                  className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <span
                    className={cn("fx-bar block h-full rounded-full", BAR[pulse.tone])}
                    style={{ width: `${Math.min(100, Math.round((pulse.util ?? 0) * 100))}%` }}
                  />
                </span>
              </Link>
              <div className="mt-auto space-y-0.5 pt-1">
                <Stat
                  count={pulse.over.length}
                  label={t("widgets.rm.over")}
                  names={names(pulse.over)}
                  to="/rm?view=kapasite"
                  tight={tight}
                  num={num}
                />
                <Stat
                  count={pulse.risky.length}
                  label={t("widgets.rm.risk")}
                  names={names(pulse.risky)}
                  to="/rm?view=projeler"
                  tight={tight}
                  num={num}
                />
              </div>
            </div>
          )}
        </WidgetBody>
      </div>
    </WidgetFrame>
  )
}
