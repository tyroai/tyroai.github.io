import ArrowDown02Icon from "@hugeicons/core-free-icons/ArrowDown02Icon"
import ExclamationMarkIcon from "@hugeicons/core-free-icons/ExclamationMarkIcon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import PinIcon from "@hugeicons/core-free-icons/PinIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"

/**
 * Outlook işaretlerinin ortak görünüşü: kartın ikon rozeti, Özelleştir satırları ve sağ ray aynı
 * ikonu ve tonu okur. Üç işaret üç ayrı durum tonu: sabit marka, bayrak tehlike, yüksek önem uyarı.
 * Bileşen değil (React Refresh sınırı: bileşen dosyasından sabit ihraç edilmez).
 */
export const MARK_LOOK = {
  pinned: { icon: PinIcon, tone: "bg-brand/10 text-brand-ink" },
  flagged: { icon: Flag02Icon, tone: "bg-danger/12 text-danger-ink" },
  complete: { icon: Tick02Icon, tone: "bg-success/12 text-success-ink" },
  high: { icon: ExclamationMarkIcon, tone: "bg-warning/12 text-warning-ink" },
  low: { icon: ArrowDown02Icon, tone: "bg-muted text-muted-foreground" },
}
