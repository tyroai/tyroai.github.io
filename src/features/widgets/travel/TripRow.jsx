import { lazy, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { useLocale } from "@/hooks/useLocale"
import { inForecastRange, tripDayKeys } from "@/features/widgets/lib/tripWeather"
import { cityName } from "@/lib/worldClock"
import { WidgetOverlay } from "../WidgetOverlay"
import { TripTemp } from "./TripTemp"
import { awayTime, tripDates } from "./tripFormat"
import { useTripForecast } from "./useTripForecast"

const TripDetail = lazy(() => import("./TripDetail"))

const BOX = "block w-full rounded-2xl bg-muted/40 px-3 py-2 text-start"

/**
 * Yolculuk satırı: ad, tarih · yer; varış şehri tanındıysa altında oranın saati (fark varsa) ve
 * ilk günün havası, basınca ayrıntı (`TripDetail`: günlük tahmin, TYRO ofisi, dünya saatine
 * iğnele). Şehir tanınmadıysa satır düz kalır.
 */
export function TripRow({ trip, now }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const city = trip.city
  const forecast = useTripForecast(city && inForecastRange(trip, now) ? city : null)
  const first = useMemo(() => {
    if (!forecast) return null
    const key = tripDayKeys(trip, city.tz, now)[0]
    return forecast.find((d) => d.key === key) ?? null
  }, [forecast, trip, city, now])
  const time = awayTime(city, now)
  const local = time && t("widgets.travel.localTime", { city: cityName(city, locale), time })
  const body = (
    <>
      <span className="block truncate text-[0.8125rem] font-medium">{trip.subject}</span>
      <span className="block truncate text-[0.6875rem] text-muted-foreground">
        {tripDates(trip, locale)}
        {trip.location && ` · ${trip.location}`}
      </span>
      {(time || first) && (
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-sky-700 dark:text-sky-400">
          {time && (
            // Dar kartta (içerik < 16rem) şehir adı sığmıyor: saat simgesiyle kısa; şehir üst satırda.
            <>
              <HugeiconsIcon
                icon={Clock01Icon}
                aria-hidden="true"
                className="hidden size-3.5 shrink-0 @max-[16rem]/widget:block"
                strokeWidth={1.9}
              />
              <span className="truncate @max-[16rem]/widget:hidden">{local}</span>
              <span className="hidden @max-[16rem]/widget:inline">
                <span aria-hidden="true">{time}</span>
                <span className="sr-only">{local}</span>
              </span>
            </>
          )}
          {time && first && (
            <span aria-hidden="true" className="@max-[16rem]/widget:hidden">
              ·
            </span>
          )}
          {first && <TripTemp day={first} />}
        </span>
      )}
    </>
  )
  if (!city) return <li className={BOX}>{body}</li>
  const trigger = (
    <button
      type="button"
      className={`${BOX} transition outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent`}
    >
      {body}
    </button>
  )
  return (
    <li>
      <WidgetOverlay
        trigger={trigger}
        title={trip.subject}
        open={open}
        onOpenChange={setOpen}
        align="start"
      >
        <TripDetail trip={trip} now={now} forecast={forecast} />
      </WidgetOverlay>
    </li>
  )
}
