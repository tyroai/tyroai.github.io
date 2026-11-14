import AirplaneTakeOff01Icon from "@hugeicons/core-free-icons/AirplaneTakeOff01Icon"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import News01Icon from "@hugeicons/core-free-icons/News01Icon"
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon"
import MoneyExchange02Icon from "@hugeicons/core-free-icons/MoneyExchange02Icon"
import TranslationIcon from "@hugeicons/core-free-icons/TranslationIcon"
import CloudLittleRainIcon from "@hugeicons/core-free-icons/CloudLittleRainIcon"
import FileSearchIcon from "@hugeicons/core-free-icons/FileSearchIcon"
import Pulse01Icon from "@hugeicons/core-free-icons/Pulse01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import ChartColumnIcon from "@hugeicons/core-free-icons/ChartColumnIcon"
import ChartRingIcon from "@hugeicons/core-free-icons/ChartRingIcon"
import ChartLineData02Icon from "@hugeicons/core-free-icons/ChartLineData02Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import ClipboardClockIcon from "@hugeicons/core-free-icons/ClipboardClockIcon"
import Idea01Icon from "@hugeicons/core-free-icons/Idea01Icon"
import InboxUnreadIcon from "@hugeicons/core-free-icons/InboxUnreadIcon"
import KanbanIcon from "@hugeicons/core-free-icons/KanbanIcon"
import Message01Icon from "@hugeicons/core-free-icons/Message01Icon"
import Radio02Icon from "@hugeicons/core-free-icons/Radio02Icon"
import CdIcon from "@hugeicons/core-free-icons/CdIcon"
import DiscAlbumIcon from "@hugeicons/core-free-icons/DiscAlbumIcon"
import CheckmarkBadge03Icon from "@hugeicons/core-free-icons/CheckmarkBadge03Icon"
import SunglassesIcon from "@hugeicons/core-free-icons/SunglassesIcon"
import SunCloud02Icon from "@hugeicons/core-free-icons/SunCloud02Icon"
import MilestoneIcon from "@hugeicons/core-free-icons/MilestoneIcon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import StickyNote02Icon from "@hugeicons/core-free-icons/StickyNote02Icon"
import Target03Icon from "@hugeicons/core-free-icons/Target03Icon"
import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import TicketStarIcon from "@hugeicons/core-free-icons/TicketStarIcon"
import Target02Icon from "@hugeicons/core-free-icons/Target02Icon"
import Timer02Icon from "@hugeicons/core-free-icons/Timer02Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"

/**
 * Widget'ların ikonu — header tepsisi ve header'ın ekleme menüsü (kartın kendi başlık ikonu
 * kartta). Katalogda değil: `layout.js` her sayfada hafif kalsın, ikonlar yalnız tepsiyle insin.
 */
export const WIDGET_ICON = {
  weather: SunCloud02Icon,
  "weather-plain": SunCloud02Icon,
  ask: Message01Icon,
  help: Idea01Icon,
  brief: CheckmarkBadge03Icon,
  "next-meeting": Calendar03Icon,
  rhythm: ChartColumnIcon,
  "pending-mail": InboxUnreadIcon,
  planner: KanbanIcon,
  "team-today": UserGroupIcon,
  market: ChartLineData02Icon,
  focus: CheckmarkCircle02Icon,
  outcomes: CheckListIcon,
  holiday: Beach02Icon,
  "report-day": News01Icon,
  trader: Exchange01Icon,
  "tyro-fx": MoneyExchange02Icon,
  "tyro-translate": TranslationIcon,
  "tyro-welcome": SunCloud02Icon,
  "region-weather": CloudLittleRainIcon,
  "saved-search": FileSearchIcon,
  onenote: NotebookTabsIcon,
  sticky: StickyNote02Icon,
  "rm-pulse": Pulse01Icon,
  "tibot-summary": TicketStarIcon,
  "tibot-rhythm": ChartColumnIcon,
  "tibot-intro": ChartRingIcon,
  "tibot-rings": Target02Icon,
  "leave-balance": SunglassesIcon,
  requests: ClipboardClockIcon,
  travel: AirplaneTakeOff01Icon,
  "focus-window": Target03Icon,
  radio: Radio02Icon,
  "tyro-radio-stage": DiscAlbumIcon,
  "tyro-radio-disc": CdIcon,
  "world-clock": TimeZoneIcon,
  "focus-timer": Timer02Icon,
  horizon: MilestoneIcon,
}

/**
 * Tepside canlı yüzü olan widget'lar (radyonun kapsülü gibi): yüzün parçası yalnız header'da
 * istenince iner (`headerWidgets/faces/LiveCapsule`). Bileşen değil yükleyici: dosya hafif kalır.
 */
// Header'da kendi penceresi olan widget'lar (kart yerine): Tyrofy'ın sahnesi.
export const TRAY_PANEL = {
  radio: () => import("./radio/stage/RadioStage"),
}

// Denetim Merkezi'nde kendi kutucuk yüzü olan widget'lar: Tyrofy'ın plaklı diski.
export const TRAY_TILE = {
  radio: () => import("./radio/disc/DiscTile"),
}

export const TRAY_LIVE = {
  sticky: () => import("./sticky/StickyTrayFace"),
  // Ticket: listeyi bir kez okur; halkanın sayı rozeti ve çentik göstergesi `tibotPeek`ten.
  "tibot-rings": () => import("./tibot/TibotTrayFace"),
}
