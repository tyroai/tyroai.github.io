import { cn } from "@/lib/utils"

/**
 * Işık kutusunun alt yazısı: ad · boyut · "2 / 5". Karanlık örtünün üstünde, iki temada da aynı
 * (beyaz yazı, yarı saydam siyah hap).
 */
export function LightboxCaption({ view, many, className }) {
  return (
    <figcaption
      className={cn(
        "flex max-w-full items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 text-[0.78125rem] text-white/90 backdrop-blur-sm",
        className,
      )}
    >
      <span className="min-w-0 truncate font-medium">{view.item.name}</span>
      {view.item.meta && (
        <>
          <Dot />
          <span className="shrink-0 tabular-nums text-white/70">{view.item.meta}</span>
        </>
      )}
      {many && (
        <>
          <Dot />
          <span className="shrink-0 tabular-nums text-white/70">
            {view.index + 1} / {view.total}
          </span>
        </>
      )}
    </figcaption>
  )
}

function Dot() {
  return (
    <span aria-hidden className="text-white/35">
      ·
    </span>
  )
}
