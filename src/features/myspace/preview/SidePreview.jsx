import { useCallback, useEffect, useRef, useState } from "react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { roomiestSide } from "@/lib/placement"
import { cn } from "@/lib/utils"
import { PreviewContent } from "./PreviewContent"
import { PREVIEW_KIND, previewLabel } from "./previewKinds"

/**
 * Özetin ipucundaki bir satırın önizlemesi (toplantı · posta · Keşfet
 * bildirimi · görev): masaüstünde satıra basınca ya da farede satırın üstünde kısa bir an durunca
 * (`hover`, satırın `li`sine verilir) kart İPUCUNUN YANINDA açılır
 * — sağda; sığmazsa solda, o da olmazsa en geniş boşlukta (`lib/placement`),
 * o satırın hizasında. Fare çekilince kapanmaz (karta geçilebilsin); başka satırda durunca o açılır. İç içe açılır kutu güvenli: kart React ağacında ipucunun
 * içinde, ona geçen imleç ya da tıklama ipucunu kapatmaz. Telefonda yanda yer
 * yok: çağıran satırın düğmesine kendi `onClick`ini verir (pencere açar).
 *
 * `children(wrap, hover)`: satırı (çapa) çizer; `wrap(button)` düğmeyi tetik yapar.
 * Kartın kenarı ipucunun kenarından 16 px içeride: 28 px ile 12 px dışarıda.
 */
// Satırın üstünden geçip giden fare açmasın: bu kadar durunca açılır.
const DWELL_MS = 320

/** Farede satırın üstünde durunca `fire(row)`: satırın `li`sine verilen iki olay. */
function useDwell(fire) {
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const onPointerEnter = useCallback(
    (e) => {
      if (e.pointerType !== "mouse") return
      const row = e.currentTarget
      clearTimeout(timer.current)
      timer.current = setTimeout(() => row.isConnected && fire(row), DWELL_MS)
    },
    [fire],
  )
  const onPointerLeave = useCallback(() => clearTimeout(timer.current), [])
  return { onPointerEnter, onPointerLeave }
}

export function SidePreview({ kind, item, open, onOpenChange, mobile, children }) {
  const conf = PREVIEW_KIND[kind]
  const [placed, setPlaced] = useState("right")
  const side = placed === "left" || placed === "right"
  const place = (row) =>
    setPlaced(roomiestSide(row.getBoundingClientRect(), conf.size, ["right", "left"]))
  // Durarak açılan kart kapanırken odağı satıra geri çekmez: öbür satırda açılan kartı kapatırdı.
  const byHover = useRef(false)
  const { onPointerEnter, onPointerLeave } = useDwell((row) => {
    if (open) return
    byHover.current = true
    place(row)
    onOpenChange(true)
  })
  const hover = mobile ? null : { onPointerEnter, onPointerLeave }
  const wrap = (button) =>
    mobile ? (
      button
    ) : (
      <PopoverTrigger
        asChild
        onClick={(e) => {
          byHover.current = false
          place(e.currentTarget.closest("li") ?? e.currentTarget)
        }}
      >
        {button}
      </PopoverTrigger>
    )
  return (
    <Popover open={!mobile && open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children(wrap, hover)}</PopoverAnchor>
      {!mobile && (
        <PopoverContent
          side={placed}
          align={side ? "start" : "center"}
          sideOffset={side ? 28 : 8}
          collisionPadding={12}
          aria-label={previewLabel(kind, item)}
          // Fareyle açılınca odak satırda kalır; klavyeyle açılınca karta geçer.
          onOpenAutoFocus={(e) => {
            if (!document.activeElement?.matches?.(":focus-visible")) e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            if (byHover.current) e.preventDefault()
          }}
          className={cn(
            "max-h-[var(--radix-popover-content-available-height)] gap-0 overscroll-contain p-0 [scrollbar-gutter:auto]!",
            conf.className,
          )}
        >
          <PreviewContent kind={kind} item={item} onDone={() => onOpenChange(false)} />
        </PopoverContent>
      )}
    </Popover>
  )
}
