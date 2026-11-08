import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import DashboardSquareEditIcon from "@hugeicons/core-free-icons/DashboardSquareEditIcon"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import SidebarRightIcon from "@hugeicons/core-free-icons/SidebarRightIcon"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useControlLinks } from "./controlStore"

// Yerleşik kısayollar: adresin komutuyla (`?new=` · `?edit=1`) ya da Denetim Merkezi'nin
// eylemiyle (`act`: çentiğin yuva seçicisi — telefonda çentik kutucuğu yok, yolu bu) açılır,
// sayfanın koduna bağlanmaz. Yalnız kişiye açık sayfanınkiler görünür.
const BUILT = [
  {
    id: "notch",
    icon: SidebarRightIcon,
    short: "control.notch.title",
    long: "control.notch.edit",
    act: ({ openNotchEdit }) => openNotchEdit(),
  },
  {
    id: "leave",
    icon: Beach02Icon,
    short: "control.sc.leave",
    long: "control.sc.leaveLong",
    to: () => "/self-service?tab=leave&new=leave",
    access: "selfService",
  },
  {
    id: "expense",
    icon: Invoice01Icon,
    short: "control.sc.expense",
    long: "control.sc.expenseLong",
    to: () => "/self-service?tab=expense&new=expense",
    access: "selfService",
  },
  {
    id: "meeting",
    icon: CalendarAdd01Icon,
    short: "control.sc.meeting",
    long: "control.sc.meetingLong",
    to: () => "/calendar?new=meeting",
    access: "calendar",
  },
  {
    id: "home",
    icon: DashboardSquareEditIcon,
    short: "control.sc.home",
    long: "control.sc.homeLong",
    to: () => "/myspace?edit=1",
    access: "homeEdit",
  },
]

/** Şeritte en çok bu kadar kısayol; fazlası "Diğer"in ardında (şerit hep tek satır). */
export const SHORTCUT_SLOTS = 5

/**
 * Kişiye açık kısayollar (yerleşikler + kendi bağlantıları), çalıştırılabilir biçimde:
 * `{ id, icon, label, tip, run(actions) }` — `actions` Denetim Merkezi'nin `go` · `close` ·
 * `openNotchEdit`i.
 */
export function useShortcutItems() {
  const access = usePageAccess()
  const links = useControlLinks()
  return [
    ...BUILT.filter((b) => !b.access || access[b.access]).map((b) => ({
      id: b.id,
      icon: b.icon,
      label: b.short,
      tip: b.long,
      translate: true,
      run: b.act ?? (({ go }) => go(b.to())),
    })),
    ...links.map((l) => ({
      id: l.id,
      icon: Link04Icon,
      label: l.name,
      tip: l.name,
      translate: false,
      run: ({ close }) => {
        window.open(l.url, "_blank", "noopener,noreferrer")
        close()
      },
    })),
  ]
}
