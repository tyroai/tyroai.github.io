import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { NextStepsList } from "./NextStepsList"

// Fare geçerken kart titreşmesin: kısa açılma gecikmesi; karta geçerken kapanmasın diye kapanma payı.
const OPEN_MS = 90
const CLOSE_MS = 160

/**
 * Alt şeridin "ⓘ Ne olacak?" düğmesi — gönderimden sonraki dört adım, bildirimlerle aynı koyu
 * cam kartta. Fareyle üstüne gelince açılır (karta geçince açık kalır); tık, dokunuş ve Enter/Boşluk
 * aç/kapa; Escape yalnız kartı kapatır (pencere açık kalır). Adımlar panellerde yer tutmasın diye
 * burada. Adımlar "Gönder"in yoluna göre (`via`: "chat" · "erp", `NextStepsList`).
 * `iconOnly` (telefonun alt şeridi): yalnız "ⓘ" simgesi, ad ekran okuyucuda; şerit yan yana üç
 * düğmeye (ⓘ · Anlat · birincil) yer açsın.
 */
export function NextStepsTip({ className, iconOnly = false, via = "chat" }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const later = (next, ms) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), ms)
  }
  // Yalnız fare: dokunuşta pointerenter ile click art arda gelir, kart açılıp hemen kapanırdı.
  const enter = (e) => e.pointerType === "mouse" && later(true, OPEN_MS)
  const leave = (e) => e.pointerType === "mouse" && later(false, CLOSE_MS)
  const title = t("selfService.form.next.title")

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        clearTimeout(timer.current)
        setOpen(o)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-info-tip=""
          data-tour="req-next"
          onPointerEnter={enter}
          onPointerLeave={leave}
          className={cn(
            "group inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.8125rem] font-medium text-foreground/75 transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground pointer-coarse:h-11",
            iconOnly && "w-11 justify-center gap-0 px-0",
            className,
          )}
        >
          <HugeiconsIcon
            icon={InformationCircleIcon}
            aria-hidden="true"
            className="size-4 shrink-0 text-brand-ink"
            strokeWidth={1.9}
          />
          {/* Noktalı alt çizgi: üstüne gelince açıklama açılır. */}
          <span
            className={cn(
              "underline decoration-foreground/30 decoration-dotted underline-offset-4 transition group-hover:decoration-foreground/60 group-data-[state=open]:decoration-foreground/60",
              iconOnly && "sr-only",
            )}
          >
            {title}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        collisionPadding={12}
        // Fareyle açılınca odak düğmede kalır (kart yalnız bilgi; içinde tıklanacak bir şey yok).
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerEnter={enter}
        onPointerLeave={leave}
        aria-label={title}
        className="w-[min(21rem,calc(100vw-2rem))] gap-0 bg-[oklch(0.19_0.02_250/0.94)] p-4 text-white ring-1 ring-white/10 shadow-[0_1px_0_0_rgb(255_255_255/0.10)_inset,0_24px_56px_-16px_rgb(0_0_0/0.55),0_8px_20px_-8px_rgb(0_0_0/0.4)] backdrop-blur-2xl backdrop-saturate-150"
      >
        <p className="text-[0.875rem] font-semibold">{title}</p>
        <NextStepsList className="mt-3" via={via} />
      </PopoverContent>
    </Popover>
  )
}
