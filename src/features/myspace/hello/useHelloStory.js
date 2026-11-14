import "@/lib/i18n/insight"
import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { greetingKey } from "@/lib/greeting"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cardSkyOf } from "@/lib/weatherSky"
import { dayInsightText } from "../dayInsightText"
import { dayInsight } from "../lib/dayInsight"
import { meetingsLeftToday } from "../lib/meetingsLeft"
import { weatherInsight } from "../lib/weatherInsight"
import { useGreetingHeading } from "../useGreetingHeading"
import { condKey, useWeatherFormat } from "../weather/weatherFormat"
import { lowerFirst, shortenParts, weatherTip } from "../welcome/welcomeText"
import { weatherNote } from "./weatherNote"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_DATE = { weekday: "long", day: "numeric", month: "long" }

/**
 * TYRO Karşılama'nın hikâyesi — telefondaki karşılama çekmecesiyle AYNI dil: selamlama, havanın
 * kısa önerisi (`weatherTip`), günün okuması çekmecenin sohbet eder gibi cümlesiyle
 * (`insight.welcome.day.*`) ve TYRO'nun birinci tekil önerisi (`insight.welcome.offer.*`). Veri
 * Anasayfa'nın (takvim, To Do, hava): ek istek yok. Saf hesaplar `lib/dayInsight` ve
 * `welcomeText`te (testli); burada yalnız birleştirilir.
 */
export function useHelloStory({ weather, cal, focus, now, rangeStart, rangeEnd, celebration }) {
  const { t, locale } = useLocale()
  const f = useWeatherFormat()
  const heading = useGreetingHeading(greetingKey(new Date(now).getHours()), celebration)

  const ready = weather?.status === "ready"
  const current = ready ? weather.forecast?.current : null
  const hourly = ready ? weather.forecast?.hourly : null
  const reading = useMemo(() => (hourly ? weatherInsight(hourly, now) : null), [hourly, now])

  const calReady = cal?.status === STATUS.ready
  const events = cal?.events
  const tasks = focus?.mode === "todo" && !focus.loading ? focus.tasks : null
  const scene = useMemo(
    () => ({ events: events ?? [], tasks, now, rangeStart, rangeEnd }),
    [events, tasks, now, rangeStart, rangeEnd],
  )
  const insight = useMemo(() => (calReady ? dayInsight(scene) : null), [calReady, scene])
  const day = useMemo(() => {
    if (!insight) return null
    const text = dayInsightText(insight, { t, locale, prefix: "insight.welcome.day" })
    return { ...text, parts: shortenParts(text.parts, locale) }
  }, [insight, t, locale])
  const left = useMemo(
    () => (calReady && !insight ? meetingsLeftToday(events, now) : null),
    [calReady, insight, events, now],
  )

  const time = getDateTimeFormat(locale, OPTS_TIME)
  const sky = current
    ? {
        temp: f.temp(current.temp),
        kind: current.kind,
        night: current.night,
        scene: cardSkyOf(current.kind),
        cond: t(condKey(current.kind, current.night)),
        place: weather.place?.name || t("myspace.weather.here"),
        // Başlıkta kısa ad: "Karadeniz Ereğli · Kozlu" → "Karadeniz Ereğli" (tamamı ipucunda).
        city: (weather.place?.name || t("myspace.weather.here")).split(" · ")[0],
        hiLo: weather.forecast?.range24
          ? t("insight.note.hiLo", {
              max: f.temp(weather.forecast.range24.max),
              min: f.temp(weather.forecast.range24.min),
            })
          : null,
        tip: (() => {
          const tip = weatherTip(reading)
          return tip
            ? t(`insight.welcome.tip.${tip}`)
            : lowerFirst(t(condKey(current.kind, current.night)), locale)
        })(),
      }
    : null

  const cue = day?.cue ?? null
  const focusAction = cue?.key === "focus" ? insight.action : null
  const offer = cue
    ? {
        key: cue.key,
        range: focusAction
          ? `${time.format(focusAction.start)}–${time.format(focusAction.end)}`
          : null,
        focus: focusAction,
        text: focusAction ? null : t(`insight.welcome.offer.${cue.key}`),
      }
    : null

  const wxNote = weatherNote(reading, { t, time, f })
  const wxTip = weatherTip(reading)
  const hello = t("insight.hello", { greeting: heading, name: "\u0000" }).split("\u0000")
  return {
    heading,
    hello,
    date: getDateTimeFormat(locale, OPTS_DATE).format(new Date(now)),
    clock: time.format(new Date(now)),
    sky,
    wxNote,
    wxTip,
    calReady,
    weatherState: weather?.status ?? "off",
    insight,
    day,
    left,
    offer,
    scene,
    loading: cal?.status === "loading" || weather?.status === "loading",
  }
}
