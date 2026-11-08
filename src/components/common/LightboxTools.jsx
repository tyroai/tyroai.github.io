import { HugeiconsIcon } from "@hugeicons/react"
import RotateCcwSquareIcon from "@hugeicons/core-free-icons/RotateCcwSquareIcon"
import RotateCwSquareIcon from "@hugeicons/core-free-icons/RotateCwSquareIcon"
import ZoomInIcon from "@hugeicons/core-free-icons/ZoomInIcon"
import ZoomOutIcon from "@hugeicons/core-free-icons/ZoomOutIcon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"

// Kapat/önceki/sonraki düğmeleriyle aynı dil: siyah örtünün üstünde beyaz, temadan bağımsız.
const BUTTON =
  "grid shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70 disabled:pointer-events-none disabled:text-white/40"
// Dokunmatikte 44 px hedef.
const ICON = "size-9 pointer-coarse:size-11"
const PCT = "h-9 min-w-14 px-2 text-[0.75rem] font-medium tabular-nums pointer-coarse:h-11"

/**
 * Işık kutusunun alttaki araç hapı: döndür (sola · sağa) ve yakınlaştır (− · yüzde · +). Yüzde
 * düğmesi sığdırır. `rotate(±90)` yoksa döndürme, `zoom` yoksa yakınlaştırma çizilmez. Fiziksel
 * düzen (soldan sağa): döndürme simgeleri yön gösterir, Arapçada da yer değiştirmez.
 */
export function LightboxTools({ rotate, zoom, className }) {
  const { t, locale } = useLocale()
  const pct = getNumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
    zoom?.scale ?? 1,
  )
  return (
    <div
      role="group"
      aria-label={t("chat.attach.tools")}
      dir="ltr"
      className={cn(
        "flex items-center gap-0.5 rounded-full bg-black/60 p-1 ring-1 ring-white/15 backdrop-blur-sm",
        className,
      )}
    >
      {rotate && (
        <>
          <Tool
            label={t("chat.attach.rotateLeft")}
            keys="Shift+R"
            shortcut="Shift+R"
            icon={RotateCcwSquareIcon}
            onClick={() => rotate(-90)}
          />
          <Tool
            label={t("chat.attach.rotateRight")}
            keys="R"
            shortcut="R"
            icon={RotateCwSquareIcon}
            onClick={() => rotate(90)}
          />
        </>
      )}
      {rotate && zoom && <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />}
      {zoom && (
        <>
          <Tool
            label={t("chat.attach.zoomOut")}
            keys="−"
            icon={ZoomOutIcon}
            disabled={!zoom.canOut}
            onClick={zoom.zoomOut}
          />
          <button
            type="button"
            onClick={zoom.reset}
            disabled={!zoom.zoomed}
            aria-label={t("chat.attach.zoomFit", { pct })}
            aria-keyshortcuts="0"
            title={`${t("chat.attach.zoomFit", { pct })} (0)`}
            className={cn(BUTTON, PCT)}
          >
            {pct}
          </button>
          <Tool
            label={t("chat.attach.zoomIn")}
            keys="+"
            icon={ZoomInIcon}
            disabled={!zoom.canIn}
            onClick={zoom.zoomIn}
          />
        </>
      )}
    </div>
  )
}

function Tool({ label, keys, shortcut, icon, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      title={`${label} (${keys})`}
      className={cn(BUTTON, ICON)}
    >
      <HugeiconsIcon icon={icon} aria-hidden className="size-[1.125rem]" strokeWidth={1.8} />
    </button>
  )
}
