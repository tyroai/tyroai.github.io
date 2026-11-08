import { useLocale } from "@/hooks/useLocale"
import { keyToDay } from "@/features/calendar/lib/range"
import { holidaysOfYear } from "@/features/calendar/lib/stats"
import { addDays } from "@/lib/leaveDays"
import { dayMonth, rangeText, weekday } from "./format"

/** Yılın resmî tatilleri: ad, tarih aralığı ve (varsa) arife notu. "Tatil listesini gör" bunu açar. */
export function HolidayList({ year }) {
  const { locale, t } = useLocale()
  return (
    <div className="cal-hol">
      <h3>{t("calendar.page.holidays.title", { year })}</h3>
      <ul>
        {holidaysOfYear(year).map((h) => {
          const from = keyToDay(h.start)
          const to = addDays(from, h.days - 1)
          return (
            <li key={h.start}>
              <strong>{t(`widgets.holiday.name.${h.key}`)}</strong>
              <span>
                {weekday(from, locale)} · {rangeText(from, to, locale)}
              </span>
              {h.eve && (
                <span className="cal-hol-eve">
                  {t("widgets.holiday.eve", { date: dayMonth(keyToDay(h.eve), locale) })}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
