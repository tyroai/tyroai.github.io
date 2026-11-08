import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { useLocale } from "@/hooks/useLocale"
import { KINDS } from "@/features/calendar/lib/items"
import { AnchoredPopover } from "./AnchoredPopover"
import { LayerChip } from "./LayerChips"

/**
 * Telefonda katman çipleri satırı yerine başlıkta tek simge düğmesi: alttan çekmecede bütün
 * katmanlar aç/kapa listesi (`LayerChip menu`). Kapalı katman varsa düğmede küçük nokta.
 */
export function LayersButton({ layers, status, details = {}, onToggle }) {
  const { t } = useLocale()
  const [at, setAt] = useState(null)
  const kinds = KINDS.filter((kind) => status[kind] !== "off")
  const off = kinds.some((kind) => layers[kind] === false)
  const label = t("calendar.page.layers")
  return (
    <>
      <ActionButton
        tone="plain"
        size="toolbar"
        iconOnly
        className="cal-layers-btn"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={Boolean(at)}
        data-off={off || undefined}
        data-tour="cal-layers"
        onClick={(e) => setAt(e.currentTarget)}
      >
        <HugeiconsIcon icon={Layers01Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
      </ActionButton>
      {at && (
        <AnchoredPopover
          anchor={at}
          title={label}
          className="cal-pop cal-pop-layers"
          align="end"
          onClose={() => setAt(null)}
        >
          <div className="cal-layer-menu" role="group" aria-label={label}>
            {kinds.map((kind) => (
              <LayerChip
                key={kind}
                kind={kind}
                menu
                layers={layers}
                status={status}
                details={details}
                onToggle={onToggle}
              />
            ))}
          </div>
        </AnchoredPopover>
      )}
    </>
  )
}
