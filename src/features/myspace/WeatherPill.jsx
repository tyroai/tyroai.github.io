import { cn } from "@/lib/utils"
import { SkyCard } from "./weather/SkyCard"
import "./weatherDialog.css"
import "./skyCard.css"
import "./weather/skyCompact.css"
import "./weather/skyPlain.css"
import "./weather/skyInsight.css"

// Anasayfa'nın hava kartı. Kart ve penceresi `weather/` klasöründe: `SkyCard`
// (ön yüz) → `WeatherDialog` (`WeatherHero` · `HourlyStrip` · `StatTiles` ·
// `LocationRow` · `DayList`); biçim `weatherFormat`, saf gün mantığı `weatherDays`.
// CSS'ler burada ve bu sırada: kural sırası pencere → kart → kartın boyu (telefonda kısa) →
// cümlesiz kartın konum satırı → kartın cümlesi.

/**
 * Anasayfa'nın hava kartı: Astra'nın kartı; hava alınamazsa da kart durur (o saatin göğü +
 * "Yeniden dene", `SkyUnavailable`). Hava kapalıyken (`WEATHER.enabled`) kart yok. `w`
 * sayfadan gelir (`useWeather`) — kartın varlığı panonun satır düzenini değiştiriyor ve sayfa
 * onu bilmek zorunda.
 *
 * ⚠️ SELAMLAMA BU KARTTA DEĞİL, sayfanın başında (`HomeGreeting`); kartın başında havanın tek
 * cümlesi (`lib/weatherInsight`). `plain`: cümlesiz kart (Pano'nun "Hava durumu"su), konum
 * satırı başta.
 *
 * ⚠️ **KUTLAMA GÜNÜ** (`celebration`, `lib/myCelebration.js`): kartın ön yüzü o güne ait
 * (`CelebrationFace`: pasta · altın yıl, alt cümle, konfeti), hava dipte tek satır; tebrik
 * başlığı ("İyi ki doğdun, Ömer!") sayfanın selamlamasında. HAVA DURUMU YERİNDE: kart her
 * gün aynı kart, MET'e o gün de gidiyor.
 */
export function WeatherGreeting({ w, celebration = null, plain = false, className }) {
  if (w.status === "off") return null
  return (
    <div data-slot="weather-pill" className={cn("flex min-w-0 flex-col", className)}>
      <SkyCard w={w} headline={!plain} celebration={plain ? null : celebration} />
    </div>
  )
}
