import { WeatherDialog } from "@/features/myspace/weather/WeatherDialog"
import "@/features/myspace/weatherDialog.css"
import "@/features/myspace/skyCard.css"

/**
 * Header'daki havanın ayrıntısı: Anasayfa'nın hava kartına basınca açılan pencerenin aynısı
 * (`WeatherDialog`). Tembel iner; stiller Anasayfa'daki sırayla (`WeatherPill`: pencere → kart).
 */
export default function WeatherDetail(props) {
  return <WeatherDialog {...props} />
}
