import "@/lib/i18n/insight"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_WEEKDAY = { weekday: "long" }
const OPTS_X = { maximumFractionDigits: 1 }

/**
 * Sözlük cümlesindeki `**vurgu**` işaretleri → `[{ text, mark }]`. Vurgu cümlenin içinde
 * durur, dilin söz dizimine göre yer değiştirebilir (RU, AR); işaret yoksa tek parça.
 */
export function splitMarks(text) {
  return String(text)
    .split("**")
    .map((part, i) => ({ text: part, mark: i % 2 === 1 }))
    .filter((p) => p.text)
}

/** Dakika → "3 sa 30 dk" (Anasayfa'nın toplantı birimleri; ipucu satırları). */
export function durationText(t, minutes) {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return t("myspace.meeting.unit.m", { m })
  return m ? t("myspace.meeting.unit.hm", { h, m }) : t("myspace.meeting.unit.h", { h })
}

/** Cümle içi süre: yarım saate yuvarlı saat ("4,5 saat") ya da dakika ("45 dk"). */
export function hoursText(t, locale, minutes) {
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return t("insight.unit.m", { n: total })
  const n = getNumberFormat(locale, OPTS_X).format(Math.round(total / 30) / 2)
  return t("insight.unit.h", { n })
}

export const cap = (s, locale) => (s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s)
export const weekdayName = (d, locale) =>
  cap(getDateTimeFormat(locale, OPTS_WEEKDAY).format(d), locale)
export const timeFormat = (locale) => getDateTimeFormat(locale, OPTS_TIME)

// Önerinin etiketi kartta eylemi olmayan hikâyelerde: neyin önerildiği tek sözle.
const CUE_BY_ID = {
  streak: "break",
  packed: "break",
  nextStreak: "rest",
  nextEarly: "rest",
  awayMeetings: "reply",
  trip: "pack",
  tripCity: "pack",
  contrast: "ahead",
  contrastClear: "ahead",
}

/**
 * Cümlenin sonundaki kısa öneri (1–2 söz + simge; `insight.cue.*`): kartta eylem varsa eylemin
 * adı (odakta saatiyle), yoksa önerinin kendisi; söylenecek öneri yoksa `null` (ⓘ kalır).
 * Öneri cümlesi (eski "En uzun boşluğun …; derin işi oraya koy.") bunun yerine geldi: bilgisi kartta.
 */
export function cueOf(ins) {
  const kind = ins.action?.kind
  if (kind === "focus" || kind === "leave") return kind
  if (kind === "plan")
    return ins.tail === "tasksMove" || ins.id.startsWith("tasksTight") ? "move" : "plan"
  if (ins.tail === "noWindow") return "break"
  return CUE_BY_ID[ins.id] ?? null
}

/**
 * Günün okumasının cümlesi (`lib/dayInsight` sonucundan): neden cümlesi, sonundaki öneri etiketi
 * (`cue`: anahtar ve metin) ve ipucu kartının üst etiketi (bakılan gün). Kartın satırları ve
 * eylemi tembel parçada (`insight/InsightBody`). `prefix`: cümlenin sözlük kökü — karşılama
 * çekmecesi aynı hikâyeyi kendi, daha sohbet eder gibi diliyle anlatır (`insight.welcome.day`).
 */
export function dayInsightText(ins, { t, locale, prefix = "insight" }) {
  const time = timeFormat(locale)
  const fmt = (d) => (d ? time.format(d) : "")
  const weekday = weekdayName(ins.date, locale)
  const day =
    ins.day === "weekday" ? t("insight.day.weekday", { weekday }) : t(`insight.day.${ins.day}`)
  const params = {
    day,
    time: fmt(ins.time),
    start: fmt(ins.start),
    end: fmt(ins.end),
    n: ins.n ?? "",
    tasks: ins.tasks ?? "",
    x: ins.x ? getNumberFormat(locale, OPTS_X).format(ins.x) : "",
    minutes: ins.minutes != null ? hoursText(t, locale, ins.minutes) : "",
    free: ins.free != null ? hoursText(t, locale, ins.free) : "",
    other: ins.other ? weekdayName(ins.other, locale) : "",
    otherMinutes: ins.otherMinutes != null ? hoursText(t, locale, ins.otherMinutes) : "",
    city: ins.city ? (ins.city[locale] ?? ins.city.en ?? Object.values(ins.city)[0]) : "",
    holiday: ins.holiday ? t(`widgets.holiday.name.${ins.holiday}`) : "",
  }
  const text = t(`${prefix}.${ins.id}`, params)
  const cue = cueOf(ins)
  const focus = ins.action?.kind === "focus" ? ins.action : null
  return {
    parts: splitMarks(text),
    plain: text.replaceAll("**", ""),
    cue: cue
      ? {
          key: cue,
          label: t(`insight.cue.${cue}`, { start: fmt(focus?.start), end: fmt(focus?.end) }),
        }
      : null,
    kicker: ins.day === "weekday" ? weekday : t(`insight.day.${ins.day}`),
  }
}
