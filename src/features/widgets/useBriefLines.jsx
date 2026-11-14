import { Fragment, useMemo } from "react"
import { InsightTerm } from "@/features/myspace/InsightTerm"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { plural } from "@/hooks/useBrief"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const CATS = new Set(["zero", "one", "two", "few", "many", "other"])

/** Şablondaki adlı yuvalara (`{q}` · `{time}`) vurgulu terimleri koyar (özetin `fill`i). */
function fill(template, slots) {
  const parts = String(template).split(/\{(\w+)\}/)
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{i % 2 ? (slots[part] ?? `{${part}}`) : part}</Fragment>
      ))}
    </>
  )
}

/**
 * Brifingin iki cümlesi — Karşılama (`card: "intro"`) ve TYRO brifingi (`card: "brief"`)
 * ortak. Toplantı ifadeleri Anasayfa özetindeki gibi VURGULU (noktalı alt çizgi; üstüne
 * gelince ya da basınca toplantılar, listeden önizleme, dipte takvim): bugün kalanlar ve
 * sıradakinin saati, hafta sonunda bir sonraki iş gününün toplantıları ve ilkinin saati.
 * Akşam bugün toplantı kalmadıysa alt satır bir sonraki iş gününün toplantıları (başlığa
 * eklenince tek satırlık başlık kesiliyor, vurgulu terim görünmüyordu). Hiç iş bitmediyse
 * "0 iş bitti" değil, yalnız kapanış cümlesi (sıfır bir sayı değil cümle).
 * `meetingsTip`: `useBriefTips`ten.
 */
export function useBriefLines(brief, meetingsTip, { card = "intro" } = {}) {
  const { t, locale } = useLocale()
  const rules = useMemo(() => new Intl.PluralRules(locale), [locale])
  const time = getDateTimeFormat(locale, OPTS_TIME)
  const intro = card === "intro"
  // Sayı ardındaki sözcüğe bölünmez boşlukla bağlı (özetin kuralı).
  const phrase = (n) => {
    const cat = rules.select(n)
    return t(`myspace.q.meetings.${CATS.has(cat) ? cat : "other"}`, { n }).replace(
      /(\p{Nd}+) /u,
      "$1 ",
    )
  }
  const term = (list, title, children, tone = "from") => (
    <InsightTerm tone={tone} {...meetingsTip(list, title)}>
      {children}
    </InsightTerm>
  )
  const day = brief.dayName
  const next = brief.nextMeetings
  const nextTerm = () => term(next, t("widgets.intro.tip.next", { day }), phrase(next.length))
  const nextLine = () => fill(t("widgets.intro.s.next", { day }), { q: nextTerm() })
  const closing = brief.doneToday
    ? plural(t, "widgets.brief.evening", brief.doneToday)
    : t("widgets.brief.eveningNone")

  let headline
  if (brief.weekend)
    headline = next.length
      ? intro
        ? nextLine()
        : fill(t("widgets.brief.s.weekend", { day }), { q: nextTerm() })
      : t(intro ? "widgets.intro.calm" : "widgets.brief.weekendCalm", { day })
  else if (brief.part === "evening") headline = closing
  else if (brief.items.length)
    headline = intro
      ? plural(t, "widgets.intro.waiting", brief.items.length)
      : plural(t, `widgets.brief.waiting.${brief.part}`, brief.items.length)
  else headline = t("widgets.brief.clear")
  // Dar kartta selamlamasız hâli ("5 konu seni bekliyor."): selam kesilip asıl bilgi kaybolmasın.
  const shortHeadline =
    !intro && !brief.weekend && brief.part !== "evening" && brief.items.length
      ? plural(t, "widgets.intro.waiting", brief.items.length)
      : headline

  let meetingLine = null
  let shortMeetingLine = null
  if (brief.weekend) {
    if (next[0])
      meetingLine = fill(t("widgets.intro.s.first", { day }), {
        q: term([next[0]], t("widgets.intro.tip.first"), time.format(next[0].start), "via"),
      })
  } else if (brief.left.length) {
    // İki yuva: kalan toplantılar ve sıradakinin saati (o toplantının kendi ipucu). Dar kartın
    // kısası saati öne alır: kesilen satırda kaybolan sıradakinin saatiydi.
    const slots = {
      q: term(brief.left, t("myspace.tip.meetings.title"), phrase(brief.left.length)),
      time: term(
        [brief.left[0]],
        t("widgets.brief.tip.next"),
        time.format(brief.left[0].start),
        "via",
      ),
    }
    meetingLine = fill(t("widgets.intro.s.left"), slots)
    shortMeetingLine = fill(t("widgets.intro.s.leftShort"), slots)
  } else if (brief.part === "evening" && next.length) meetingLine = nextLine()
  else meetingLine = t("widgets.brief.noneLeft")

  return { headline, shortHeadline, meetingLine, shortMeetingLine: shortMeetingLine ?? meetingLine }
}
