import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { splitDay } from "@/features/calendar/lib/layout"
import { dayKey } from "@/features/calendar/lib/range"
import { AgendaList } from "./AgendaList"
import { dayFull } from "./format"

/** Günün saatli etkinliklerinin toplam süresi (saat); çakışanlar ayrı sayılır, panelle aynı. */
function hoursOf(timed) {
  const ms = timed.reduce((sum, i) => sum + Math.max(0, i.end - i.start), 0)
  return ms / 3_600_000
}

/**
 * Hafta ya da günün liste görünümü: her gün bir başlık (gün adı, etkinlik sayısı ve toplam saat)
 * ve altında günün ajandası (`AgendaList`: tüm gün çipleri, sonra saat sırasıyla kartlar). Boş
 * günler tek satır. Yoğun takvimde ızgaradan çok daha okunur; okuma düzeni telefonla aynı.
 */
export function AgendaWeek({ days, items, today, onOpen }) {
  const { locale, t } = useLocale()
  const todayKey = dayKey(today)
  const nf = getNumberFormat(locale, { maximumFractionDigits: 1 })
  const rows = useMemo(
    () =>
      days.map((day) => {
        const parts = splitDay(items, dayKey(day))
        return { day, count: parts.allDay.length + parts.timed.length, hours: hoursOf(parts.timed) }
      }),
    [days, items],
  )
  return (
    <div className="cal-agw">
      {rows.map(({ day, count, hours }) => {
        const key = dayKey(day)
        return (
          <section key={key} className="cal-agw-day" data-today={key === todayKey || undefined}>
            <h3 className="cal-agw-head">
              <span>{dayFull(day, locale)}</span>
              <span className="cal-agw-sum">
                {count
                  ? t("calendar.page.agenda.summary", { n: count, h: nf.format(hours) })
                  : t("calendar.page.agenda.free")}
              </span>
            </h3>
            {count > 0 && <AgendaList day={day} items={items} onOpen={onOpen} />}
          </section>
        )
      })}
    </div>
  )
}
