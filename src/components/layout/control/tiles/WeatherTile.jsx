import { lazy, Suspense } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useWeather } from "@/hooks/useWeather"
import { openWeatherDetail } from "@/lib/weatherDetailBus"
import { cardSkyOf } from "@/lib/weatherSky"
import { headerTitleKey } from "../../headerWidgets/headerStore"
import { useControlActions } from "../controlActions"
import { TileShell } from "./TileShell"
import { TileTip } from "./TileTip"
import { WidgetTile } from "./WidgetTile"

// Hava kartının renkli işareti (gök renkleri ve stilleri onunla iner; header'ın yüzü de bu).
const WeatherSymbol = lazy(() => import("../../headerWidgets/faces/WeatherSymbol"))

const condKey = (kind, night) =>
  kind === "clear" && night ? "myspace.weather.c.clearNight" : `myspace.weather.c.${kind}`

/**
 * Hava kutucuğu — header'daki ve Anasayfa'daki havanın görselliği: kutucuğun zemini kartın göğü
 * (`.wxd-sky`: saat ve havaya göre), renkli işaret, derece büyük, yanında durum ("Parçalı
 * bulutlu"), altında günün en yüksek / en düşüğü. Dokununca panel kapanır, hava ayrıntı penceresi
 * açılır (Anasayfa'daki hava kartının açtığı pencere, `lib/weatherDetailBus`; ürün sahibi: hava kartı
 * Master karta yerini bırakınca ayrıntı buradan). Hava okunamadıysa düz widget kutucuğu.
 */
export function WeatherTile({ onOpen, ...shell }) {
  const { t } = useLocale()
  const w = useWeather()
  const { close } = useControlActions()
  const c = w.status === "ready" ? w.forecast.current : null
  if (!c || !Number.isFinite(c.temp)) return <WidgetTile id="weather" onOpen={onOpen} {...shell} />
  const span = w.forecast.days?.[0] ?? w.forecast.range24
  const hasSpan = Number.isFinite(span?.max) && Number.isFinite(span?.min)
  const night = Boolean(c.night)
  return (
    <TileShell
      id="weather"
      sky={{ weather: cardSkyOf(c.kind), time: night ? "night" : "day" }}
      {...shell}
    >
      <TileTip hint={t("widgets.catalog.weather")}>
        <button
          type="button"
          className="cc-hit"
          onClick={() => {
            close()
            openWeatherDetail()
          }}
        >
          <span className="sr-only">{t(headerTitleKey("weather"))}</span>
          <span className="cc-wx-sym" aria-hidden="true">
            <Suspense fallback={null}>
              <WeatherSymbol kind={c.kind} night={night} />
            </Suspense>
          </span>
          <span className="cc-text">
            <span className="cc-label">
              <span className="cc-wx-temp">{Math.round(c.temp)}°</span> {t(condKey(c.kind, night))}
            </span>
            {hasSpan && (
              <span className="cc-sub">
                <span aria-hidden="true">
                  {Math.round(span.max)}° / {Math.round(span.min)}°
                </span>
                <span className="sr-only">
                  {t("headerWidgets.rangeSr", {
                    max: Math.round(span.max),
                    min: Math.round(span.min),
                  })}
                </span>
              </span>
            )}
          </span>
        </button>
      </TileTip>
    </TileShell>
  )
}
