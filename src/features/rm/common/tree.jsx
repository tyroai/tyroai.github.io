import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { TONES } from "@/features/selfservice/request/field/tones"
import { cn } from "@/lib/utils"

// Ekip tonları sırayla: aynı ekip her sayfada aynı renkte (sıra planın ekip sırası).
const TONE_KEYS = ["brand", "sky", "violet", "teal", "blue", "pink", "fuchsia", "indigo", "slate"]

/** Ekip işareti: adın baş harfleri, ekibin sırasına göre sabit ton. */
export function TeamMark({ name, index = 0, className }) {
  // Kısa ad (FI, AI, SCM) olduğu gibi; uzun adda kelimelerin baş harfleri ya da ilk iki harf.
  const words = String(name || "?")
    .split(/[\s/]+/)
    .filter(Boolean)
  const raw =
    String(name).length <= 3
      ? String(name)
      : words.length > 1
        ? words.map((w) => w[0]).join("")
        : String(name).slice(0, 2)
  const initials = raw.slice(0, 3).toLocaleUpperCase("tr-TR")
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[0.625rem] text-[0.6875rem] font-bold tracking-tight",
        TONES[TONE_KEYS[index % TONE_KEYS.length]],
        className,
      )}
    >
      {initials}
    </span>
  )
}

/** Grubu aç/kapa oku. */
export function GroupToggle({ open, onClick, label, controls }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      className="relative grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2"
    >
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className={cn(
          "size-4 transition-transform duration-200 rtl:rotate-180",
          open && "rotate-90 rtl:rotate-90",
        )}
        strokeWidth={2}
      />
    </button>
  )
}

/**
 * Üye satırının ağaç çizgisi: dikey hat ve kişiye uzanan kısa kol (son üyede hat kolda biter).
 * `at`: kolun yüksekliği (ör. "1.75rem"); çok satırlı blokta kol ilk satırın hizasında kalır.
 */
export function TreeLine({ last, at }) {
  return (
    <span aria-hidden="true" className="relative w-4 shrink-0 self-stretch">
      <span
        className={cn("absolute start-0 top-0 w-px bg-border", !last ? "h-full" : !at && "h-1/2")}
        style={last && at ? { height: at } : undefined}
      />
      <span
        className={cn("absolute start-0 h-px w-3 bg-border", !at && "top-1/2")}
        style={at ? { top: at } : undefined}
      />
    </span>
  )
}

/** Tablonun tek ipucu balonu (`useCellTip`). */
export function CellTip({ tip }) {
  if (!tip) return null
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[70] max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg motion-safe:animate-in motion-safe:fade-in-0"
      style={{ left: tip.x, top: tip.y - 6 }}
    >
      <p className="font-semibold">{tip.title}</p>
      {tip.sub ? <p className="mt-0.5 opacity-80">{tip.sub}</p> : null}
    </div>,
    document.body,
  )
}
