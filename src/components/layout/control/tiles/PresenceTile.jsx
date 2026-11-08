import { HugeiconsIcon } from "@hugeicons/react"
import UserStatusIcon from "@hugeicons/core-free-icons/UserStatusIcon"
import { useLocale } from "@/hooks/useLocale"
import { presenceLabelKey, presenceTone } from "../presenceModel"
import { usePresence } from "../usePresence"
import { TileShell } from "./TileShell"

/**
 * Teams durumu: simgenin köşesinde durumun rengi, altında durum ("Müsait", "Toplantıda meşgul" …);
 * izin yoksa "Bağlan". Dokununca seçenekler panelin içinde (`PresenceDetail`).
 */
export function PresenceTile({ onOpen, ...shell }) {
  const { t } = useLocale()
  const p = usePresence()
  const sub =
    p.status === "ready"
      ? t(presenceLabelKey(p.availability))
      : p.status === "consent"
        ? t("control.presence.connect")
        : p.status === "error"
          ? t("control.presence.unknown")
          : null
  return (
    <TileShell id="tool:presence" {...shell}>
      <button type="button" className="cc-hit" onClick={() => onOpen("tool:presence")}>
        <span
          className="cc-ic cc-presence"
          data-tone={p.status === "ready" ? presenceTone(p.availability) : undefined}
        >
          <HugeiconsIcon icon={UserStatusIcon} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="cc-text">
          <span className="cc-label">{t("control.presence.title")}</span>
          {sub && <span className="cc-sub">{sub}</span>}
        </span>
      </button>
    </TileShell>
  )
}
