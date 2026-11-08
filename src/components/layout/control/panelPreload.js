import { TRAY_PANEL } from "../headerWidgets/trayIcon"

// Widget'ın penceresi (header'ın `WidgetPanel`ı ile aynı parçalar): Piyasa ve Tyrofy'ın
// kendi pencereleri, ötekilerde kartın gövdesi.
const OWN = { market: () => import("../headerWidgets/faces/MarketPanel"), ...TRAY_PANEL }
const asked = new Set()

/**
 * Kutucuğun üstüne gelince (ya da odaklanınca) penceresinin kodu önden iner: basınca ayrıntı
 * iskeletten içeriğe zıplamadan açılır.
 */
export function preloadPanel(id) {
  if (asked.has(id)) return
  asked.add(id)
  const load = OWN[id] ?? (() => import("../headerWidgets/HeaderWidgetBody"))
  load().catch(() => asked.delete(id))
}
