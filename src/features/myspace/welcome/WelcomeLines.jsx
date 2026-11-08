import "@/lib/i18n/insight"
import { useMemo } from "react"
import { motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { STATUS } from "@/lib/graph"
import { greetingKey } from "@/lib/greeting"
import { formatCount, getDateTimeFormat, pluralKey } from "@/lib/intl-cache"
import { dayInsightText } from "../dayInsightText"
import { dayInsight } from "../lib/dayInsight"
import { meetingsLeftToday } from "../lib/meetingsLeft"
import { weatherInsight } from "../lib/weatherInsight"
import { useGreetingHeading } from "../useGreetingHeading"
import { condKey, useWeatherFormat } from "../weather/weatherFormat"
import { useLineDissolve } from "./useLineDissolve"
import { initialsOf, lowerFirst, shortenParts, weatherTip } from "./welcomeText"
import { Coins, Mark, OrbToken, Value, WeatherPearl } from "./WelcomeTokens"

// Şablon yuvalarının işaretleri (özel kullanım alanı: çeviride geçmez).
const SLOT_A = ""
const SLOT_B = ""
const MAX_COINS = 3

/** Günün okumasının parçaları: vurgulu olanlar beyaz (`**…**` işaretli). */
const marked = (parts) =>
  parts.map((p, i) => (p.mark ? <Mark key={i}>{p.text}</Mark> : <span key={i}>{p.text}</span>))

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
 * Karşılamanın cümleleri, ürün sahibinin örneğinin dili: büyük, iki tonlu (normal yazı zeminin koyu
 * tonunda, ad ve değerler beyaz — tonlar paletten ölçülür, `useWelcomeInk`):
 * - selamlama ("İyi akşamlar, Ömer!"; kutlama gününde onun başlığı);
 * - hava, kısa: inci simge, sıcaklık ve iki-üç sözlük öneri ("— kat kat giyin"; `weatherTip`,
 *   kartın uzun cümlesinden bağımsız);
 * - günün okuması (Anasayfa'daki selamlamanın altındaki cümle, `lib/dayInsight`); yoksa bugün kalan
 *   toplantılar, sahiplerinin pullarıyla;
 * - öneri varsa "TYRO 11:30–13:30 odak öneriyor": dokununca çekmece kapanır, Anasayfa'daki öneri
 *   kartı açılır (`onSuggest` — eylem tek yerde).
 * Veri Anasayfa'nın: ek istek yok. Kişisel cümleler Sunum modunda bulanık (`data-private` iç
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
  focus,
  rangeStart,
  rangeEnd,
  now,
  onSuggest,
}) {
  const { t, locale } = useLocale()
  const f = useWeatherFormat()
  const heading = useGreetingHeading(greetingKey(new Date(now).getHours()), celebration)
  const hello = t("insight.hello", { greeting: heading, name: "\u0000" }).split("\u0000")

  const sky = weather?.status === "ready" ? weather.forecast?.current : null
  const hourly = weather?.status === "ready" ? weather.forecast?.hourly : null
  const skyLine = useMemo(() => (hourly ? weatherInsight(hourly, now) : null), [hourly, now])

  const calReady = cal.status === STATUS.ready
  const left = useMemo(
    () => (calReady ? meetingsLeftToday(cal.events, now) : null),
    [calReady, cal.events, now],
  )
  // Günün okuması: Anasayfa'daki selamlamanın cümlesi ve önerisi (aynı hesap, aynı veri).
  const tasks = focus?.mode === "todo" && !focus.loading ? focus.tasks : null
  const day = useMemo(() => {
    if (!calReady) return null
    const ins = dayInsight({ events: cal.events, tasks, now, rangeStart, rangeEnd })
    return ins ? { ins, text: dayInsightText(ins, { t, locale }) } : null
  }, [calReady, cal.events, tasks, now, rangeStart, rangeEnd, t, locale])

  let weatherNode = null
  if (sky) {
    const tip = weatherTip(skyLine)
    const rest = tip
      ? t(`insight.welcome.tip.${tip}`)
      : lowerFirst(t(condKey(sky.kind, sky.night)), locale)
    weatherNode = fill(t("insight.welcome.weather", { temp: SLOT_A, rest: SLOT_B }), {
      [SLOT_A]: (
        <span key="temp" className="welcome-nowrap">
          <WeatherPearl kind={sky.kind} night={sky.night} />
          <Value text={f.temp(sky.temp)} />
        </span>
      ),
      [SLOT_B]: <span key="rest">{rest}</span>,
    })
  }

  let countNode = null
  if (left && !day) {
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

  const cue = day?.text.cue ?? null
  const focusCue = cue?.key === "focus" ? day.ins.action : null
  const time = getDateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  // Küre + "Tyro" (kimin önerdiği; ürün sahibi: ilk harf büyük) ve odak saatleri beyaz (adın ve değerlerin tonu), gerisi koyu ton.
  const brand = (
    <span key="brand" className="welcome-nowrap">
      <OrbToken />
      <Mark>Tyro</Mark>
    </span>
  )
  const suggestNode = cue
    ? focusCue
      ? fill(t("insight.welcome.suggestFocus", { brand: SLOT_B, range: SLOT_A }), {
          [SLOT_B]: brand,
          [SLOT_A]: (
            <Mark key="range">{`${time.format(focusCue.start)}–${time.format(focusCue.end)}`}</Mark>
          ),
        })
      : fill(t("insight.welcome.suggest", { brand: SLOT_B, cue: lowerFirst(cue.label, locale) }), {
          [SLOT_B]: brand,
        })
    : null

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
    day && (
      <p key="day" data-private="">
        {marked(shortenParts(day.text.parts, locale))}
      </p>
    ),
    countNode && (
      <p key="count" data-private="">
        {countNode}
      </p>
    ),
    suggestNode && (
      <p key="suggest">
        <button type="button" className="welcome-suggest" onClick={onSuggest}>
          <span>{suggestNode}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2.4}
            aria-hidden="true"
            className="welcome-suggest-go"
          />
        </button>
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
