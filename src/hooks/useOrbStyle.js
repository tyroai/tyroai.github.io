import { useSyncExternalStore } from "react"
import {
  DEFAULT_MASCOT_SETTINGS,
  ORB_STYLE,
  readMascotSettings,
  subscribeMascotSettings,
} from "@/lib/orbStyle"

/**
 * Orb görünümünün kimliği. Seçim kaldırıldı: herkeste `mascot` (`lib/orbStyle`). Ad ve imza
 * aynı kaldı ki görünüme göre ölçü seçen çağrı yerleri değişmesin.
 */
export const useOrbStyle = () => ORB_STYLE

/**
 * Maskotun kayıtlı görünüş ayarları.
 *
 * ⚠️ Okuyucu AYNI nesneyi döndürmek zorunda (ham dize değişmedikçe) —
 * `readMascotSettings` bunu önbellekle garanti ediyor; her çağrıda taze bir
 * `JSON.parse` döndürseydi `useSyncExternalStore` sonsuz render'a girerdi.
 */
export function useMascotSettings() {
  return useSyncExternalStore(
    subscribeMascotSettings,
    readMascotSettings,
    () => DEFAULT_MASCOT_SETTINGS,
  )
}
