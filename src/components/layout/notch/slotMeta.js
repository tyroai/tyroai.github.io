import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import { isBuiltinSlot } from "@/lib/notchSlots"
import { headerTitleKey } from "../headerWidgets/headerStore"
import { trayIcon } from "../headerWidgets/trayIcon"

// Yerleşik üçlünün ikonu ve adı; widget yuvası tepsinin ikonu ve adıyla.
export const BUILTIN = {
  mail: { icon: Mail01Icon, name: "notch.mail" },
  calendar: { icon: CalendarAdd01Icon, name: "notch.calendar" },
  clocks: { icon: TimeZoneIcon, name: "notch.clocks" },
}
export const slotIcon = (id) => (isBuiltinSlot(id) ? BUILTIN[id].icon : trayIcon(id))
export const slotNameKey = (id) => (isBuiltinSlot(id) ? BUILTIN[id].name : headerTitleKey(id))
