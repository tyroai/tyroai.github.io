import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { partLook as leavePartLook } from "@/features/selfservice/narrate/narrateLook"
import { dayKey } from "@/features/calendar/lib/range"
import { addDays } from "@/lib/leaveDays"
import { dayFull } from "../format"

// En çok bu kadar katılımcı çipi; fazlası tek çipte sayı.
const WHO = 3

/** Türün simgesi, adı ve rengi (Yeni menüsündeki seçenekle aynı: `data-tone`). */
export const KIND_LOOK = {
  meeting: { icon: CalendarAdd01Icon, label: "calendar.page.kind.meeting", tone: "meeting" },
  task: { icon: TaskAdd01Icon, label: "calendar.page.kind.task", tone: "task" },
  leave: { icon: Beach02Icon, label: "calendar.page.kind.myLeave", tone: "myLeave" },
}

/** "Bugün", "Yarın", yoksa "29 Ekim Perşembe". */
export function dayLabel(date, today, t, locale) {
  if (dayKey(date) === dayKey(today)) return t("calendar.today")
  if (dayKey(date) === dayKey(addDays(today, 1))) return t("calendar.tomorrow")
  return dayFull(date, locale)
}

function partLook(part, { t, locale, today }) {
  switch (part.key) {
    case "when":
      return {
        icon: Calendar03Icon,
        text: `${dayLabel(part.day, today, t, locale)} ${part.from}–${part.to}`,
      }
    case "due":
      return { icon: Calendar03Icon, text: dayLabel(part.date, today, t, locale) }
    case "who":
      return { icon: UserIcon, text: part.value }
    case "teams":
      return { icon: Video01Icon, text: t("calendar.filter.teams") }
    case "inPerson":
      return { icon: UserGroupIcon, text: t("calendar.narrate.inPerson") }
    case "where":
      return { icon: Location01Icon, text: part.value }
    case "title":
      return { icon: Edit02Icon, text: part.value }
    // İzin: Self Servis'in Anlat'ıyla aynı çipler (tür, tarih · iş günü).
    default:
      return leavePartLook(part, t, locale)
  }
}

/** Anlaşılan parçaların çipleri: `{ id, icon, tone?, text }`. Katılımcılar üçten sonra "+n". */
export function chipsOf(result, ctx) {
  const who = result.parts.filter((p) => p.key === "who")
  const shown = result.parts.filter((p) => p.key !== "who" || who.indexOf(p) < WHO)
  const chips = shown.map((p, i) => ({
    id: `${p.key}${i}`,
    ...partLook(p, ctx),
  }))
  if (who.length > WHO) {
    chips.splice(shown.indexOf(who[WHO - 1]) + 1, 0, {
      id: "more",
      text: `+${who.length - WHO}`,
    })
  }
  return chips
}
