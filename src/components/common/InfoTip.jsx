import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Uzun açıklama yerine küçük "i" düğmesi: metin üstüne gelince (ya da odakta) balonda. Dokunmatikte
 * üstüne gelme yok: dokunuş açar/kapar, dışarı dokunuş kapatır. Fareyle tık açık tutar.
 * `contentClassName`: balonun sınıfı (ör. üst katmandaki bir pencerenin üstünde kalsın diye z).
 */
export function InfoTip({ text, label, className, contentClassName }) {
  const [open, setOpen] = useState(false)
  // Dokunuşta odak balonu tıktan önce açar: aç/kapa dokunuştan önceki duruma göre.
  const was = useRef(false)
  if (!text) return null
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-info-tip=""
          onPointerDown={() => (was.current = open)}
          onClick={(e) => {
            // Radix tıkta balonu kapatır; dokunuşta aç/kapa, fare ve klavyede açık kalsın.
            e.preventDefault()
            setOpen(e.nativeEvent.pointerType === "touch" ? !was.current : true)
          }}
          aria-label={label || text}
          className={cn(
            "inline-grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground/80 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            className,
          )}
        >
          <HugeiconsIcon
            icon={InformationCircleIcon}
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.9}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn("max-w-64 text-[0.75rem] leading-snug", contentClassName)}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
