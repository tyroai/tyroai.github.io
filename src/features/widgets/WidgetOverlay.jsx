import { Suspense, cloneElement } from "react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const FALLBACK = (
  <div aria-hidden="true" className="space-y-2 p-4">
    <span className="ms-skeleton block h-4 w-32 rounded-full" />
    <span className="ms-skeleton block h-9 rounded-xl" />
    <span className="ms-skeleton block h-9 rounded-xl" />
  </div>
)

/**
 * Widget'ların açılır yüzeyi (Ufukta, Seyahatim): masaüstünde ve tablette tetiğin yanında pencere,
 * telefonda alttan çekmece. İçerik tembel yüklenir (ilk açılışta), o sırada iskelet. `heading`: pencerede başlık
 * satırı (çekmecenin başlığı zaten var); ayrıntı kendi başlığını çizer.
 */
export function WidgetOverlay({
  trigger,
  title,
  heading = true,
  open,
  onOpenChange,
  align = "end",
  className,
  children,
}) {
  const mobile = useIsMobile()
  const body = <Suspense fallback={FALLBACK}>{open ? children : null}</Suspense>
  if (mobile) {
    return (
      <>
        {cloneElement(trigger, {
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          onClick: () => onOpenChange(!open),
        })}
        <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
          {body}
        </BottomSheet>
      </>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        collisionPadding={12}
        aria-label={title}
        className={cn("w-[min(21rem,calc(100vw-1.5rem))] gap-0 p-0", className)}
      >
        {heading && <p className="px-4 pt-3.5 text-[0.875rem] font-semibold">{title}</p>}
        {body}
      </PopoverContent>
    </Popover>
  )
}
