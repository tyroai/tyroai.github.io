import "@/lib/i18n/notchInd"
import { forwardRef } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { peekSelfService } from "@/hooks/useSelfService"
import { useWeather } from "@/hooks/useWeather"
import { fitText, focusTally, pendingRequestCount, tempText } from "@/lib/notchIndicator"
import { faceOf, faceOptionsOf } from "../headerWidgets/faceOptions"
import { MarketIndicator } from "../headerWidgets/faces/MarketLabel"
import {
  PendingMailIndicator,
  ReportIndicator,
  TravelIndicator,
} from "../headerWidgets/faces/moreLabels"
import { useFocusPeek, useWidgetPeek } from "../headerWidgets/faces/usePeeks"
import {
  ClockIndicator,
  HolidayIndicator,
  HorizonIndicator,
  MeetingIndicator,
  TimerIndicator,
} from "../headerWidgets/WidgetLabels"
import { useStickyCount } from "@/lib/stickyCount"
import { useTibotPeek } from "@/lib/tibot/tibotPeek"
import { RailButton } from "./RailButton"

/*
 * Çentik yuvasının kısa göstergesi (posta ve takvimin sayısı gibi). Her widget'ın kaynağı TEPSİNİN
 * aynı verisini okur (`headerWidgets/*Labels`'ın `…Indicator` bileşenleri, değeri çocuğa verir):
 * yeni istek, yeni yoklama yok; değer widget'ın kendi temposunda tazelenir. Anlamlı değer yoksa gösterge yok (boş hap çizilmez). Türü `lib/notchIndicator`.
 */

function useWeatherIndicator(face) {
  const { t } = useLocale()
  const w = useWeather()
  if (w.status !== "ready") return null
  const span = w.forecast.days?.[0] ?? w.forecast.range24
  if (face.show === "range" && Number.isFinite(span?.max) && Number.isFinite(span?.min)) {
    const max = Math.round(span.max)
    const min = Math.round(span.min)
    return {
      text: `${tempText(max)}/${tempText(min)}`,
      sr: t("headerWidgets.rangeSr", { max, min }),
    }
  }
  const text = tempText(w.forecast.current?.temp)
  return text ? { text, sr: t("notchInd.temp", { n: Math.round(w.forecast.current.temp) }) } : null
}

/** Radyo yalnız çalarken: canlı nokta (küre zaten dinliyor; nokta uzaktan da okunur). */
function useRadioIndicator() {
  const { t } = useLocale()
  const radio = useRadioPlayer()
  return radio.status === "playing" ? { dot: true, sr: t("notchInd.playing") } : null
}

/** To-Do: bugünün "3/7"si (gecikmiş varsa sıcak) ya da yüz "gecikenler"se gecikme sayısı. */
function useTodoIndicator(face) {
  const { t } = useLocale()
  const tally = focusTally(useFocusPeek())
  if (!tally) return null
  const { done, total, late } = tally
  const lateSr = late > 0 ? t("headerWidgets.todoLate", { n: late }) : null
  if (face.show === "late") return late > 0 ? { count: late, sr: lateSr, alert: true } : null
  return {
    text: `${done}/${total}`,
    sr: [t("headerWidgets.todoSr", { done, total }), lateSr].filter(Boolean).join(", "),
    alert: late > 0,
  }
}

/** Planner: bana atanmış, bitmemiş işler — kartın son okumasından (sayı rozeti). */
function usePlannerIndicator() {
  const { t } = useLocale()
  const n = useWidgetPeek("planner")?.total ?? 0
  return n > 0 ? { count: n, sr: t("notchInd.planner", { n }) } : null
}

/**
 * Taleplerim: onaydaki talepler — Self Servis'in bu oturumdaki son tam okumasından (sayfa ya da
 * kart açıldıysa); ERP'ye istek atmaz. Önbelleğin haberi yok: dakika saatiyle yeniden bakılır.
 */
function useRequestsIndicator() {
  const { t } = useLocale()
  const { accounts } = useMsal()
  useMinuteNow()
  const last = peekSelfService(accounts[0], { stale: true })
  const n = last?.status === "ready" ? pendingRequestCount(last.data) : null
  return n > 0 ? { count: n, sr: t("notchInd.requests", { n }) } : null
}

/** Yapışkan notlar: not sayısı — listenin bu oturumdaki son okumasından (`stickyCount`). */
function useStickyIndicator() {
  const { t } = useLocale()
  const n = useStickyCount()
  return n > 0 ? { count: n, sr: t("notchInd.sticky", { n }) } : null
}

/** Tibot: sana atanan açık talep sayısı — listenin bu oturumdaki son okumasından (`tibotPeek`). */
function useTibotIndicator() {
  const { t } = useLocale()
  const peek = useTibotPeek()
  const n = peek?.assigned ?? 0
  if (!n) return null
  const sr = t(peek.late > 0 ? "notchInd.tibotLate" : "notchInd.tibot", { n, late: peek.late })
  return { count: n, sr }
}

const useFocusIndicator = (face) => useTodoIndicator({ ...face, show: "value" })

/** Bu dosyadaki kancadan kaynak bileşeni (dışarıdakilerle aynı biçim: `{ face, children }`). */
const fromHook = (useInd) =>
  function HookSource({ face, children }) {
    return children(useInd(face))
  }

/** Widget → göstergesinin kaynağı. Listede olmayanın göstergesi yok (ikon ve ad yeter). */
const SOURCES = {
  weather: fromHook(useWeatherIndicator),
  radio: fromHook(useRadioIndicator),
  focus: fromHook(useFocusIndicator),
  "pending-mail": PendingMailIndicator,
  "next-meeting": MeetingIndicator,
  "focus-timer": TimerIndicator,
  "world-clock": ClockIndicator,
  holiday: HolidayIndicator,
  horizon: HorizonIndicator,
  travel: TravelIndicator,
  "report-day": ReportIndicator,
  market: MarketIndicator,
  planner: fromHook(usePlannerIndicator),
  requests: fromHook(useRequestsIndicator),
  sticky: fromHook(useStickyIndicator),
  "tibot-rings": fromHook(useTibotIndicator),
}

function makeButton(id, Source) {
  return forwardRef(function IndicatorButton({ face, label, count, ...props }, ref) {
    const { t } = useLocale()
    const f = faceOf(id, face)
    // Tepside "yalnız simge" seçildiyse çentikte de bilgi yok (yüz tek seçim).
    const quiet = faceOptionsOf(id).shows.length > 0 && f.show === "icon"
    return (
      <Source face={f}>
        {(ind) => {
          const on = quiet ? null : ind
          return (
            <RailButton
              ref={ref}
              label={label}
              srSuffix={on ? t("notchInd.suffix", { value: on.sr }) : undefined}
              count={on?.count ?? count}
              value={on?.count ? null : fitText(on?.text)}
              dot={Boolean(on?.dot)}
              alert={Boolean(on?.alert)}
              {...props}
            />
          )
        }}
      </Source>
    )
  })
}

// Modül düzeyinde bir kez: her çizimde yeni bileşen olsa düğme (ve Radix'in ref'i) yeniden doğardı.
const BUTTONS = Object.fromEntries(
  Object.entries(SOURCES).map(([id, Source]) => [id, makeButton(id, Source)]),
)

/**
 * Ray düğmesi + yuvanın göstergesi. `indicator`: widget kimliği; `face` tepsideki
 * yüz seçimi. Göstergesi olmayan widget'ta düz `RailButton`. Ref Radix tetikleyicisine geçer.
 */
export const IndicatorRailButton = forwardRef(function IndicatorRailButton(
  { indicator, face, ...props },
  ref,
) {
  const Button = BUTTONS[indicator]
  if (!Button) return <RailButton ref={ref} {...props} />
  return <Button ref={ref} face={face} {...props} />
})
