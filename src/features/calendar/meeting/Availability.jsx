import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { useLocale } from "@/hooks/useLocale"
import { firstName } from "@/lib/calendar/attendees"
import { isOptional } from "@/features/calendar/lib/attendeeKinds"
import { clock, weekdayShort } from "../format"

const lower = (s) => String(s ?? "").toLowerCase()
const MAX_NAMES = 3

/**
 * Seçilen saatte katılımcıların durumu tek satırda (Herkes boş · Meşgul: Ayşe, Sen · Müsaitlik
 * görünmüyor: …; isteğe bağlı kişi "Ayşe (isteğe bağlı)" diye işaretli) ve zorunlu biri (ya da sen)
 * meşgulse ilk ortak boşluk: basınca tarih ve saat oraya kayar (süre aynı). Yalnız isteğe bağlı
 * kişi meşgulse öneri çıkmaz: onlar saati engellemez. Okunamayan müsaitlik (izin yok, ağ)
 * satırsızdır: hata değil, eksik bilgi. `avail`: `useAvailability`, `me`: kendi adresin.
 */
export function Availability({ avail, people, me, onApply }) {
  const { t, locale } = useLocale()
  const { status, view } = avail
  if (status === "loading") {
    return (
      <p className="cal-avail" data-tone="mute" role="status">
        <span>{t("calendar.meet.checking")}</span>
      </p>
    )
  }
  if (!view) return null

  const nameOf = (address) => {
    if (address === lower(me)) return t("person.you")
    const person = people.find((p) => lower(p.address) === address)
    const name = firstName(person)
    return isOptional(person) ? t("calendar.meet.optionalTag", { name }) : name
  }
  const names = (list) => {
    const shown = list.slice(0, MAX_NAMES).map(nameOf).join(", ")
    return list.length > MAX_NAMES ? `${shown} +${list.length - MAX_NAMES}` : shown
  }
  const busy = view.busy.length > 0
  // `blocking` yoksa (eski biçim) meşgul olan herkes engeldir.
  const blocked = (view.blocking ?? view.busy).length > 0
  const [tone, icon, text] = busy
    ? ["warn", Alert02Icon, t("calendar.meet.busyNames", { names: names(view.busy) })]
    : view.unknown.length
      ? [
          "mute",
          InformationCircleIcon,
          t("calendar.meet.unknownNames", { names: names(view.unknown) }),
        ]
      : ["ok", CheckmarkCircle02Icon, t("calendar.meet.allFree")]
  const next = view.next ? new Date(view.next) : null
  return (
    <div className="cal-avail" data-tone={tone} role="status">
      <HugeiconsIcon icon={icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
      <span>{text}</span>
      {blocked &&
        (next ? (
          <button type="button" className="cal-link" onClick={() => onApply(view.next)}>
            {t("calendar.meet.firstFree", {
              when: `${weekdayShort(next, locale)} ${clock(next, locale)}`,
            })}
          </button>
        ) : (
          <span className="cal-avail-note">{t("calendar.meet.noFree")}</span>
        ))}
    </div>
  )
}
