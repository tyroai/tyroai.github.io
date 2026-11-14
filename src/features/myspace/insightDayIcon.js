import AirplaneTakeOff01Icon from "@hugeicons/core-free-icons/AirplaneTakeOff01Icon"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"

// Günün okumasının satır simgesi hikâyeye göre; öteki her şey takvim (çekmece ve Master kart).
const DAY_ICON = {
  trip: AirplaneTakeOff01Icon,
  tripCity: AirplaneTakeOff01Icon,
  away: Beach02Icon,
  awayMeetings: Beach02Icon,
  bridge: Beach02Icon,
}

export const dayIcon = (id) =>
  DAY_ICON[id] ?? (id.startsWith("tasks") ? CheckListIcon : Calendar03Icon)
