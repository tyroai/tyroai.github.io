import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import DashboardSquareEditIcon from "@hugeicons/core-free-icons/DashboardSquareEditIcon"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useControlLinks } from "./controlStore"

// Yerleşik kısayollar (sık kullanılandan): adresin komutuyla (`?new=` · `?edit=1`) ya da Denetim
// Merkezi'nin eylemiyle (`act`: hızlı görev panelin içinde açılır) açılır, sayfanın koduna
// bağlanmaz. Yalnız kişiye açık sayfanınkiler görünür. Çentiğin yuva seçicisi kısayolda değil:
// Çentik kutucuğu (Düzenle › ekle) ve çentiğin kendisi.
const BUILT = [
  {
    id: "task",
    icon: TaskAdd01Icon,
    short: "control.sc.task",
    long: "control.sc.taskLong",
    // Panelin içinde hızlı görev alanı açılır; panel dışından çağrılırsa To-Do sayfası.
    act: ({ open, go }) => (open ? open("tool:task") : go("/todo")),
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
 * `openNotchEdit`i ve şeridin `open`ı (paneldeki bir ayrıntıyı açar).
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
