import { useLocale } from "@/hooks/useLocale"
import { RAIN_DAY_MM } from "@/features/widgets/lib/regionWeather"
import { cn } from "@/lib/utils"
import { dayMonth, mm, pct, ratioText, STATE_TONE, weekday } from "./regionFormat"

// Yağış ve nem tek renkte: kartlardaki yağmur mavisi (iki temada da yüzeye 3:1'in üstünde).
const RAIN = "text-sky-700 dark:text-sky-400"
// Sütunun ucu yuvarlak, tabanı düz.
const CAP = { borderRadius: "3px 3px 0 0" }

function Section({ title, aside, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[0.75rem] font-medium text-muted-foreground">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Son 30 günün günlük yağışı; normal metinde (günlük ortalaması sütunların dibinde kalıyordu). */
function Last30({ rain, state, t, locale }) {
  const top = Math.max(...rain.daily.map((d) => d.rain), 5)
  return (
    <Section
      title={t("widgets.region.last30")}
      aside={
        <span className={cn("shrink-0 text-[0.8125rem] font-semibold", STATE_TONE[state])}>
          {ratioText(rain, t, locale)} · {t(`widgets.region.state.${state}`)}
        </span>
      }
    >
      <p className="text-[0.8125rem]">
        {t("widgets.region.total", { mm: mm(locale, rain.total), normal: mm(locale, rain.normal) })}
      </p>
      <div
        role="img"
        aria-label={t("widgets.region.chart30", {
          mm: mm(locale, rain.total),
          normal: mm(locale, rain.normal),
        })}
        className={cn("flex h-12 items-end gap-0.5 border-b border-border", RAIN)}
      >
        {rain.daily.map((d) => (
          <span
            key={d.key}
            title={`${dayMonth(locale, d.key)} · ${t("widgets.region.mm", { n: mm(locale, d.rain) })}`}
            className="flex h-full flex-1 items-end"
          >
            <span
              className="block w-full bg-current"
              style={{ ...CAP, height: `${(d.rain / top) * 100}%` }}
            />
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
        <span>{dayMonth(locale, rain.from)}</span>
        <span>{dayMonth(locale, rain.to)}</span>
      </div>
    </Section>
  )
}

/** Kök bölgesi nemi: dolgu bugünkü değer (normalin belirgin altındaysa uyarı rengi), çentik normal. */
function Soil({ soil, t, locale }) {
  const dry = soil.ratio != null && soil.ratio < 0.85
  return (
    <Section
      title={t("widgets.region.soil")}
      aside={
        <span className="shrink-0 text-[0.8125rem] font-semibold">
          {t("widgets.region.soilValue", {
            pct: pct(locale, soil.value),
            normal: pct(locale, soil.normal),
          })}
        </span>
      }
    >
      <div
        role="img"
        aria-label={t("widgets.region.soilValue", {
          pct: pct(locale, soil.value),
          normal: pct(locale, soil.normal),
        })}
        className="relative h-2 rounded-full bg-sky-500/12"
      >
        <span
          className={cn(
            "absolute inset-y-0 start-0 rounded-full",
            dry ? "bg-warning" : cn("bg-current", RAIN),
          )}
          style={{ width: `${Math.min(100, soil.value * 100)}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground ring-2 ring-background"
          style={{ insetInlineStart: `calc(${Math.min(100, soil.normal * 100)}% - 1px)` }}
        />
      </div>
    </Section>
  )
}

/** Önümüzdeki günler: yağışlı günün üstünde miktarı, altında gün adı. */
function Ahead({ ahead, t, locale }) {
  const top = Math.max(...ahead.days.map((d) => d.precip), 10)
  return (
    <Section
      title={t("widgets.region.next7")}
      aside={
        <span className="shrink-0 text-[0.75rem] text-muted-foreground">
          {ahead.first
            ? t("widgets.region.firstRain", { day: weekday(locale, ahead.first) })
            : t("widgets.region.aheadNone")}
        </span>
      }
    >
      <div
        role="img"
        aria-label={ahead.days
          .map(
            (d) =>
              `${weekday(locale, d.key)} ${t("widgets.region.mm", { n: mm(locale, d.precip) })}`,
          )
          .join(", ")}
      >
        <div className="grid grid-cols-7 gap-1.5 text-center text-[0.6875rem] text-muted-foreground">
          {ahead.days.map((d) => (
            <span key={d.key} className="h-4">
              {d.precip >= RAIN_DAY_MM ? mm(locale, d.precip) : ""}
            </span>
          ))}
        </div>
        <div className={cn("grid h-10 grid-cols-7 gap-1.5 border-b border-border", RAIN)}>
          {ahead.days.map((d) => (
            <span key={d.key} className="flex items-end justify-center">
              <span
                className="block w-2.5 bg-current"
                style={{
                  ...CAP,
                  height: `${d.precip > 0 ? Math.max(4, (d.precip / top) * 100) : 0}%`,
                }}
              />
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5 text-center text-[0.6875rem] text-muted-foreground">
          {ahead.days.map((d) => (
            <span key={d.key}>{weekday(locale, d.key)}</span>
          ))}
        </div>
      </div>
    </Section>
  )
}

/** Bölge ayrıntısı: son 30 gün, toprak nemi, önümüzdeki günler ve kaynak. */
export default function RegionDetail({ v, crops }) {
  const { t, locale } = useLocale()
  return (
    <div className="space-y-4 px-4 pt-1 pb-4">
      <p className="text-[0.75rem] text-muted-foreground">{crops}</p>
      {v.rain && <Last30 rain={v.rain} state={v.state} t={t} locale={locale} />}
      {v.soil && <Soil soil={v.soil} t={t} locale={locale} />}
      {v.ahead && <Ahead ahead={v.ahead} t={t} locale={locale} />}
      <p className="text-[0.6875rem] text-muted-foreground">
        {v.rain
          ? t("widgets.region.source", { date: dayMonth(locale, v.rain.to) })
          : t("widgets.region.sourceMet")}
      </p>
    </div>
  )
}
