import "@/lib/i18n/notchInd"
import { lazy, Suspense, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import DropletIcon from "@hugeicons/core-free-icons/DropletIcon"
import { outlookText } from "@/features/myspace/weather/outlookText"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { MeterBars } from "@/features/widgets/radio/MeterBars"
import { HorizonIndicator, HorizonLabel } from "@/features/widgets/horizon/HorizonLabel"
import { useLocale } from "@/hooks/useLocale"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { useWeather } from "@/hooks/useWeather"
import { useNow } from "@/features/widgets/focustimer/useTick"
import { formatClock, remainingMs, useFocusTimer } from "@/lib/focusTimer"
import { cn } from "@/lib/utils"
import { upcomingHolidays } from "@/lib/leaveDays"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { nextSoonMeeting } from "@/lib/notchIndicator"
import { rainNear, weatherOutlook } from "@/lib/weatherOutlook"
import { TIBOT_FACES } from "@/components/tibot/tibotFaces"
import { faceOf } from "./faceOptions"
import { MarketLabel } from "./faces/MarketLabel"
import { MailLabel, ReportLabel, TravelLabel } from "./faces/moreLabels"
import { RollText } from "@/components/common/RollText"
import { useClockIndicator } from "./faces/useAwayCity"
import { useTrayCalendar } from "./faces/usePeeks"
import "@/features/widgets/radio/radio.css"

// Çentik göstergeleri tepsinin verisini paylaşır (`notch/SlotIndicator`).
export { HorizonIndicator }

const LABEL = "text-[0.8125rem] font-semibold tabular-nums leading-none"
const TibotLabel = lazy(() =>
  import("@/components/tibot/TibotGlyphs").then((m) => ({ default: m.TibotLabel })),
)
// Sıradaki toplantının saati ancak bu kadar yakınsa (macOS'un takvim uygulamaları gibi); bir
// saatten yakınsa kalan dakika.
const SOON_MS = 3 * 3600000
const HOUR_MS = 3600000
const OPTS_TIME = { hour: "2-digit", minute: "2-digit" }

/**
 * Tepsideki canlı küçük bilgi (macOS menü çubuğu gibi): havada derece (3 saat içinde yağış varsa
 * damla + başlayacağı saat), sıradaki toplantı yakınsa
 * saati (bir saatten yakınsa kalan dakika), odak sayacında kalan süre, dünya saatinde uzaktaki
 * şehrin saati, tatilde kalan gün, To-Do'da bugünün "3/7"si, bayraklı posta sayısı, yolculuğa
 * kalan gün (yapışkan notlarda sayı destenin rozetinde, `StickyDeck`), sıradaki piyasa raporuna kalan gün (bugünse saati). Yalnız elde olan veriden — yeni bir istek açmaz (`faces/usePeeks`). Görünen metin
 * düğmenin erişilebilir adının içinde kalır (ad = widget'ın adı + bu metin).
 */
export function LiveLabel({ id, face }) {
  // Yüz seçimi (`faceOptions`): "yalnız simge"de bilgi yok; havada aralık, piyasada kurlar, dünya
  // saatinde şehir.
  const f = face ?? faceOf(id, null)
  if (f.show === "icon") return null
  if (id === "weather") return <WeatherLabel range={f.show === "range"} />
  if (id === "market") return <MarketLabel codes={f.codes} />
  if (id === "next-meeting") return <MeetingLabel />
  if (id === "focus-timer") return <TimerLabel />
  if (id === "world-clock") return <ClockLabel city={f.city} />
  if (id === "holiday") return <HolidayLabel />
  if (id === "horizon") return <HorizonLabel />
  if (id === "pending-mail") return <MailLabel show={f.show} />
  if (id === "travel") return <TravelLabel />
  if (id === "report-day") return <ReportLabel />
  if (TIBOT_FACES.has(id))
    return (
      <Suspense fallback={null}>
        <TibotLabel id={id} />
      </Suspense>
    )
  return null
}

/** Radyo çalarken müziğe göre çubuklar (toplu tepside, radyo üstte değilken). */
export function RadioBars() {
  const radio = useRadioPlayer()
  return radio.status === "playing" ? <MeterBars playing className="h-3" bar="bg-current" /> : null
}

function WeatherLabel({ range }) {
  const { t, locale } = useLocale()
  const w = useWeather()
  const now = useMinuteNow()
  const hourly = w.status === "ready" ? w.forecast.hourly : null
  const outlook = useMemo(() => (hourly ? weatherOutlook(hourly, now) : null), [hourly, now])
  const temp = w.status === "ready" ? w.forecast.current.temp : null
  if (!Number.isFinite(temp)) return null
  // Günün en yüksek / en düşüğü (bugün; yoksa önümüzdeki 24 saat).
  const span = w.forecast.days?.[0] ?? w.forecast.range24
  if (range && Number.isFinite(span?.max) && Number.isFinite(span?.min))
    return (
      <span className={LABEL}>
        <span aria-hidden="true">
          <RollText text={`${Math.round(span.max)}° / ${Math.round(span.min)}°`} />
        </span>
        <span className="sr-only">
          {t("headerWidgets.rangeSr", { max: Math.round(span.max), min: Math.round(span.min) })}
        </span>
      </span>
    )
  if (!rainNear(outlook, now))
    return (
      <span className={LABEL}>
        <RollText text={`${Math.round(temp)}°`} />
      </span>
    )
  const timeFmt = getDateTimeFormat(locale, OPTS_TIME)
  const num = getNumberFormat(locale)
  // Görünen kısa hâl gizli, ekran okuyucu tam cümleyi duyar (ad = widget'ın adı + cümle).
  return (
    <span className={cn(LABEL, "inline-flex items-center gap-0.5")}>
      <HugeiconsIcon icon={DropletIcon} className="size-3" strokeWidth={2} aria-hidden="true" />
      <span aria-hidden="true">
        <RollText
          text={outlook.type === "soon" ? timeFmt.format(outlook.at) : `${Math.round(temp)}°`}
        />
      </span>
      <span className="sr-only">
        {outlookText(outlook, { t, timeFmt, f: { num: (n) => num.format(n) } })}
      </span>
    </span>
  )
}

/**
 * Odak sayacının kalan süresi (çalışırken ya da duraklatılmışken), tepsi ve çentik ortak; sayaç
 * hiç kurulmadıysa `null`. Saniye saati yalnız çalışırken döner.
 */
function useTimerIndicator() {
  const { t } = useLocale()
  const timer = useFocusTimer()
  const running = Boolean(timer.endsAt)
  const now = useNow(running)
  if (!running && timer.left == null) return null
  const time = formatClock(remainingMs(timer, now))
  return {
    text: time,
    sr: t(running ? "notchInd.timer" : "notchInd.timerPaused", { time }),
    running,
  }
}

/** Odak sayacı çalışırken kalan süre (macOS'un menü çubuğundaki zamanlayıcı gibi); duraklatılmışsa soluk. */
function TimerLabel() {
  const ind = useTimerIndicator()
  if (!ind) return null
  return (
    <span className={cn(LABEL, !ind.running && "opacity-60")}>
      <RollText text={ind.text} />
    </span>
  )
}

/**
 * Sıradaki toplantı yakınsa saati, bir saatten yakınsa kalan dakika (yakınken `alert`). Çentiğin
 * ve Anasayfa'nın AYNI takvim anahtarı (Graph'a ikinci kez gidilmez).
 */
function useMeetingIndicator() {
  const { t, locale } = useLocale()
  const now = useMinuteNow()
  const cal = useTrayCalendar()
  const next = useMemo(() => nextSoonMeeting(cal.events, now, SOON_MS), [cal.events, now])
  if (!next) return null
  const soon = next.start.getTime() - now < HOUR_MS
  const n = Math.max(1, Math.ceil((next.start - now) / 60000))
  const time = getDateTimeFormat(locale, OPTS_TIME).format(next.start)
  return {
    text: soon ? t("headerWidgets.inMinutes", { n }) : time,
    sr: soon ? t("notchInd.meetingIn", { n }) : t("notchInd.meetingAt", { time }),
    alert: soon,
  }
}

function MeetingLabel() {
  const ind = useMeetingIndicator()
  if (!ind) return null
  return (
    <span className={cn(LABEL, ind.alert && "text-brand")}>
      <RollText text={ind.text} />
    </span>
  )
}

/** Seçilen ya da uzaktaki ilk şehrin saati (yerel saat zaten header'da); ekran okuyucuya adıyla. */
function ClockLabel({ city: cityId }) {
  const ind = useClockIndicator(cityId)
  if (!ind) return null
  return (
    <span className={LABEL}>
      <span className="sr-only">{ind.name} </span>
      <RollText text={ind.text} />
    </span>
  )
}

/** Sıradaki resmî tatile kalan gün (bugünse kutlama); ekran okuyucuya tam cümleyle. */
function useHolidayIndicator() {
  const { t } = useLocale()
  const now = useMinuteNow()
  const next = useMemo(() => upcomingHolidays(new Date(now))[0] ?? null, [now])
  if (!next) return null
  if (next.inDays <= 0) return { text: "🎉", sr: t("notchInd.holidayToday"), today: true }
  return {
    text: t("headerWidgets.daysShort", { n: next.inDays }),
    sr: t("widgets.holiday.left", { n: next.inDays }),
  }
}

function HolidayLabel() {
  const ind = useHolidayIndicator()
  if (!ind) return null
  if (ind.today) return <span aria-hidden="true">🎉</span>
  return (
    <span className={LABEL}>
      <span aria-hidden="true">
        <RollText text={ind.text} />
      </span>
      <span className="sr-only">{ind.sr}</span>
    </span>
  )
}

/** Çentik göstergesinin kaynağı (`notch/SlotIndicator`): değeri çocuğa verir; hook dışa açılmaz. */
export function TimerIndicator({ children }) {
  return children(useTimerIndicator())
}

export function MeetingIndicator({ children }) {
  return children(useMeetingIndicator())
}

export function ClockIndicator({ face, children }) {
  return children(useClockIndicator(face?.city ?? null))
}

export function HolidayIndicator({ children }) {
  return children(useHolidayIndicator())
}
