import "@/lib/i18n/insight"
import { useMemo } from "react"
import { motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { greetingKey } from "@/lib/greeting"
import { formatCount, getDateTimeFormat, pluralKey } from "@/lib/intl-cache"
import { meetingsLeftToday } from "../lib/meetingsLeft"
import { weatherInsight } from "../lib/weatherInsight"
import { useGreetingHeading } from "../useGreetingHeading"
import { OPTS_CARD_TIME_12, OPTS_TIME, condKey, useWeatherFormat } from "../weather/weatherFormat"
import { weatherInsightText } from "../weather/weatherInsightText"
import { useLineDissolve } from "./useLineDissolve"
import { initialsOf, lowerFirst, markValues } from "./welcomeText"
import { Coins, Mark, Value, WeatherPearl } from "./WelcomeTokens"

// Şablon yuvalarının işaretleri (özel kullanım alanı: çeviride geçmez).
const SLOT_A = ""
const SLOT_B = ""
const MAX_COINS = 3

const partsOf = (parts) =>
  parts.map((p, i) => (p.mark ? <Value key={i} text={p.text} /> : <span key={i}>{p.text}</span>))

/** Şablonu yer tutucu işaretlerinden böler, her işaretin yerine düğümünü koyar. */
function fill(template, nodes) {
  return template.split(/([])/).map((piece, i) => nodes[piece] ?? <span key={i}>{piece}</span>)
}

/** Bugünkü toplantıların sahipleri (aynı kişi bir kez), baş harfleriyle. */
function coinsOf(meetings, locale) {
  const seen = new Set()
  const out = []
  for (const m of meetings) {
    const initials = initialsOf(m.organizer, locale)
    const key = (m.organizerAddress || m.organizer || "").toLocaleLowerCase(locale)
    if (!initials || !key || seen.has(key)) continue
    seen.add(key)
    out.push({ key, initials })
    if (out.length === MAX_COINS) break
  }
  return out
}

/** Bir satır, kendi geçişiyle: çekmece kalkarken üstten alta sırayla dağılır (`useLineDissolve`). */
function Line({ progress, index, children }) {
  const style = useLineDissolve(progress, index)
  return (
    <motion.div className="welcome-line" style={style}>
      {children}
    </motion.div>
  )
}

/**
 * Karşılamanın üç cümlesi, ürün sahibinin örneğinin dili: büyük, iki tonlu (normal yazı zeminin koyu
 * tonunda, ad ve değerler beyaz — tonlar paletten ölçülür, `useWelcomeInk`), değerlerin kesri küçük:
 * - selamlama ("İyi akşamlar, Ömer!"; kutlama gününde onun başlığı);
 * - hava: inci simge, sıcaklık ve kartın cümlesi;
 * - bugün kalan toplantılar, sahiplerinin pullarıyla.
 * Veri Anasayfa'nın: ek istek yok. Toplantı cümlesi Sunum modunda bulanık (`data-private` iç
 * öğede: satırın geçiş filtresi Sunum modunun bulanıklığını ezmesin).
 */
export function WelcomeLines({
  ref,
  progress,
  titleId,
  firstName,
  celebration,
  weather,
  cal,
  now,
}) {
  const { t, locale } = useLocale()
  const f = useWeatherFormat()
  const heading = useGreetingHeading(greetingKey(new Date(now).getHours()), celebration)
  const hello = t("insight.hello", { greeting: heading, name: "\u0000" }).split("\u0000")

  const sky = weather?.status === "ready" ? weather.forecast?.current : null
  const hourly = weather?.status === "ready" ? weather.forecast?.hourly : null
  const skyLine = useMemo(() => (hourly ? weatherInsight(hourly, now) : null), [hourly, now])
  const time24 = getDateTimeFormat(locale, OPTS_TIME)
  const timeFmt = time24.resolvedOptions().hour12
    ? getDateTimeFormat(locale, OPTS_CARD_TIME_12)
    : time24

  const calReady = cal.status === STATUS.ready
  const left = useMemo(
    () => (calReady ? meetingsLeftToday(cal.events, now) : null),
    [calReady, cal.events, now],
  )

  let weatherNode = null
  if (sky) {
    const rest = skyLine
      ? weatherInsightText(skyLine, { t, timeFmt, f })
      : t(condKey(sky.kind, sky.night))
    weatherNode = fill(t("insight.welcome.weather", { temp: SLOT_A, rest: SLOT_B }), {
      [SLOT_A]: (
        <span key="temp" className="welcome-nowrap">
          <WeatherPearl kind={sky.kind} night={sky.night} />
          <Value text={f.temp(sky.temp)} />
        </span>
      ),
      [SLOT_B]: <span key="rest">{partsOf(markValues(lowerFirst(rest, locale)))}</span>,
    })
  }

  let countNode = null
  if (left) {
    const n = left.length
    countNode =
      n === 0
        ? t("widgets.brief.noneLeft")
        : fill(t("insight.welcome.meetings", { q: SLOT_A }), {
            [SLOT_A]: (
              <span key="q">
                <Coins people={coinsOf(left, locale)} />
                <Mark>
                  {t(pluralKey("myspace.q.meetings", locale, n), { n: formatCount(locale, n) })}
                </Mark>
              </span>
            ),
          })
  }

  const waiting = (!weatherNode && weather?.status === "loading") || cal.status === "loading"

  const rows = [
    <h2 key="hello" id={titleId} className="welcome-hello">
      {/* Ünlem yanındaki kelimenin renginde (örnekteki gibi): ad sonda ise o da beyaz. */}
      {!firstName ? (
        `${heading}!`
      ) : hello[1] ? (
        <>
          {hello[0]}
          <Mark>{firstName}</Mark>
          {hello[1]}!
        </>
      ) : (
        <>
          {hello[0]}
          <Mark>{firstName}!</Mark>
        </>
      )}
    </h2>,
    weatherNode && <p key="weather">{weatherNode}</p>,
    countNode && (
      <p key="count" data-private="">
        {countNode}
      </p>
    ),
    waiting && <span key="wait" aria-hidden="true" className="welcome-skel" />,
  ].filter(Boolean)

  return (
    <div ref={ref} className="welcome-text" dir={locale === "ar" ? "rtl" : undefined}>
      {rows.map((row, i) => (
        <Line key={row.key} progress={progress} index={i}>
          {row}
        </Line>
      ))}
    </div>
  )
}
