import { useId, useMemo } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import AirplaneTakeOff01Icon from "@hugeicons/core-free-icons/AirplaneTakeOff01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import ChartColumnIcon from "@hugeicons/core-free-icons/ChartColumnIcon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Target03Icon from "@hugeicons/core-free-icons/Target03Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { DayStrip } from "./DayStrip"
import { insightRows } from "./insightRows"
import { useInsightAction } from "./useInsightAction"
import "./insightBody.css"

const ICONS = {
  load: Calendar03Icon,
  gaps: Clock01Icon,
  week: ChartColumnIcon,
  tasks: CheckmarkCircle02Icon,
  away: Beach02Icon,
  trip: AirplaneTakeOff01Icon,
  bridge: Beach02Icon,
}

/**
 * Günün okumasının gövdesi (tembel parça) — hikâyeyi adım adım keşfettirir: önce günün şeridi
 * (`DayStrip`: dilimlere dokununca hikâyesi), sonra en çok dört hikâye satırı (Yük · Boşluk · Hafta
 * · İşler; izin, yolculuk, köprüde o satır başta). Satır tam genişlikte bir satır: başında simge
 * kutusu, etiket, değer ve açıklaması; bir yere götürüyorsa (takvim, To-Do) sağda ok, üstüne
 * gelince zemin tonu, basınca basma hissi — tıklanabildiği ilk bakışta belli. Sonda tek eylem (paletin
 * düz dolgusu; ne yapacağı altında) ve kaynak notu. Renkler kabın görünümünden (`--ib-*`).
 */
export default function InsightBody({ insight, events, tasks, now, onChanged, close }) {
  const { t, locale } = useLocale()
  const text = useMemo(() => insightRows(insight, { t, locale }), [insight, t, locale])
  const act = useInsightAction({ action: text.action, events, tasks, now, onChanged })
  const whyId = useId()
  const f = insight.facts
  const highlight = text.action?.kind === "focus" ? text.action : f.window
  // Satır bir yere götürür (işlevsel ipucu): yük, boşluk ve hafta takvime, işler To-Do'ya — sayfa
  // kişiye açıksa.
  const access = usePageAccess()
  const routeOf = (key) =>
    key === "tasks"
      ? access.todo && "/todo"
      : ["load", "gaps", "week"].includes(key) && access.calendar && "/calendar"
  return (
    <div className="insight-body">
      {(f.meetings > 0 || f.windows.length > 0) && !f.away && (
        <DayStrip
          day={insight.date}
          f={f}
          highlight={highlight}
          events={events}
          locale={locale}
          t={t}
        />
      )}
      <ul className="ib-rows">
        {text.rows.map((r) => {
          const to = routeOf(r.key)
          const inner = (
            <>
              <span aria-hidden="true" className="ib-icon" data-key={r.key}>
                <HugeiconsIcon icon={ICONS[r.key] ?? Calendar03Icon} strokeWidth={1.8} />
              </span>
              <span className="ib-text">
                <span className="ib-label">{r.label}</span>
                <span data-private="" className="ib-value">
                  {r.value}
                </span>
                {r.sub && <span className="ib-sub">{r.sub}</span>}
              </span>
              {to && (
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="ib-chev rtl:rotate-180"
                />
              )}
            </>
          )
          return (
            <li key={r.key}>
              {to ? (
                <Link to={to} className="ib-row" data-go="" onClick={() => close?.()}>
                  {inner}
                </Link>
              ) : (
                <div className="ib-row">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
      {text.action && (
        <div className="insight-body__act">
          <button
            type="button"
            className="insight-body__btn"
            aria-describedby={whyId}
            disabled={act.state !== "idle"}
            data-state={act.state}
            onClick={() => act.run(close)}
          >
            <HugeiconsIcon
              icon={
                act.state === "done"
                  ? Tick02Icon
                  : text.action.kind === "focus"
                    ? Target03Icon
                    : ArrowRight01Icon
              }
              className={text.action.kind === "focus" ? undefined : "rtl:rotate-180"}
              strokeWidth={2}
              aria-hidden="true"
            />
            {act.state === "done" ? t("insight.act.booked") : text.action.label}
          </button>
          <p id={whyId} className="insight-body__why">
            <span>{text.action.why}</span>
          </p>
        </div>
      )}
      <p className="insight-body__note">{text.note}</p>
    </div>
  )
}
