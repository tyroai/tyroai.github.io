import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"

// Kutunun çevresinde yuvarlak köşeli halka; tepenin ortasından saat yönünde dolar.
const RING =
  "M30 1.5H39.5A19 19 0 0 1 58.5 20.5V39.5A19 19 0 0 1 39.5 58.5H20.5A19 19 0 0 1 1.5 39.5V20.5A19 19 0 0 1 20.5 1.5Z"

/**
 * Pencere başlığının ikon kutusu ve çevresinde doluluk halkası: zorunlu alanlar doldukça marka
 * tonunda dolar, hepsi dolunca yeşile döner ve köşede ✓ belirir. Kutu 48 px kalır, halka dışına
 * taşar (başlığın düzeni değişmez). Süs: kalan alanları alt şerit yazıyla söylüyor.
 */
export function ProgressTile({ icon, progress }) {
  const reduced = useReducedMotion()
  const total = progress?.total ?? 0
  const ratio = total ? Math.min(1, progress.done / total) : 0
  const complete = total > 0 && progress.done >= total
  return (
    <span className="relative grid size-12 shrink-0 place-items-center">
      {total > 0 && (
        <svg
          aria-hidden="true"
          viewBox="0 0 60 60"
          className="pointer-events-none absolute -inset-1.5 size-[calc(100%+0.75rem)]"
        >
          <path d={RING} fill="none" strokeWidth="2.5" className="stroke-foreground/[0.12]" />
          <motion.path
            d={RING}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1 1"
            initial={false}
            animate={{ strokeDashoffset: 1 - ratio }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
            className={cn(
              "transition-[stroke] duration-300",
              complete ? "stroke-success" : "stroke-brand",
              ratio === 0 && "opacity-0",
            )}
          />
        </svg>
      )}
      <span className="grid size-12 place-items-center rounded-[0.9rem] bg-brand-fill-deep text-brand-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_14px_-6px_rgb(0_0_0/0.35)]">
        <HugeiconsIcon
          icon={icon}
          aria-hidden="true"
          className="size-[1.375rem]"
          strokeWidth={1.8}
        />
      </span>
      <StatusBadge
        state={complete ? "done" : null}
        className="-bottom-1.5 -end-1.5 size-5 ring-background"
      />
    </span>
  )
}
