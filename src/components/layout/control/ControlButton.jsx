import { HugeiconsIcon } from "@hugeicons/react"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import { useLocale } from "@/hooks/useLocale"
import { useFocusMode } from "@/lib/focusMode"
import { usePresentMode } from "@/lib/presentMode"
import { cn } from "@/lib/utils"
import { ControlGlyph } from "./ControlGlyph"

// Header tepsisinin düğmesiyle aynı ölçü ve vurgu (`trayStyles` › TRAY_BTN; o dosya tembel
// parçada, ilk pakete girmesin diye sınıflar burada): 36 px, dokunmatikte görünmez payla 44 px,
// açıkken macOS'taki gibi vurgu kapsülü.
const BTN =
  "relative inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-xl px-1.5 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent pointer-coarse:after:absolute pointer-coarse:after:-inset-1"

/**
 * Denetim Merkezi'nin header düğmesi (çanın solunda). Odak ya da Sunum modu açıkken simgenin
 * solunda durumları — ay, kapalı göz — marka renginde durur (macOS'un menü çubuğundaki Odak
 * simgesi gibi); mod kapanınca kendiliğinden kalkar. Ad ekran okuyucuda durumla birlikte.
 */
export function ControlButton({ ref, className, live, ...rest }) {
  const { t } = useLocale()
  // Süre dolunca kayıt kendiliğinden kapanır (`lib/focusMode`): bitiş varsa mod açıktır.
  const focus = useFocusMode().until != null
  const present = usePresentMode()
  const label = [
    t("control.title"),
    focus && t("control.onFocus"),
    present && t("control.onPresent"),
  ]
    .filter(Boolean)
    .join(", ")
  return (
    <button ref={ref} type="button" data-tour="control" className={cn(BTN, className)} {...rest}>
      {/* Ad görünmez metin: canlı kapsülün yazısı da adın parçası olsun (aria-label onu ezerdi). */}
      <span className="sr-only">{label}</span>
      {live}
      {focus && (
        <HugeiconsIcon
          icon={Moon02Icon}
          strokeWidth={1.8}
          aria-hidden="true"
          className="size-4 text-brand"
        />
      )}
      {present && (
        <HugeiconsIcon
          icon={ViewOffSlashIcon}
          strokeWidth={1.8}
          aria-hidden="true"
          className="size-4 text-brand"
        />
      )}
      <ControlGlyph className="size-5" />
    </button>
  )
}
