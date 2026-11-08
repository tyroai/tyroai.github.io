import { cn } from "@/lib/utils"

// Hap değil, noktalı sade yazı: zemin ve çerçeve yok; kümenin ikonu yerine renkli nokta.
const BASE =
  "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-[0.75rem] font-medium leading-4 transition hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 [&>svg:first-child]:hidden before:size-1.5 before:shrink-0 before:rounded-full before:bg-current pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3"

const TONE = {
  warning: "text-amber-800 focus-visible:ring-amber-500/40 dark:text-amber-300",
  info: "text-brand-ink focus-visible:ring-brand/40",
  neutral: "text-foreground/70 before:hidden focus-visible:ring-brand/40",
}

/**
 * Liste özetinin köşesindeki notların görünüşü (sekmenin uyarıları, tutarsız kayıt, "+n"): renkli
 * noktalı küçük yazı; dokunmatikte görünmez payla ≥ 44 px hedef. `warning` iş bekleyen (amber),
 * `info` hatırlatma (marka), `neutral` "+n" (noktasız).
 */
export const noteChip = (tone) => cn(BASE, TONE[tone] ?? TONE.neutral)
