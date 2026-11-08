import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { ORB_ROTATE_MS } from "@/features/myspace/lib/orbSuggest"
import { cn } from "@/lib/utils"
import "./orbNext.css"

/**
 * Küre kartının oku ("Başka öneri", `useOrbDeck`): sahne kartlarında üst satırın sonunda,
 * kutlama slaytında kartın sol alt köşesinde (`corner`). Kendiliğinden dönüşte çevresinde dolan
 * halka sıradakine kalan süreyi gösterir. Oka basıldıysa yeni slaytın oku takılınca odağı alır
 * (`deck.claimFocus`): yeni kart eskisi çekildikten sonra gelir. Sıra ve sayı adında
 * ("Başka öneri (2/5)"). Tek slaytta yok. Bulanık cam yok: camın içinde dolan halka her karede
 * bulanıklığı yeniden hesaplatırdı (docs/performance.md). `onCard`: beyaz kartın içinde marka
 * tonu. `slop`: dokunmatikte görünür boy 32 px kalır, dokunma alanı görünmez bir payla 44 px
 * (kartın üst satırı büyümesin).
 */
export function OrbNext({ deck, corner = false, onCard = false, slop = false }) {
  const { t } = useLocale()
  const ref = useRef(null)
  const n = deck.slides.length
  const { claimFocus } = deck
  useEffect(() => {
    if (claimFocus?.()) ref.current?.focus()
  }, [claimFocus])
  if (n < 2) return null
  const label = t("widgets.nudge.next", { i: deck.index + 1, n })
  return (
    <button
      ref={ref}
      type="button"
      data-orb-next=""
      data-tone={onCard ? "card" : undefined}
      onClick={deck.next}
      aria-label={label}
      title={label}
      // Köşe konumu satır içi (başlangıç CSS'ine yeni sınıf girmesin).
      style={{
        "--orb-rotate": `${ORB_ROTATE_MS}ms`,
        ...(corner ? { bottom: "0.75rem", insetInlineStart: "0.75rem" } : null),
      }}
      className={cn(
        "pointer-events-auto grid size-8 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2",
        slop ? "orb-hit" : "pointer-coarse:size-11",
        onCard
          ? "bg-brand/10 text-brand hover:bg-brand/15 focus-visible:ring-brand/50"
          : "bg-white/20 text-brand-on-ramp ring-1 ring-white/30 hover:bg-white/30 focus-visible:ring-white/70",
        corner ? "absolute z-20" : "relative",
      )}
    >
      {deck.auto && (
        <svg key={deck.index} aria-hidden="true" viewBox="0 0 36 36" className="orb-timer">
          <circle cx="18" cy="18" r="16" pathLength="100" />
        </svg>
      )}
      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2.2} />
    </button>
  )
}
