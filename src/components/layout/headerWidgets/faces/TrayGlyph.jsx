import { lazy, Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { RadioOrb } from "@/features/widgets/radio/RadioOrb"
import { ClockDial } from "@/features/widgets/worldclock/ClockDial"
import { useNow } from "@/features/widgets/focustimer/useTick"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { useWeather } from "@/hooks/useWeather"
import { remainingMs, useFocusTimer } from "@/lib/focusTimer"
import { trayIcon } from "../trayIcon"
import { StickyDeck } from "./StickyDeck"
import { TIBOT_FACES } from "@/components/tibot/tibotFaces"
import { MarketGlyph } from "./MarketLabel"
import { useAwayCity } from "./useAwayCity"
import "./trayFaces.css"

// Renkli hava simgesi kendi stilleriyle (gök renkleri) yalnız hava header'dayken iner.
const WeatherSymbol = lazy(() => import("./WeatherSymbol"))
// Ticket kartlarının renkli yüzleri (halka · deste · pist · tempo) yalnız header'da istenince iner.
const TibotGlyph = lazy(() =>
  import("@/components/tibot/TibotGlyphs").then((m) => ({ default: m.TibotGlyph })),
)

const Icon = ({ id }) => (
  <HugeiconsIcon icon={trayIcon(id)} strokeWidth={1.8} aria-hidden="true" className="size-5" />
)

/**
 * Tepsideki widget'ın yüzü (macOS menü çubuğunun canlı simgeleri gibi): hava kartın renkli
 * simgesi, Tyrofy kulaklıklı küre (çalarken dinler), dünya saati uzaktaki şehrin kadranı
 * (gece koyu), odak sayacı kalan süre halkası, To-Do bugünün ilerleme halkası, yapışkan notlar
 * renkli kâğıt destesi. Ötekiler widget'ın
 * ikonu. Süs: ad düğmede.
 */
export function TrayGlyph({ id, live = true, face, badge = false }) {
  // Yapışkan notlar: ikon yerine renkli kâğıt destesi; sayı rozeti yalnız istenince (header).
  if (id === "sticky") return <StickyDeck badge={badge && live && face?.show !== "icon"} />
  // Ticket: kartın renkli küçük hâli (halka · deste · pist · tempo); sayılar yanındaki değerde.
  if (TIBOT_FACES.has(id))
    return (
      <Suspense fallback={<Icon id={id} />}>
        <TibotGlyph id={id} />
      </Suspense>
    )
  // Piyasa: kurlar görünürken grafik ikonu yok, her kurun simgesi değerin yanında (`MarketLabel`).
  if (id === "market" && live) return <MarketGlyph face={face} />
  if (id === "weather") return <WeatherGlyph />
  if (id === "radio") return <RadioGlyph live={live} />
  if (id === "world-clock") return <ClockGlyph city={face?.city} />
  if (id === "focus-timer") return <TimerGlyph live={live} />
  return <Icon id={id} />
}

function WeatherGlyph() {
  const w = useWeather()
  const c = w.status === "ready" ? w.forecast.current : null
  if (!c?.kind) return <Icon id="weather" />
  return (
    <Suspense fallback={<Icon id="weather" />}>
      <WeatherSymbol kind={c.kind} night={Boolean(c.night)} />
    </Suspense>
  )
}

function RadioGlyph({ live }) {
  const radio = useRadioPlayer()
  return <RadioOrb live={live && radio.status === "playing"} />
}

function ClockGlyph({ city: cityId }) {
  const now = useMinuteNow()
  const city = useAwayCity(now, cityId)
  if (!city) return <Icon id="world-clock" />
  return <ClockDial h={city.h} mi={city.mi} night={city.night} className="tray-dial size-5" />
}

// Halkanın çevresi (r = 9): kalan süre kadarı dolu.
const RING = 2 * Math.PI * 9

function TimerGlyph({ live }) {
  const timer = useFocusTimer()
  const running = Boolean(timer.endsAt)
  const now = useNow(live && running)
  if (!running && timer.left == null) return <Icon id="focus-timer" />
  const left = remainingMs(timer, now) / (timer.minutes * 60000)
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 -rotate-90">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        strokeWidth="2.5"
        className="stroke-current opacity-20"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={RING}
        strokeDashoffset={RING * (1 - Math.max(0, Math.min(1, left)))}
        className={running ? "stroke-brand" : "stroke-current opacity-60"}
      />
    </svg>
  )
}
