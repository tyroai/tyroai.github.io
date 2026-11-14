import { useMemo } from "react"
import AlarmClockIcon from "@hugeicons/core-free-icons/AlarmClockIcon"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import Coffee02Icon from "@hugeicons/core-free-icons/Coffee02Icon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import Leaf01Icon from "@hugeicons/core-free-icons/Leaf01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import Sofa01Icon from "@hugeicons/core-free-icons/Sofa01Icon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { useLocale } from "@/hooks/useLocale"
import { formatCount, getDateTimeFormat, pluralKey } from "@/lib/intl-cache"
import { splitMarks } from "../dayInsightText"
import { dayIcon } from "../insightDayIcon"
import { leaveAhead, meetingLine, shortTitle } from "./chatLines"
import { pickSituations, situations } from "./situations"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }

// Satırın simgesi durumun kendisi (toplantı, izin, iş, posta…); günün okumasınınki hikâyesine göre.
const ICON = {
  overdueLeave: Beach02Icon,
  overdueWindow: CheckListIcon,
  overdueFriday: Flag02Icon,
  overdue: CheckListIcon,
  tibot: Ticket01Icon,
  mail: Mail01Icon,
  mailMorning: Mail01Icon,
  invites: CalendarAdd01Icon,
  leave: Beach02Icon,
  tomorrowEarly: AlarmClockIcon,
  weekend: Sofa01Icon,
  evening: Moon02Icon,
  friday: Flag02Icon,
  monday: SparklesIcon,
  lunch: Coffee02Icon,
  left: Calendar03Icon,
  calm: Leaf01Icon,
}

// Satırdaki vurgulu yazının ayrıntısı (kartta ipucu, `welcome/MarkTip`): brifingin hazır ipuçları.
const BRIEF_TIP = {
  overdueLeave: "overdue",
  overdueWindow: "overdue",
  overdueFriday: "overdue",
  overdue: "overdue",
  tibot: "tibot",
  mail: "mail",
  mailMorning: "mail",
  invites: "invites",
}

const capFirst = (s, locale) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1)

/** "Bugün {q} daha var." — sayım vurgulu (çekmecenin cümlesi). */
function leftParts(t, locale, n) {
  const q = t(pluralKey("myspace.q.meetings", locale, n), { n: formatCount(locale, n) })
  const [a, b = ""] = t("insight.welcome.meetings", { q: "\u0000" }).split("\u0000")
  return [{ text: a }, { text: q, mark: true }, { text: b }]
}

/**
 * Karşılama kartında ve çekmecesinde TYRO'nun satırları — telefondaki karşılama çekmecesinin mantığı: her satır bir durum
 * ve ona kısa bir öneri. Hava satırı yalnız gerçek bir öneri varsa ("10:00 sularında yağmur var,
 * şemsiyeni unutma."); ardından durum seçicinin (`situations`) en önemli adayları: o anki toplantı, günün okuması, iki sinyali bağlayan
 * iş durumları (izin + gecikmiş iş, boş aralık + gecikmiş iş), Ticket, önemli posta, yaklaşan izin,
 * yarının erken başlangıcı, haftanın ve günün anı. Sayım yok (TYRO brifinginde); önerinin
 * konusu satırda tekrar edilmez. Kart satır sayısını kendisi sınırlar. `tip`: satırdaki vurgulu
 * yazının ayrıntısı (toplantı kartı, toplantı listesi, brifing ipucu ya da günün okuması).
 */
export function useHelloChat(story, brief, offer) {
  const { t, locale } = useLocale()
  const { wxNote, day, insight, left, scene, calReady } = story
  const offerKey = offer?.key ?? null
  const freeRange = offer?.focus ? offer.range : null
  return useMemo(() => {
    const rows = []
    // Hava satırı yalnız gerçek bir öneri varsa (yağmur, kar, ayaz, sıcak, rüzgâr, sis…): derece ve
    // hava zaten göğün sağ üstünde (ürün sahibi: "tekrar beyaz tarafa yazmaya gerek yok").
    if (wxNote) rows.push({ id: "weather", icon: wxNote.icon, parts: wxNote.parts })

    const now = new Date(scene.now)
    const meeting = calReady ? meetingLine(scene.events, scene.now) : null
    const leave = calReady ? leaveAhead(scene.events, scene.now) : null
    const item = (id) => brief.items.find((x) => x.id === id)
    const ready = calReady && !brief.loading
    const all = situations({
      now,
      weekend: now.getDay() === 0 || now.getDay() === 6,
      meeting,
      day: !!day,
      dayKey: day ? (insight?.id ?? null) : null,
      left: left?.length ?? 0,
      freeRange,
      leave,
      overdue: item("overdue")?.n ?? 0,
      invites: item("invites")?.n ?? 0,
      importantMail: item("mail")?.important ?? 0,
      tibotLate: item("tibot")?.late ?? 0,
      tomorrowFirst: brief.nextMeetings?.[0]?.start ?? null,
      offerKey,
    }).filter((c) => ready || c.id !== "calm")

    const time = getDateTimeFormat(locale, OPTS_TIME)
    // Hava satırı yoksa yeri bir duruma kalır.
    for (const c of pickSituations(all, offerKey, wxNote ? 2 : 3)) {
      if (c.group === "now") {
        const title = shortTitle(meeting.event.subject || t("calendar.noSubject"))
        const text = t(`insight.chat.${c.id}`, {
          title,
          end: time.format(meeting.event.end),
          mins: meeting.mins ?? 0,
        })
        rows.push({
          id: "meeting",
          icon: UserGroupIcon,
          parts: splitMarks(text),
          tip: { kind: "event", event: meeting.event, live: meeting.key !== "soon" },
        })
      } else if (c.id === "day") {
        // İş hikâyesinde vurgu işlerin kendisi; ötekilerde günün okuması.
        const tasky = insight.id === "tasksTight" || insight.id === "tasksTightNone"
        rows.push({
          id: "day",
          icon: dayIcon(insight.id),
          parts: day.parts,
          tip: tasky ? { kind: "brief", id: "openTasks" } : { kind: "story" },
        })
      } else if (c.id === "left") {
        rows.push({
          id: "left",
          icon: ICON.left,
          parts: leftParts(t, locale, left.length),
          tip: { kind: "meetings", list: left, title: t("myspace.tip.meetings.title") },
        })
      } else if (c.id === "leave") {
        const weekday = getDateTimeFormat(locale, { weekday: "long" }).format(leave.date)
        const when =
          leave.when === "tomorrow"
            ? t("insight.day.tomorrow")
            : leave.when === "nextWeek"
              ? t("insight.chat.nextWeek", { weekday })
              : weekday
        const text = t("insight.chat.leave", { when: capFirst(when, locale) })
        rows.push({ id: "leave", icon: ICON.leave, parts: splitMarks(text) })
      } else {
        const params = {
          range: freeRange ?? "",
          time: brief.nextMeetings?.[0] ? time.format(brief.nextMeetings[0].start) : "",
        }
        const key = c.id === "calm" ? "insight.note.calm" : `insight.chat.${c.id}`
        const first = brief.nextMeetings?.[0]
        const tip = BRIEF_TIP[c.id]
          ? { kind: "brief", id: BRIEF_TIP[c.id] }
          : c.id === "tomorrowEarly" && first
            ? { kind: "event", event: first, live: false }
            : null
        rows.push({ id: c.id, icon: ICON[c.id], parts: splitMarks(t(key, params)), tip })
      }
    }
    return rows
  }, [wxNote, day, insight, left, scene, calReady, brief, freeRange, offerKey, t, locale])
}
