import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useStripSwipe } from "@/features/calendar/hooks/useStripSwipe"
import { openTarget } from "@/features/calendar/lib/holidayBlocks"
import { splitDay } from "@/features/calendar/lib/layout"
import { dayKey } from "@/features/calendar/lib/range"
import { AllDayChip } from "./AllDayChip"
import { clock, dayFull, srKind, weekdayShort, whenText } from "./format"
import { ITEM_ICONS } from "./icons"

/**
 * Telefonun hafta şeridi: yedi gün hapı (gün adı + numara), öğesi olan günde nokta, seçili gün
 * dolu, bugün halkalı. Haftayı değiştiren ok düğmeleri araç çubuğunda; şerit yana kaydırmayla da
 * değişir (`onSwipe`; parmağı izler, hız + mesafeyle karar verir: `features/calendar/hooks/useStripSwipe`).
 */
export function WeekStrip({ days, selected, today, marked, onSelect, onSwipe }) {
  const { locale, t } = useLocale()
  const { ref, bind } = useStripSwipe(onSwipe)
  return (
    <div className="cal-strip-clip">
      <div
        ref={ref}
        {...bind}
        className="cal-strip"
        role="group"
        aria-label={t("calendar.page.strip")}
      >
        {days.map((d) => {
          const key = dayKey(d)
          return (
            <button
              key={key}
              type="button"
              className="cal-sd"
              data-selected={key === dayKey(selected) || undefined}
              data-today={key === dayKey(today) || undefined}
              aria-pressed={key === dayKey(selected)}
              title={dayFull(d, locale)}
              onClick={() => onSelect(d)}
            >
              <span className="cal-dow">{weekdayShort(d, locale)}</span>{" "}
              <span className="cal-dnum">{d.getDate()}</span>
              <span
                className="cal-sd-dot"
                data-on={marked.has(key) || undefined}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Telefon günün kartı: sol renk şeridi, saat, başlık, konum. */
function AgendaCard({ item, onOpen }) {
  const { locale, t } = useLocale()
  const Icon = ITEM_ICONS[item.icon]
  return (
    <button
      type="button"
      className="cal-ag"
      data-tone={item.kind}
      data-state={item.state ?? undefined}
      style={{ "--hue": item.hue }}
      onClick={(e) => onOpen(openTarget(item), e.currentTarget)}
    >
      <span className="cal-ag-time">
        <strong>{clock(item.start, locale)}</strong>
        <span>{clock(item.end, locale)}</span>
      </span>
      <span className="cal-ag-body">
        <span data-private="" className="cal-ag-title">
          <span className="cal-sr">{srKind(item, t)}</span>
          {Icon && (
            <HugeiconsIcon icon={Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
          )}
          {item.title}
        </span>
        {item.sub && (
          <span data-private="" className="cal-ag-sub">
            {item.sub}
          </span>
        )}
        {item.where && (
          <span data-private="" className="cal-ag-sub">
            <HugeiconsIcon
              icon={Location01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
            {item.where}
          </span>
        )}
        <span className="cal-sr">, {whenText(item, locale, t)}</span>
      </span>
    </button>
  )
}

/**
 * Seçili günün ajandası (telefonda ızgara yok): önce tüm gün çipleri, sonra saat sırasıyla
 * kartlar; resmî tatil de saatli kart (mesai kadar, arife yarım gün: `splitDay`). Gün boşsa sakin
 * bir cümle.
 */
export function AgendaList({ day, items, onOpen }) {
  const { locale, t } = useLocale()
  const key = dayKey(day)
  const { allDay, timed } = useMemo(() => {
    const parts = splitDay(items, key)
    return { allDay: parts.allDay, timed: [...parts.timed].sort((a, b) => a.start - b.start) }
  }, [items, key])
  return (
    <section className="cal-agenda" aria-label={dayFull(day, locale)}>
      {allDay.length > 0 && (
        <div className="cal-ag-chips">
          {allDay.map((item) => (
            <AllDayChip key={item.id} chip={{ item, col: 0, span: 1, lane: 0 }} onOpen={onOpen} />
          ))}
        </div>
      )}
      {timed.map((item) => (
        <AgendaCard key={`${item.id}:${key}`} item={item} onOpen={onOpen} />
      ))}
      {!allDay.length && !timed.length && (
        <p className="cal-empty">
          <HugeiconsIcon
            icon={Calendar03Icon}
            className="cal-ic"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          {t("calendar.page.emptyDay")}
        </p>
      )}
    </section>
  )
}
