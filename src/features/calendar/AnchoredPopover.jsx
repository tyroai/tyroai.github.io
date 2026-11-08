import { useMemo } from "react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Bir öğeye (ya da tıklanan noktaya) bağlı yüzey: masaüstünde popover, telefonda alttan çekmece.
 * `anchor` bir düğme ya da `getBoundingClientRect` veren sanal nokta (boş saate basış). Tek
 * örnek, bütün bloklar paylaşır; kapanınca odak açan düğmeye döner. Çağıran yalnız açıkken
 * çizer (`anchor` boş olamaz). `align`: "end" sağ kenarı öğeye hizalar, yüzey sola doğru açılır.
 */
export function AnchoredPopover({
  anchor,
  onClose,
  title,
  label,
  className,
  align = "start",
  children,
}) {
  const mobile = useIsMobile()
  const virtualRef = useMemo(() => ({ current: anchor }), [anchor])
  if (mobile) {
    return (
      <BottomSheet open onOpenChange={(open) => !open && onClose()} title={title}>
        <div className="cal-sheet-body">{children}</div>
      </BottomSheet>
    )
  }
  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side="bottom"
        align={align}
        sideOffset={8}
        collisionPadding={12}
        aria-label={label ?? title}
        className={className}
        // Sohbet rıhtımı pencerede Escape dinliyor: yüzeyi kapatan Escape rıhtımı da kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          if (anchor?.isConnected) anchor.focus?.({ preventScroll: true })
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
