import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const actionButton = cva(
  "action-button inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium outline-none transition-[background-color,color,transform] duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress motion-reduce:transition-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        // Marka dolgusu — sayfanın tek ana eylemi.
        prominent:
          "action-button--prominent bg-brand-fill-deep font-semibold text-brand-on-brand shadow-sm",
        // Gri kapsül (macOS "bordered") — ikincil eylemler.
        soft: "bg-muted text-foreground hover:bg-accent",
        // İnce çerçeve — kartın üstünde ya da renkli zeminde ikincil eylem.
        outline: "border border-border bg-card text-foreground hover:bg-accent/60",
        // Zeminsiz — üçüncül, ikon düğmeleri.
        plain: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      },
      size: {
        page: "h-control-lg px-4 text-body [&_svg]:size-icon",
        toolbar: "h-control px-3.5 text-callout [&_svg]:size-icon",
        inline: "h-control-sm px-3 text-footnote [&_svg]:size-icon",
      },
      iconOnly: {
        true: "aspect-square px-0",
        false: "",
      },
    },
    compoundVariants: [{ size: "page", iconOnly: true, className: "[&_svg]:size-icon-lg" }],
    defaultVariants: { tone: "soft", size: "toolbar", iconOnly: false },
  },
)

/** Aynı görünüm bağlantıya (`<a>`) da: dış adresi açan eylem (ör. "OneNote'ta aç"). */
export const actionButtonClass = (opts) => cn(actionButton(opts), opts?.className)
