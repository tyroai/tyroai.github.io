import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import LayoutGridIcon from "@hugeicons/core-free-icons/LayoutGridIcon"
import Megaphone01Icon from "@hugeicons/core-free-icons/Megaphone01Icon"
import SecurityCheckIcon from "@hugeicons/core-free-icons/SecurityCheckIcon"
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon"
import TaskDone01Icon from "@hugeicons/core-free-icons/TaskDone01Icon"
import UserAccountIcon from "@hugeicons/core-free-icons/UserAccountIcon"
import UserCircleIcon from "@hugeicons/core-free-icons/UserCircleIcon"

const SHORTCUTS = "help-shortcuts"
const q = (n, to) => ({ n, to })

/**
 * Sayfa sayfa kılavuz verisi: en sık kullanılandan başlar. İkonlar kenar çubuğu ve aramadaki sayfa
 * ikonlarıyla aynı. Metinler sözlükte: `help.pages.<id>.{title,what,open}`,
 * `help.fn.<id>.<işlev>.{title,body}`, `help.faq.q|aN`.
 * - `to`: sayfanın adresi (yoksa düz blok); kapalı sayfanın bloğu gösterilmez (`canOpen`).
 * - `gate: "adminGroup"`: yalnız yönetici grubuna (Profilim'in Katalog kapısı).
 * - işlev `to`: işlevin yaşadığı tam yer (rota + `?tab=`/`?view=`); `anchor`: bu sayfadaki bölüm.
 * - soru `to`: cevabın yönlendirdiği yer; yoksa sayfanın adresi. Soru numaraları KALICI
 *   (`#faq-qN` paylaşılmış olabilir): yeni soru sona eklenir, eskisi silinse numara boş kalır.
 */
export const PAGES = [
  {
    id: "home",
    icon: DashboardSquare01Icon,
    to: "/myspace",
    functions: [
      { id: "ask", to: "/myspace" },
      { id: "brief", to: "/myspace" },
      { id: "meeting", to: "/myspace" },
      { id: "focus", to: "/myspace" },
      { id: "apps", to: "/myspace" },
      { id: "locked", to: "/myspace" },
      { id: "edit", to: "/myspace" },
    ],
    faq: [q(47), q(24), q(6), q(23), q(22)],
  },
  {
    id: "selfservice",
    icon: UserAccountIcon,
    to: "/self-service",
    functions: [
      { id: "request", to: "/self-service" },
      { id: "narrate", to: "/self-service" },
      { id: "expense", to: "/self-service?tab=expense" },
      { id: "review", to: "/self-service?tab=expense" },
      { id: "drafts", to: "/self-service" },
      { id: "records", to: "/self-service" },
      { id: "team", to: "/self-service?view=team" },
      { id: "export", to: "/self-service" },
    ],
    faq: [
      q(10),
      q(12),
      q(11, "/self-service?tab=expense"),
      q(46),
      q(16),
      q(17, "/self-service?tab=expense&status=returned"),
      q(18),
      q(19, "/self-service?view=team"),
      q(20),
      q(21),
    ],
  },
  {
    id: "feed",
    icon: AiArtIcon,
    to: "/feed",
    functions: [
      { id: "tabs", to: "/feed" },
      { id: "read", to: "/feed" },
      { id: "actions", to: "/feed" },
      { id: "customize", to: "/feed" },
      { id: "stories", to: "/feed" },
      { id: "forYou", to: "/feed?sec=important" },
      { id: "files", to: "/feed?sec=docs" },
      { id: "attachments", to: "/feed?sec=docs&fsrc=mail" },
    ],
    faq: [
      q(13),
      q(25),
      q(26),
      q(49),
      q(48, "/feed?sec=important"),
      q(27, "/feed?sec=docs&fsrc=mail"),
      q(53, "/feed?sec=docs&fsrc=people"),
      q(54, "/feed?sec=docs&fsrc=offices"),
      q(55, "/feed?sec=docs&fsrc=people"),
    ],
  },
  {
    id: "calendar",
    icon: Calendar03Icon,
    to: "/calendar",
    functions: [
      { id: "views", to: "/calendar" },
      { id: "new", to: "/calendar" },
      { id: "narrate", to: "/calendar" },
      { id: "summary", to: "/calendar" },
      { id: "shared", to: "/calendar" },
      { id: "leave", to: "/calendar" },
    ],
    faq: [q(56), q(57)],
  },
  {
    id: "todo",
    icon: TaskDone01Icon,
    to: "/todo",
    functions: [
      { id: "add", to: "/todo" },
      { id: "complete", to: "/todo" },
      { id: "views", to: "/todo" },
      { id: "detail", to: "/todo" },
      { id: "status", to: "/todo" },
      { id: "search", to: "/todo" },
    ],
    faq: [q(14), q(28, "/todo?view=all"), q(29), q(50), q(51)],
  },
  {
    id: "chat",
    icon: AiChat02Icon,
    to: "/chat",
    functions: [
      { id: "open", to: "/chat" },
      { id: "assistant", to: "/chat" },
      { id: "starters", to: "/chat" },
      { id: "attach", to: "/chat" },
      { id: "park", to: "/chat" },
      { id: "history", to: "/chat" },
      { id: "leaveForm", to: "/chat" },
    ],
    faq: [q(1, "/myspace"), q(31), q(32), q(30), q(9, "/profile?tab=notifications")],
  },
  {
    id: "header",
    icon: Calendar03Icon,
    functions: [
      { id: "notch" },
      { id: "mail" },
      { id: "calendar" },
      { id: "clocks" },
      { id: "special" },
      { id: "search", anchor: SHORTCUTS },
      { id: "menu", to: "/profile?tab=preferences" },
    ],
    faq: [q(4), q(33), q(5), q(34), q(35, "/feed?sec=docs"), q(52)],
  },
  {
    id: "profile",
    icon: UserCircleIcon,
    to: "/profile",
    functions: [
      { id: "access", to: "/profile?tab=access" },
      { id: "appearance", to: "/profile?tab=preferences" },
      { id: "notifications", to: "/profile?tab=notifications" },
      { id: "account", to: "/profile?tab=account" },
      { id: "browser", to: "/profile?tab=storage" },
    ],
    faq: [
      q(2, "/profile?tab=access"),
      q(37, "/profile?tab=preferences"),
      q(36, "/profile?tab=notifications"),
      q(38, "/profile?tab=account"),
      q(39, "/profile?tab=account"),
      q(3, "/profile?tab=storage"),
    ],
  },
  {
    id: "whatsnew",
    icon: Megaphone01Icon,
    to: "/whats-new",
    functions: [
      { id: "since", to: "/whats-new" },
      { id: "browse", to: "/whats-new" },
      { id: "look", to: "/whats-new" },
    ],
    faq: [q(40)],
  },
  {
    id: "general",
    icon: InformationCircleIcon,
    functions: [
      { id: "install" },
      { id: "session" },
      { id: "language", to: "/profile?tab=preferences" },
      { id: "data", to: "/profile?tab=storage" },
      { id: "sidebar" },
    ],
    faq: [q(7), q(41), q(15), q(8, "/profile?tab=preferences")],
  },
  {
    id: "security",
    icon: SecurityCheckIcon,
    to: "/security",
    functions: [
      { id: "person", to: "/security?tab=users" },
      { id: "add", to: "/security?tab=users" },
      { id: "bulk", to: "/security?tab=users" },
      { id: "requests", to: "/security?tab=requests" },
      { id: "apps", to: "/security?tab=apps" },
      { id: "system", to: "/security?tab=app" },
    ],
    faq: [q(42, "/security?tab=users"), q(43, "/security?tab=app")],
  },
  {
    id: "catalog",
    icon: Settings01Icon,
    to: "/profile?tab=catalog",
    gate: "adminGroup",
    functions: [
      { id: "edit", to: "/profile?tab=catalog" },
      { id: "add", to: "/profile?tab=catalog" },
      { id: "order", to: "/profile?tab=catalog" },
      { id: "delete", to: "/profile?tab=catalog" },
    ],
    faq: [q(44)],
  },
  {
    id: "widgets",
    icon: LayoutGridIcon,
    to: "/widgets",
    functions: [
      { id: "edit", to: "/widgets" },
      { id: "add", to: "/widgets" },
      { id: "stack", to: "/widgets" },
      { id: "radio", to: "/widgets" },
    ],
    faq: [q(45)],
  },
]
