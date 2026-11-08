import { useId, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Target03Icon from "@hugeicons/core-free-icons/Target03Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { workday } from "@/lib/focusWindow"
import { timeFormat } from "../dayInsightText"
import { insightRows } from "./insightRows"
import { useInsightAction } from "./useInsightAction"
import "./insightBody.css"

/**
 * Günün okumasının ipucu gövdesi (tembel parça): önce bakılan günün resmi — mesai şeridinde
 * toplantılar dolu, boşluklar açık, en uzun boşluk paletin mürekkebinde; altında en çok dört
 * satır, kaynak notu ve tek eylem. Eylem ne yapacağını kendisi anlatır: farede üstüne gelince
 * ya da klavyeyle odaklanınca açıklama açılır, dokunmatikte hep görünür (`insightBody.css`).
 */
export default function InsightBody({ insight, events, tasks, now, onChanged, close }) {
  const { t, locale } = useLocale()
  const text = useMemo(() => insightRows(insight, { t, locale }), [insight, t, locale])
  const act = useInsightAction({ action: text.action, events, tasks, now, onChanged })
  const whyId = useId()
  const f = insight.facts
  const highlight = text.action?.kind === "focus" ? text.action : f.window
  return (
    <div className="insight-body">
      {(f.meetings > 0 || f.windows.length > 0) && !f.away && (
        <DayStrip day={insight.date} f={f} highlight={highlight} locale={locale} t={t} />
      )}
      <dl className="insight-body__rows">
        {text.rows.map((r) => (
          <div key={r.key} className="insight-body__row">
            <dt>{r.label}</dt>
            <dd>
              {r.value}
              {r.sub && <span className="insight-body__sub">{r.sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
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

/**
 * Mesai şeridi: boş zaman taralı iz, toplantılar dolu açık blok, önerilen pencere palet renginde
 * ("Odak" yazılı, sığarsa); bugünse şimdi çizgisi. Altında renklerin açıklaması — üç ton ilk
 * bakışta ayırt edilmiyordu (ürün sahibi).
 */
function DayStrip({ day, f, highlight, locale, t }) {
  const { start, end } = workday(day)
  const span = end - start
  const x = (d) => Math.min(100, Math.max(0, ((d - start) / span) * 100))
  const at = (s) => ({ insetInlineStart: `${x(s.start)}%`, width: `${x(s.end) - x(s.start)}%` })
  const time = timeFormat(locale)
  const noon = new Date(day)
  noon.setHours(12, 0, 0, 0)
  const now = f.from && f.from > start && f.from < end ? f.from : null
  return (
    <div aria-hidden="true" className="insight-strip">
      <div className="insight-strip__track">
        {f.blocks.map((b) => (
          <span key={`b${b.start.getTime()}`} className="insight-strip__busy" style={at(b)} />
        ))}
        {highlight && (
          <span className="insight-strip__focus" style={at(highlight)}>
            {x(highlight.end) - x(highlight.start) >= 16 ? t("insight.strip.focusShort") : null}
          </span>
        )}
        {now && <span className="insight-strip__now" style={{ insetInlineStart: `${x(now)}%` }} />}
      </div>
      <div className="insight-strip__ticks">
        <span>{time.format(start)}</span>
        <span style={{ insetInlineStart: `${x(noon)}%` }}>{time.format(noon)}</span>
        <span>{time.format(end)}</span>
      </div>
      <ul className="insight-strip__legend">
        <li data-key="busy">{t("insight.strip.busy")}</li>
        <li data-key="free">{t("insight.strip.free")}</li>
        {highlight && <li data-key="focus">{t("insight.strip.focus")}</li>}
      </ul>
    </div>
  )
}
