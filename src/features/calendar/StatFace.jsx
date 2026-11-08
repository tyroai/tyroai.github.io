import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { ITEM_ICONS } from "./icons"

// Satırın simgesi: bakiye ve dönem satırları; izin, görev ve kutlama çiplerle aynı simge.
const ICONS = {
  check: CheckmarkCircle02Icon,
  clock: Clock01Icon,
  calendar: Calendar03Icon,
  people: UserGroupIcon,
  flag: Flag02Icon,
  leave: ITEM_ICONS.leave,
  task: ITEM_ICONS.taskDone,
  cake: ITEM_ICONS.cake,
}

/** Yumuşak tonlu simge kutusu (`data-tone` kabın üstünde: satır ya da balon). */
export function StatIcon({ name }) {
  return (
    <span className="cal-stat-ic">
      <HugeiconsIcon icon={ICONS[name]} className="cal-ic" strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

/** Satırın yüzü: simge kutusu, başlık ve alt yazı (dönemin adı: "Bu hafta"). */
export function StatFace({ row }) {
  return (
    <>
      <StatIcon name={row.icon} />
      <span className="cal-stat-text">
        <strong data-private="">{row.title}</strong>
        {row.sub && <span>{row.sub}</span>}
      </span>
    </>
  )
}
