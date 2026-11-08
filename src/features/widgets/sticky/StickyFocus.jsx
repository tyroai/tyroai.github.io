import { ActionButton } from "@/components/common/ActionButton"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { NOTE_MAX } from "./lib/stickyNotes"
import { ColorDots } from "./ColorDots"

/**
 * Rahat yazma: notun büyük hâli (yazma kartındaki "Büyük yaz"). Metin ve renk kartla ORTAK
 * (aynı durum): kapatınca yazılan kaybolmaz, kartta sürer. Masaüstünde ortada geniş pencere,
 * telefonda alttan çekmece. ⌘/Ctrl+Enter kaydeder; Escape yalnız pencereyi kapatır.
 */
export function StickyFocus({
  open,
  title,
  onOpenChange,
  text,
  onText,
  color,
  onColor,
  pickColor,
  onSave,
}) {
  const { t } = useLocale()
  const phone = useIsMobile()
  const can = text.trim().length > 0
  const area = (
    <div className="st-card st-focus" data-color={color}>
      <textarea
        dir="auto"
        data-private=""
        value={text}
        maxLength={NOTE_MAX}
        autoFocus
        // Var olan notta imleç sona (yazmaya devam).
        onFocus={(e) => {
          const end = e.target.value.length
          e.target.setSelectionRange(end, end)
        }}
        aria-label={t("widgets.sticky.textLabel")}
        placeholder={t("widgets.sticky.placeholder")}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && can) {
            e.preventDefault()
            onSave()
          }
        }}
        className="st-area st-focus-area no-ios-zoom"
      />
    </div>
  )
  const foot = (
    <div className="st-focus-foot">
      {pickColor ? <ColorDots value={color} onChange={onColor} /> : <span />}
      <span className="st-compose-actions">
        <span className="st-focus-count" aria-hidden="true">
          {text.length}/{NOTE_MAX}
        </span>
        <ActionButton tone="soft" size="inline" onClick={() => onOpenChange(false)}>
          {t("widgets.sticky.close")}
        </ActionButton>
        <ActionButton tone="prominent" size="inline" disabled={!can} onClick={onSave}>
          {t("widgets.sticky.save")}
        </ActionButton>
      </span>
    </div>
  )
  if (phone)
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title ?? t("widgets.sticky.focusTitle")}
        closeOnBack
        footer={foot}
      >
        {area}
      </BottomSheet>
    )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="st-focus-dialog gap-3">
        <DialogTitle data-private="" className="st-focus-title">
          {title ?? t("widgets.sticky.focusTitle")}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("widgets.sticky.focusHint")}</DialogDescription>
        {area}
        {foot}
      </DialogContent>
    </Dialog>
  )
}
