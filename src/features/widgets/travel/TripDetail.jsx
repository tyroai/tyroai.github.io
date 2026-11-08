import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import PinIcon from "@hugeicons/core-free-icons/PinIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { OFFICES } from "@/data/offices"
import { useLocale } from "@/hooks/useLocale"
import { useWorldClock } from "@/hooks/useWorldClock"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { notify } from "@/lib/notify"
import { OFFICE_KINDS, directionsUrl, mapsUrl } from "@/lib/offices"
import { inForecastRange, keyNoon, tripDayKeys } from "@/features/widgets/lib/tripWeather"
import { MAX_SHOWN, cityName } from "@/lib/worldClock"
import { cn } from "@/lib/utils"
import { FORECAST_ICON } from "./forecastIcons"
import { awayTime, tripDates } from "./tripFormat"

const OPTS_WEEKDAY = { weekday: "short", timeZone: "UTC" }
const HEAD = "text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground/60"
const PILL =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/** Şehirdeki TYRO yeri — birden çoksa önce merkez, ofis, sonra tesis ve liman. */
const officeIn = (cityId) =>
  OFFICES.filter((o) => o.city === cityId).sort(
    (a, b) => OFFICE_KINDS.indexOf(a.kind) - OFFICE_KINDS.indexOf(b.kind),
  )[0] ?? null

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={PILL}>
      {children}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        aria-hidden="true"
        className="size-3"
        strokeWidth={2}
      />
    </a>
  )
}

/**
 * Yolculuğun ayrıntısı: varış günlerinin tahmini (varışın saat diliminde, en çok 5 gün; MET Norway
 * atfıyla), şehirde TYRO ofisi varsa adres · yol tarifi · harita, şehrin saati ve "Dünya saatine
 * iğnele" (dünya saati widget'ında ve tepside görünür), takvimdeki kayıt.
 */
export default function TripDetail({ trip, now, forecast }) {
  const { t, locale } = useLocale()
  const clock = useWorldClock()
  const city = trip.city
  const name = cityName(city, locale)
  const byKey = new Map((forecast ?? []).map((d) => [d.key, d]))
  const days = tripDayKeys(trip, city.tz, now)
    .map((key) => byKey.get(key))
    .filter(Boolean)
  const weekday = getDateTimeFormat(locale, OPTS_WEEKDAY)
  const office = officeIn(city.id)
  const time = awayTime(city, now)
  const pinned = clock.shown.includes(city.id)
  const canPin = clock.toggleShown && city.id !== clock.home

  function pin() {
    if (!pinned) clock.add(city.id)
    if (!clock.toggleShown(city.id)) notify.info(t("worldClock.showFull", { n: MAX_SHOWN }))
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-2">
      <p className="text-[0.75rem] text-muted-foreground">
        {tripDates(trip, locale)} · {name}
      </p>

      <section>
        <h4 className={HEAD}>{t("widgets.travel.weather")}</h4>
        {days.length ? (
          <ul className="mt-2 grid grid-cols-5 gap-1.5">
            {days.map((d) => {
              const day = weekday.format(keyNoon(d.key))
              const cond = t(`myspace.weather.c.${d.kind}`)
              return (
                <li
                  key={d.key}
                  aria-label={t("widgets.travel.dayAria", { day, cond, max: d.max, min: d.min })}
                  className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 py-2 text-[0.75rem] tabular-nums"
                >
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground [&::first-letter]:uppercase"
                  >
                    {day}
                  </span>
                  <HugeiconsIcon
                    icon={FORECAST_ICON[d.kind] ?? FORECAST_ICON.cloudy}
                    aria-hidden="true"
                    className="size-5 text-sky-700 dark:text-sky-400"
                    strokeWidth={1.7}
                  />
                  <span aria-hidden="true" className="font-semibold">
                    {d.max}°
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    {d.min}°
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
            {inForecastRange(trip, now)
              ? t("widgets.travel.noForecast")
              : t("widgets.travel.forecastLater", { n: 9 })}
          </p>
        )}
        {days.length > 0 && (
          <p className="mt-1.5 text-[0.6875rem] text-muted-foreground">
            {t("myspace.weather.source")}
          </p>
        )}
      </section>

      {office && (
        <section>
          <h4 className={HEAD}>{t(`find.office.kind.${office.kind}`)}</h4>
          <p className="mt-1 text-[0.8125rem] font-semibold">{office.name}</p>
          <p className="text-[0.8125rem] leading-snug text-muted-foreground">{office.address}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ExternalLink href={directionsUrl(office)}>{t("find.office.directions")}</ExternalLink>
            <ExternalLink href={mapsUrl(office)}>{t("find.office.map")}</ExternalLink>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-[0.8125rem] text-muted-foreground">
          {time ? t("widgets.travel.localTime", { city: name, time }) : name}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {canPin && (
            <button
              type="button"
              aria-pressed={pinned}
              onClick={pin}
              className={cn(PILL, pinned && "border-transparent bg-brand/10 text-brand-ink")}
            >
              <HugeiconsIcon
                icon={pinned ? Tick02Icon : PinIcon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {pinned ? t("widgets.travel.pinned") : t("widgets.travel.pin")}
            </button>
          )}
          {trip.webLink && (
            <ExternalLink href={trip.webLink}>{t("widgets.travel.openEvent")}</ExternalLink>
          )}
        </div>
      </div>
    </div>
  )
}
