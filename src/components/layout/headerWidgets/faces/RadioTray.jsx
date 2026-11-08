import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { useLocale } from "@/hooks/useLocale"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { stopRadio, toggleRadio } from "@/lib/radioPlayer"
import { cn } from "@/lib/utils"

// Kapsülün küçük düğmeleri: header'ın ikon ölçüsünde değil, kapsülün içinde (32 px; dokunmatikte
// görünmez payla 44 px).
const CTL =
  "relative grid size-8 shrink-0 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5"

/**
 * Tepsideki Tyrofy'ın mini oynatıcısı (macOS'un "Şimdi Çalıyor"u gibi): istasyon açıkken
 * kürenin yanında duraklat/çal ve kapat. Kapatınca yalnız küre kalır (widget'ı açar).
 */
export function RadioTrayControls() {
  const { t } = useLocale()
  const radio = useRadioPlayer()
  const st = radio.station
  if (!st) return null
  const playing = radio.status === "playing"
  const busy = radio.status === "loading"
  const toggle = t(playing || busy ? "widgets.radio.pauseNamed" : "widgets.radio.playNamed", {
    name: st.name,
  })
  return (
    <>
      <button
        type="button"
        onClick={() => toggleRadio()}
        aria-label={toggle}
        title={toggle}
        className={CTL}
      >
        <HugeiconsIcon
          icon={busy ? Loading03Icon : playing ? PauseIcon : PlayIcon}
          strokeWidth={2}
          aria-hidden="true"
          className={cn(
            "size-4",
            busy ? "animate-spin motion-reduce:animate-none" : "[&_path]:fill-current",
          )}
        />
      </button>
      <button
        type="button"
        onClick={() => stopRadio()}
        aria-label={t("widgets.radio.stop")}
        title={t("widgets.radio.stop")}
        className={cn(CTL, "text-muted-foreground")}
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="size-3.5"
        />
      </button>
    </>
  )
}
