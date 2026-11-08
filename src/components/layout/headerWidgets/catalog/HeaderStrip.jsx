import { cn } from "@/lib/utils"
import { TrayIcon } from "../trayParts"

/**
 * Header'ın küçük kopyası: arama yeri, widget'ın kapsülü (gerçek verinle, seçilen görünüm ve
 * yüzle) ve profil. Önizleme, süs: adı kartın düğmesinde.
 */
export function HeaderStrip({ id, chip, face, large = false }) {
  return (
    <span aria-hidden="true" className={cn("hc-strip", large && "hc-strip-large")}>
      <span className="hc-strip-search" />
      <TrayIcon
        as="span"
        id={id}
        title=""
        chip={chip}
        face={face}
        className="pointer-events-none"
      />
      {large && <span className="hc-strip-avatar" />}
    </span>
  )
}
