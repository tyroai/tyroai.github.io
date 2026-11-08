import Target02Icon from "@hugeicons/core-free-icons/Target02Icon"
import { TRAY_LIVE, TRAY_PANEL, TRAY_TILE, WIDGET_ICON } from "@/features/widgets/widgetIcons"

// Header'a özgü ikonlar: Ufukta tepside oklu hedef tahtası, yanında hedefe kalan süre ("3g") —
// kartın kendi başlığında kilometre taşı. (Odak penceresinin ikonu oksuz hedef: karışmaz.)
const TRAY_ONLY = { horizon: Target02Icon }

/** Header'daki ikon (tepsi, toplu tepsinin sekmeleri, düzenleme paneli); yoksa kartın ikonu. */
export const trayIcon = (id) => TRAY_ONLY[id] ?? WIDGET_ICON[id]

/** Tepside canlı yüzü olan widget'ların yükleyicileri (`faces/LiveCapsule`). */
export { TRAY_LIVE }

/** Header'da kart yerine kendi penceresi olanların yükleyicileri (`trayParts` › `WidgetPanel`). */
export { TRAY_PANEL }

/** Denetim Merkezi'nde kendi kutucuk yüzü olanların yükleyicileri (`control/tiles/RadioTile`). */
export { TRAY_TILE }
