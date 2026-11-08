import { MiniSymbol } from "@/features/myspace/weather/WeatherSymbols"
import { cardSkyOf } from "@/lib/weatherSky"
import "@/features/myspace/weatherDialog.css"
import "@/features/myspace/skyCard.css"

/**
 * Hava kartının yayındaki işaretin küçüğü (saatlik şeritteki gibi, hareketsiz): renkleri
 * kartın göğünden (`.wxd-sky` › `data-weather` · `data-time`), gece ay. Tembel yüklenir.
 */
export default function WeatherSymbol({ kind, night }) {
  return (
    <span
      className="wxd-sky tray-weather"
      data-weather={cardSkyOf(kind)}
      data-time={night ? "night" : "day"}
    >
      <MiniSymbol kind={kind} night={night} size={22} />
    </span>
  )
}
