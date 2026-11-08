import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon"
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import File02Icon from "@hugeicons/core-free-icons/File02Icon"
import Notification03Icon from "@hugeicons/core-free-icons/Notification03Icon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import Task01Icon from "@hugeicons/core-free-icons/Task01Icon"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { cityName } from "@/lib/worldClock"

const TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const SHORT_DAY = { day: "numeric", month: "short" }
const TAKE_DAY = { weekday: "short", day: "numeric", month: "short" }
const NUM = { int: { maximumFractionDigits: 0 }, dec1: { maximumFractionDigits: 1 } }

const ACT = {
  prepare: ["orb.act.prepare", SparklesIcon],
  recap: ["orb.act.recap", File02Icon],
  trip: ["orb.act.trip", Task01Icon],
  load: ["orb.act.load", Analytics01Icon],
  focusFree: ["orb.act.focusFree", CalendarAdd01Icon],
  bridge: ["orb.act.bridge", Calendar01Icon],
  planDay: ["orb.act.plan", Task01Icon],
  weekPlan: ["orb.act.plan", Task01Icon],
  tomorrow: ["orb.act.plan", Task01Icon],
  weekWrap: ["orb.act.weekWrap", File02Icon],
  weekend: ["orb.act.weekend", File02Icon],
  feed: ["orb.act.feed", Notification03Icon],
}

const range = (locale, opts, a, b) => {
  const f = getDateTimeFormat(locale, opts)
  return f.formatRange ? f.formatRange(a, b) : `${f.format(a)}–${f.format(b)}`
}

/** Seyahatin yeri: şehir, yoksa konum, yoksa konu (28 harfte kesilir). */
export function placeOf(trip, locale) {
  const name = trip.city ? cityName(trip.city, locale) : trip.location || trip.subject || ""
  return name.length > 28 ? `${name.slice(0, 27)}…` : name
}

/**
 * Sahne verisinin metni (`sceneFacts` → kart): üst satır, tek bakışlık başlık (sayı + birim ya
 * da cümle), alt satır, düğmenin adı ve simgesi. Sayı ve tarih `Intl` ile, dilin biçiminde.
 */
export function sceneCopy(facts, slide, t, locale) {
  const { lead, support } = facts
  let main
  if (lead.type === "hero")
    main = {
      num: getNumberFormat(locale, NUM[lead.fmt]).format(lead.value),
      unit: t(lead.unitKey),
    }
  else if (lead.type === "time")
    main = { num: getDateTimeFormat(locale, TIME).format(lead.at), unit: t(lead.unitKey) }
  else if (lead.type === "key") main = { text: t(lead.key) }
  else if (lead.type === "range") main = { text: range(locale, TIME, lead.from, lead.to) }
  else if (lead.type === "place") main = { text: placeOf(slide.trip, locale) }
  else main = { text: lead.text || t("calendar.noSubject") }

  let sup = null
  if (support?.type === "text")
    sup = { text: support.text || t("calendar.noSubject"), tone: support.tone }
  else if (support?.type === "key") sup = { text: t(support.key), tone: "callout" }
  else if (support?.type === "range")
    sup = { text: range(locale, TIME, support.from, support.to), tone: "footnote" }
  else if (support?.type === "trip")
    sup = {
      text: `${support.days === 1 ? t("orb.trip.tomorrow") : t("orb.trip.inDays", { n: getNumberFormat(locale).format(support.days) })} · ${range(locale, SHORT_DAY, support.from, support.to)}`,
      tone: "footnote",
    }
  else if (support?.type === "take")
    sup = {
      text: t("orb.bridge.take", { day: getDateTimeFormat(locale, TAKE_DAY).format(support.day) }),
      tone: "footnote",
    }
  else if (support?.type === "chips") {
    const f = getNumberFormat(locale)
    const fmt = (n) => (n == null ? null : f.format(n))
    sup = { chips: { meetings: fmt(support.meetings), tasks: fmt(support.tasks) } }
  }

  const [actKey, icon] = ACT[facts.kind]
  return { kicker: t(`orb.kicker.${facts.kind}`), main, sup, act: t(actKey), icon }
}

/** Başlığın düz metni (satır tahmini için). */
export const mainText = (main) => main.text ?? `${main.num} ${main.unit}`
