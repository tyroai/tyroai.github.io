import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { renderWidgetFor } from "@/features/widgets/renderWidget"
import { useFeedFresh } from "@/hooks/useFeedUnread"
import { useFocusTasks } from "@/hooks/useFocusTasks"
import { useMailMessages } from "@/hooks/useMailMessages"
import { useMe } from "@/hooks/useMe"
import { useMyCelebration } from "@/hooks/useMyCelebration"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useTodoBoard } from "@/hooks/useTodoBoard"
import { useWeather } from "@/hooks/useWeather"
import { looksOf } from "@/features/widgets/layout"
import { REGISTRY } from "@/features/widgets/registry"
import { useBoardCalendar, useMeetingLoad } from "@/features/widgets/useBoardCalendar"
import { useLookProps } from "@/features/widgets/lookProps"
import { baseLook } from "@/features/widgets/paletteTokens"
import { CardInkContext } from "@/features/widgets/useBrandInk"
import "@/features/widgets/widgetLooks.css"
import { RENDER_AS } from "./headerStore"

function useBase() {
  const now = useMinuteNow()
  const pageAccess = usePageAccess()
  const me = useMe()
  return { now, pageAccess, firstName: (me.name || "").split(" ")[0] }
}

const ctxOf = (b, more = {}) => ({ now: b.now, pageAccess: b.pageAccess, ...more })
const show = (id, env) => renderWidgetFor(env)(RENDER_AS[id] ?? id, "h-full")

function BaseBody({ id }) {
  const b = useBase()
  return show(id, { ...b, ctx: ctxOf(b) })
}

function WeatherBody({ id }) {
  const b = useBase()
  const weather = useWeather()
  return show(id, { ...b, weather, ctx: ctxOf(b) })
}

function CalBody({ id }) {
  const b = useBase()
  const { cal, rangeStart, rangeEnd } = useBoardCalendar()
  const load = useMeetingLoad(cal.events, b.now, rangeStart, rangeEnd)
  return show(id, { ...b, load, ctx: ctxOf(b, { cal }) })
}

function BriefBody({ id }) {
  const b = useBase()
  const { cal } = useBoardCalendar()
  const mail = useMailMessages(12)
  const focus = useFocusTasks()
  const feedFresh = useFeedFresh()
  const celebration = useMyCelebration()
  return show(id, { ...b, celebration, ctx: ctxOf(b, { cal, mail, focus, feedFresh }) })
}

function FocusBody({ id }) {
  const b = useBase()
  const focus = useFocusTasks()
  return show(id, { ...b, focus, ctx: ctxOf(b, { focus }) })
}

function TodoBody({ id }) {
  const b = useBase()
  const board = useTodoBoard()
  return show(id, { ...b, ctx: ctxOf(b, { board }) })
}

// Hangi widget hangi veriyi ister: kayıttaki `data` (`renderWidget`in okudukları). Header'da açılan
// widget yalnız kendi grubunun kancalarını çağırır: To-Do panosu gibi ağır okumalar ancak o widget
// açılınca. Grubu olmayanlar veriyi kendileri çeker (piyasa, posta, Planner, dosyalar, ekip, radyo)
// ya da yalnız saati ister (tatil, dünya saati).
const BODY = {
  weather: WeatherBody,
  brief: BriefBody,
  cal: CalBody,
  focus: FocusBody,
  todo: TodoBody,
}

/**
 * Header'da açılan widget'ın kendisi — panodaki kartın aynısı, açılır pencerenin boyunda
 * (`@container/myspace`: kartlar tek sütunluk panodaki gibi dizilir). Görünüm kartın kabuğunda
 * (`data-widget-look`, panodaki gibi).
 */
export default function HeaderWidgetBody({ id, look: chosen }) {
  const Body = BODY[REGISTRY[id]?.data] ?? BaseBody
  // Kartın kendi görünümü yoksa (hava, To-Do özeti) seçim yalnız tepsideki kapsülün.
  const look = looksOf(id).includes(baseLook(chosen)) ? chosen : looksOf(id)[0]
  const [lookProps, cardInk] = useLookProps(
    id,
    look,
    "@container/myspace flex h-full min-h-0 flex-col",
  )
  return (
    <div {...lookProps}>
      <CardInkContext.Provider value={cardInk}>
        <Body id={id} />
      </CardInkContext.Provider>
    </div>
  )
}
