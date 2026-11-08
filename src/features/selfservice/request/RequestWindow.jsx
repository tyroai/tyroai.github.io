import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { keepEscape } from "./formUi"
import { requestFrame } from "./expense/requestFrame"
import { RequestHeader } from "./RequestChrome"
import { ShortcutHelp } from "./ShortcutHelp"

/**
 * Talep formunun masaüstü penceresi: başlık (klavye kısayolları düğmesi, geniş masrafta tam ekran,
 * kapat), kayan gövde, yapışık alt şerit. Boy ve en `expense/requestFrame` (ilk boyla ortalanır,
 * üstten sabit; masrafta baştan geniş), doğal boy `useFitHeight` (`fitRef` gövdeye). Formun genel
 * tuşları ("?", Ctrl/⌘+Enter) pencerenin kendisinde (`keys`). `extra`: pencerenin içinde
 * çizilen onay penceresi. `tool`: başlığın düğmelerinin başında ek düğme ("Anlat").
 */
export function RequestWindow({
  open,
  onOpenChange,
  kind,
  frame,
  header,
  keys,
  review,
  fitRef,
  table,
  keepOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  footer,
  extra,
  tool = null,
  children,
}) {
  const box = requestFrame(frame)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={keepEscape}
        onPointerDownOutside={keepOutside}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        onKeyDown={keys.onKeyDown}
        className={box.className}
        style={box.style}
      >
        <RequestHeader
          {...header}
          tools={
            <>
              {tool}
              <ShortcutHelp
                kind={kind}
                review={review}
                open={keys.help}
                onOpenChange={keys.setHelp}
              />
            </>
          }
        />
        <div
          ref={fitRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 shorter:pt-4",
            table ? "pb-5 pt-5 shorter:pb-4" : "pb-6 pt-5 shorter:pb-4",
          )}
        >
          {children}
        </div>
        <div className="shrink-0 border-t border-black/[0.06] bg-background px-6 py-4 shorter:py-3 dark:border-white/[0.08]">
          {footer}
        </div>
        {/* Silme onayı pencerenin içinde: iç içe pencerelerin odağı karışmasın. */}
        {extra}
      </DialogContent>
    </Dialog>
  )
}
