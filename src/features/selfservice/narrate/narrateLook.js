import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Coins01Icon from "@hugeicons/core-free-icons/Coins01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import Tag01Icon from "@hugeicons/core-free-icons/Tag01Icon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import { locationLabel } from "@/lib/advanceLocations"
import { formatMoney } from "@/lib/amountParse"
import { PROMPT_TEMPLATES, optionLabel } from "@/lib/promptTemplates"
import { leaveWorkdays } from "@/lib/requestForm"
import { categoryIcon } from "../detail/icons"
import { day, number, range } from "../kinds"
import { choiceIcon, purposeIcon, purposeTone } from "../request/advance/advanceLooks"
import { leaveKindLook } from "../request/field/leaveKinds"
import { capFirst } from "../request/formUi"

const LEAVE = PROMPT_TEMPLATES.leaveRequest.slots
const ADVANCE = PROMPT_TEMPLATES.advance.slots

/** Anlaşılan parçanın çipi: `{ icon, tone, text }` — formdaki alanın ikonu ve tonuyla aynı. */
export function partLook(part, t, locale) {
  const label = (slot) => capFirst(optionLabel(t, slot, part.value), locale)
  switch (part.key) {
    case "kind": {
      const look = leaveKindLook(part.value)
      return { icon: look.icon, tone: look.tone, text: label(LEAVE.kind) }
    }
    case "dates": {
      const days = leaveWorkdays(part.start, part.end)
      const when = range(part.start, part.end, locale)
      return {
        icon: Calendar03Icon,
        tone: "brand",
        text: days ? `${when} · ${number(days, locale)} ${t("selfService.form.workdays")}` : when,
      }
    }
    case "amount":
      return {
        icon: Coins01Icon,
        tone: "brand",
        text: formatMoney(part.value, part.currency ?? "TRY", locale),
      }
    case "purpose":
      return {
        icon: purposeIcon(part.value),
        tone: purposeTone(part.value),
        text: label(ADVANCE.purpose),
      }
    case "destination":
      return { icon: Location01Icon, tone: "brand", text: locationLabel(t, part.value) }
    case "payment":
      return { icon: choiceIcon(part.value, "bank"), tone: "brand", text: label(ADVANCE.payment) }
    case "document":
      return {
        icon: choiceIcon(part.value, "documented"),
        tone: "brand",
        text: label(ADVANCE.document),
      }
    case "title":
      // Masrafın açıklaması (başlıktaki hapın ikonuyla).
      return { icon: Note01Icon, tone: "brand", text: part.value }
    case "person":
      // Temsilci: formdaki kişi karosunun ikonu ve tonu; kesin kişiyi formda seçici bulur.
      return { icon: UserIcon, tone: "violet", text: part.value }
    case "range":
      // Temsilcinin tarihleri: iş günü sayılmaz (izin değil); bitiş yoksa yalnız başlangıç.
      return {
        icon: Calendar03Icon,
        tone: "brand",
        text: part.end ? range(part.start, part.end, locale) : day(part.start, locale),
      }
    case "line": {
      // Masraf kalemi: kategori · firma · tutar · tarih.
      const v = part.values
      return {
        icon: v.category ? categoryIcon({ category: v.category }) : Tag01Icon,
        tone: "brand",
        text: [
          v.category ?? t("selfService.narrate.noCategory"),
          v.firm,
          part.amount && formatMoney(part.amount, v.currency ?? "TRY", locale),
          v.date && day(v.date, locale, false),
        ]
          .filter(Boolean)
          .join(" · "),
      }
    }
    default:
      return { icon: Building03Icon, tone: "brand", text: String(part.value) }
  }
}
