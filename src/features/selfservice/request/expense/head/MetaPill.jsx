import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { IconTile } from "../../field/IconTile"
import { StatusBadge } from "../../field/StatusBadge"
import { PILL } from "./headUi"
import "../../field/fieldTile.css"

// Başlıktaki hap: alan karosunun küçüğü (aynı çerçeve, üstünde, odak ve açık hâlleri).
export const PILL_BOX =
  "req-tile relative inline-flex h-9 min-w-0 max-w-full items-center gap-2 rounded-full ps-1 pe-3 text-start outline-none [-webkit-tap-highlight-color:transparent] pointer-coarse:h-11"
export const PILL_VALUE =
  "min-w-0 truncate text-[0.8125rem] font-semibold leading-5 tracking-[-0.005em] text-foreground"

/** Hapın ikon kutusu: yuvarlak, marka tonu; köşede küçük ✓ (değer hep dolu). */
export function PillIcon({ icon, swap }) {
  return (
    <span className="relative shrink-0">
      <IconTile icon={icon} swap={swap} size="sm" className="rounded-full" />
      <StatusBadge state="done" className="-bottom-0.5 -end-0.5 size-3.5 [&_svg]:size-2" />
    </span>
  )
}

/**
 * Alanın adı fareyle üstüne gelince balonda ("Kimin adına"); odakta açılmaz — liste kapanıp odak
 * hapa dönünce balon belirmesin. Ekran okuyucu adı hapın erişilebilir adından alır.
 */
export function NameTip({ name, children }) {
  const [open, setOpen] = useState(false)
  const hover = useRef(false)
  return (
    <Tooltip open={open} onOpenChange={(o) => setOpen(o && hover.current)}>
      <TooltipTrigger
        asChild
        onPointerEnter={(e) => (hover.current = e.pointerType === "mouse")}
        onPointerLeave={() => {
          hover.current = false
          setOpen(false)
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="text-[0.75rem]">
        {name}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Seçici hap (kimin adına · şirket): ikon, değer (yanında soluk ek: şirketin unvanı), ok. Başka
 * bileşenin tetiği (`HeadPicker` → Radix `asChild`): `ref` ve kalan özellikler düğmeye geçer.
 * Erişilebilir ad etiket + değer (`${id}-label` görünmez, `${id}-value`). `pill`: "Başkası adına".
 */
export function MetaPill({
  id,
  icon,
  swap,
  label,
  value,
  sub,
  pill,
  open,
  className,
  ref,
  ...rest
}) {
  return (
    <NameTip name={label}>
      <button
        ref={ref}
        id={id}
        type="button"
        data-open={open || undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={pill ? `${id}-pill` : undefined}
        className={cn(PILL_BOX, className)}
        {...rest}
      >
        <PillIcon icon={icon} swap={swap} />
        <span id={`${id}-label`} className="sr-only">
          {label}
        </span>
        {pill && (
          <span id={`${id}-pill`} className={PILL}>
            {pill}
          </span>
        )}
        <span id={`${id}-value`} className={PILL_VALUE}>
          {value}
          {sub && <span className="font-normal text-muted-foreground"> · {sub}</span>}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            "-me-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
    </NameTip>
  )
}
