import "@/lib/i18n/settings"
import "@/lib/i18n/selfService"
import "@/lib/i18n/cmd"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import CopilotIcon from "@hugeicons/core-free-icons/CopilotIcon"
import DashboardCircleIcon from "@hugeicons/core-free-icons/DashboardCircleIcon"
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import LanguageCircleIcon from "@hugeicons/core-free-icons/LanguageCircleIcon"
import MapsLocation01Icon from "@hugeicons/core-free-icons/MapsLocation01Icon"
import Megaphone01Icon from "@hugeicons/core-free-icons/Megaphone01Icon"
import Moon01Icon from "@hugeicons/core-free-icons/Moon01Icon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import ToggleOnIcon from "@hugeicons/core-free-icons/ToggleOnIcon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import SidebarRightIcon from "@hugeicons/core-free-icons/SidebarRightIcon"
import DashboardSquareEditIcon from "@hugeicons/core-free-icons/DashboardSquareEditIcon"
import Notification03Icon from "@hugeicons/core-free-icons/Notification03Icon"
import PaintBoardIcon from "@hugeicons/core-free-icons/PaintBoardIcon"
import SecurityCheckIcon from "@hugeicons/core-free-icons/SecurityCheckIcon"
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon"
import TaskDone01Icon from "@hugeicons/core-free-icons/TaskDone01Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import UserAccountIcon from "@hugeicons/core-free-icons/UserAccountIcon"
import UserCircleIcon from "@hugeicons/core-free-icons/UserCircleIcon"
import UserMultiple02Icon from "@hugeicons/core-free-icons/UserMultiple02Icon"
import Wallet01Icon from "@hugeicons/core-free-icons/Wallet01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import MoneyExchange01Icon from "@hugeicons/core-free-icons/MoneyExchange01Icon"

/**
 * Aramanın sabit kataloğu — TEK kaynak (header'daki Ara… ve Ctrl/⌘+K aynı pencere).
 *
 * Sayfalar sidebar'ın sırasıyla; Anasayfa · Keşfet · To-Do kapılı, çizimde `canOpen` ile
 * filtrelenir (`lib/pageAccess.js` — sidebar ve rotayla AYNI karar): bulunup açılamayan bir sayfa
 * arama kutusunun yalan söylemesi olurdu. `keys`: sayfanın adında geçmeyen arama sözcükleri
 * (TR + EN; ekranda görünmez). `deep`: yalnız aranınca çıkan alt yerler (Bul › Kişiler gibi).
 */
export const PAGES = [
  {
    id: "myspace",
    path: "/myspace",
    labelKey: "nav.myspace",
    icon: DashboardSquare01Icon,
    keys: "anasayfa home pano widget",
  },
  {
    id: "selfservice",
    path: "/self-service",
    labelKey: "nav.selfService",
    icon: UserAccountIcon,
    keys: "izin masraf avans talep leave expense advance request",
  },
  {
    id: "tibot",
    path: "/tibot",
    labelKey: "nav.tibot",
    icon: Ticket01Icon,
    keys: "tibot xurrent bt destek talep ticket it support helpdesk",
  },
  {
    id: "feed",
    path: "/feed",
    labelKey: "nav.feed",
    icon: AiArtIcon,
    keys: "bildirim akış duyuru bul dosya notification feed find files",
  },
  {
    id: "calendar",
    path: "/calendar",
    labelKey: "nav.calendar",
    icon: Calendar03Icon,
    keys: "takvim toplantı izin tatil doğum günü calendar meeting leave holiday birthday",
  },
  {
    id: "todo",
    path: "/todo",
    labelKey: "nav.todo",
    icon: TaskDone01Icon,
    keys: "görev gorev task",
  },
  {
    id: "chat",
    path: "/chat",
    labelKey: "nav.chat",
    icon: AiChat02Icon,
    keys: "sohbet asistan tyro",
  },
  // Çözümler — profil menüsünde; aramada sidebar satırlarının hemen ardından.
  { id: "dashboard", path: "/dashboard", labelKey: "nav.dashboard", icon: DashboardCircleIcon },
  { id: "help", path: "/help", labelKey: "nav.help", icon: HelpCircleIcon, keys: "yardım sss faq" },
  // Sidebar'da yok (kişinin kendi hesabı işin yanına konmaz); aramada olmasaydı bulunamazdı.
  { id: "profile", path: "/profile", labelKey: "nav.profile", icon: UserCircleIcon },
  { id: "whats-new", path: "/whats-new", labelKey: "nav.whatsNew", icon: Megaphone01Icon },
]

/** Yalnız aranınca: bir sayfanın içindeki yer (etiket "Sayfa › Yer"). */
export const DEEP = [
  {
    id: "find-people",
    path: "/feed?sec=docs&fsrc=people",
    page: "feed",
    labelKey: "myfiles.source.people",
    parentKeys: ["nav.feed", "feed.section.docs"],
    icon: UserMultiple02Icon,
    keys: "rehber kişi people directory",
  },
  {
    id: "find-offices",
    path: "/feed?sec=docs&fsrc=offices",
    page: "feed",
    labelKey: "myfiles.source.offices",
    parentKeys: ["nav.feed", "feed.section.docs"],
    icon: MapsLocation01Icon,
    keys: "ofis adres tesis office address",
  },
  {
    id: "ss-leave",
    path: "/self-service?tab=leave",
    page: "selfservice",
    labelKey: "selfService.tab.leave",
    icon: Calendar03Icon,
    keys: "izin tatil leave",
  },
  {
    id: "ss-expense",
    path: "/self-service?tab=expense",
    page: "selfservice",
    labelKey: "selfService.tab.expense",
    icon: Wallet01Icon,
    keys: "masraf fiş expense receipt",
  },
  {
    id: "ss-advance",
    path: "/self-service?tab=advance",
    page: "selfservice",
    labelKey: "selfService.tab.advance",
    icon: MoneyExchange01Icon,
    keys: "avans iş avansı advance",
  },
  {
    id: "pr-appearance",
    path: "/profile?tab=preferences",
    page: "profile",
    labelKey: "profile.section.preferences",
    icon: PaintBoardIcon,
    keys: "görünüm tema mod renk palet appearance theme",
  },
  {
    id: "pr-notifications",
    path: "/profile?tab=notifications",
    page: "profile",
    labelKey: "settings.notify.sectionTitle",
    icon: Notification03Icon,
    keys: "bildirim notification",
  },
]

/* Yönetici kapısının arkasındaki iki sayfa — kapalıyken aramada da YOK. Güvenlik iki kapıdan
   BİRİYLE (Entra grubu ya da `tyro_isadmin`), katalog yalnız Entra grubuyla açılır. Ayarlar artık
   bir sayfa değil: doğrudan gerçek adrese gidilir (yönlendirmeye değil — geri tuşu bozulmasın). */
export const ADMIN_PAGES = [
  {
    id: "security",
    path: "/security",
    labelKey: "nav.security",
    icon: SecurityCheckIcon,
    gate: "app",
  },
  {
    id: "settings",
    path: "/profile?tab=catalog",
    labelKey: "nav.settings",
    icon: Settings01Icon,
    gate: "group",
  },
]

export const EXTERNAL = [
  {
    id: "copilot",
    href: "https://m365.cloud.microsoft/chat",
    labelKey: "nav.copilot",
    subtitleKey: "nav.copilotSubtitle",
    icon: CopilotIcon,
  },
]

/**
 * Hızlı eylemler: `run` adını Spotlight bağlar (yeni sohbet, mod, dil; Denetim Merkezi'nin
 * komutları `controlActions.js`).
 */
export const ACTIONS = [
  { id: "new-chat", labelKey: "nav.quickAction", icon: Add01Icon, keys: "sohbet chat yeni new" },
  {
    id: "control",
    labelKey: "cmd.actionControl",
    icon: ToggleOnIcon,
    keys: "denetim merkezi control center araç tools",
  },
  {
    id: "focus",
    labelKey: "cmd.actionFocus",
    icon: Moon02Icon,
    keys: "odak focus rahatsız etme bildirim sessiz",
  },
  {
    id: "present",
    labelKey: "cmd.actionPresent",
    icon: ViewOffSlashIcon,
    keys: "sunum ekran paylaş gizle present share privacy",
  },
  { id: "notch", labelKey: "cmd.actionNotch", icon: SidebarRightIcon, keys: "çentik ray notch" },
  {
    id: "home-edit",
    labelKey: "cmd.actionHomeEdit",
    icon: DashboardSquareEditIcon,
    keys: "anasayfa düzenle widget home edit",
  },
  {
    id: "theme",
    labelKey: "cmd.actionToggleTheme",
    icon: Moon01Icon,
    keys: "karanlık koyu açık dark light mod",
  },
  {
    id: "locale",
    labelKey: "cmd.actionToggleLocale",
    icon: LanguageCircleIcon,
    keys: "language english türkçe",
  },
]
