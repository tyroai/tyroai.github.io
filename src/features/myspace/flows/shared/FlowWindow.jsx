import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import "./flow.css"

/** Akışın kabı: masaüstünde pencere, telefonda alt çekmece (kendi başlığı ve kapatması var). */
export function FlowWindow({ open, onOpenChange, title, onEscape, children }) {
  const phone = useIsMobile()
  if (phone)
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title={title} onEscapeKeyDown={onEscape}>
        {children}
      </BottomSheet>
    )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="af-window"
        onEscapeKeyDown={onEscape}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/** Üst sıranın kapatma düğmesi (yalnız pencerede; çekmecenin kendi kapatması var). */
export function FlowClose({ onClose }) {
  const { t } = useLocale()
  const phone = useIsMobile()
  if (phone) return null
  return (
    <button
      type="button"
      className="af-close"
      aria-label={t("advanceFlow.close")}
      onClick={onClose}
    >
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
