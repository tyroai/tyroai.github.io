import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { placeSpans } from "@/features/calendar/lib/layout"
import { dayKey } from "@/features/calendar/lib/range"
import { isWeekend } from "@/lib/leaveDays"
import { AllDayChip } from "./AllDayChip"
import { dayFull, weekdayShort } from "./format"

const MAX_LANES = 3

/** Ayın bir haftası: gün hücreleri arkada, üstünde çok günlü şeritler (satır boyunca tek parça). */
function MonthWeek({ week, items, month, todayKey, onOpen, onDay, onSlot }) {
  const { locale, t } = useLocale()
  const spans = useMemo(() => placeSpans(items, week, MAX_LANES), [items, week])
  return (
    <div className="cal-mo-week">
      {week.map((d, col) => (
        <div
          key={dayKey(d)}
          className="cal-cell"
          data-out={d.getMonth() !== month || undefined}
          data-weekend={isWeekend(d) || undefined}
          data-today={dayKey(d) === todayKey || undefined}
          style={{ gridColumn: col + 1 }}
          onClick={(e) => {
            if (e.target === e.currentTarget)
              onSlot({ day: d, minute: null, x: e.clientX, y: e.clientY })
          }}
        />
      ))}
      {week.map((d, col) => (
        <button
          key={dayKey(d)}
          type="button"
          className="cal-cnum"
          data-out={d.getMonth() !== month || undefined}
          data-today={dayKey(d) === todayKey || undefined}
          aria-current={dayKey(d) === todayKey ? "date" : undefined}
          aria-label={dayFull(d, locale)}
          style={{ gridColumn: col + 1 }}
          onClick={() => onDay(d)}
        >
          {d.getDate()}
        </button>
      ))}
      {spans.chips.map((chip) => (
        <AllDayChip
          key={`${chip.item.id}:${chip.col}`}
          chip={{ ...chip, lane: chip.lane + 1 }}
          onOpen={onOpen}
        />
      ))}
      {spans.more.map(
        (n, col) =>
          n > 0 && (
            <button
              key={col}
              type="button"
              className="cal-more"
              style={{ gridColumn: col + 1, gridRow: MAX_LANES + 2 }}
              onClick={() => onDay(week[col])}
            >
              {t("calendar.page.moreDay", { n })}
            </button>
          ),
      )}
    </div>
  )
}

/**
 * Ay görünümü: 6 hafta × 7 gün. Hücrede sol üstte gün numarası (bugün paletin dolgusunda), en
 * çok üç çip ve "+n daha" (o günün gün görünümüne götürür). Hafta sonu sütunları çok hafif gri.
 */
export function MonthGrid({ days, items, today, anchor, onOpen, onDay, onSlot }) {
  const { locale } = useLocale()
  const weeks = useMemo(
    () => Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7)),
    [days],
  )
  return (
    <div className="cal-month" data-ux-exempt="">
      <div className="cal-mo-head" aria-hidden="true">
        {weeks[0].map((d) => (
          <span key={d.getDay()} className="cal-dow">
            {weekdayShort(d, locale)}
          </span>
        ))}
      </div>
      {weeks.map((week) => (
        <MonthWeek
          key={dayKey(week[0])}
          week={week}
          items={items}
          month={anchor.getMonth()}
          todayKey={dayKey(today)}
          onOpen={onOpen}
          onDay={onDay}
          onSlot={onSlot}
        />
      ))}
    </div>
  )
}
