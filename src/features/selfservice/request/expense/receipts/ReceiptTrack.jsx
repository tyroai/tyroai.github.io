import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../../kinds"
import { ReceiptThumb } from "./ReceiptThumb"
import { useStripScroll } from "./useStripScroll"

const ARROW =
  "relative inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-0.5 rounded-full px-1.5 text-[0.75rem] font-semibold tabular-nums text-foreground/75 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-transparent pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 [&_svg]:size-4 rtl:[&_svg]:-scale-x-100"
// Kenarda sönme: o yönde daha fiş olduğunu sessizce söyler.
const FADE = {
  both: "[mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)]",
  start:
    "[mask-image:linear-gradient(to_right,transparent,black_1.25rem)] rtl:[mask-image:linear-gradient(to_left,transparent,black_1.25rem)]",
  end: "[mask-image:linear-gradient(to_right,black_calc(100%-1.25rem),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-1.25rem),transparent)]",
}

/**
 * Fiş şeridinin küçük resimleri: tek satır, yalnız sığanlar görünür; sığmayan varsa iki uçta ok
 * (‹ ›, uçta kapalı) ve ileri okun yanında kalan sayı ("+7"). Kaydırma sayfa sayfa, parmakla da
 * kayar (yakalama noktalı). Klavyeyle bir küçük resme gelince kendiliğinden görünür olur. Uçtaki
 * ok kapanınca odak düşmesin diye `disabled` değil `aria-disabled`. `thumb(fiş)`: küçük resmin
 * özellikleri (önizleme, kaldırma; `ReceiptThumb`).
 */
export function ReceiptTrack({ list, thumb, className }) {
  const { t, locale } = useLocale()
  const { ref, state: strip, measure, page } = useStripScroll(list.length)
  const fade =
    strip.prev && strip.next ? FADE.both : strip.prev ? FADE.start : strip.next ? FADE.end : null
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      {strip.overflow && (
        <button
          type="button"
          onClick={() => strip.prev && page(-1)}
          aria-disabled={!strip.prev}
          aria-label={t("selfService.expense.receipts.prev")}
          className={ARROW}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" strokeWidth={2} />
        </button>
      )}
      {/* Üstte 6 px pay: köşedeki kaldır düğmesi ve odak halkası kırpılmasın. */}
      <ul
        ref={ref}
        onScroll={measure}
        className={cn(
          "flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fade,
        )}
      >
        {list.map((f) => (
          <ReceiptThumb key={f.id} item={f} {...thumb(f)} />
        ))}
      </ul>
      {strip.overflow && (
        <button
          type="button"
          onClick={() => strip.next && page(1)}
          aria-disabled={!strip.next}
          // Sayı gelip gidince ok kaymasın (kaydırıcının eni değişip uç yeniden kaçmasın).
          style={{ minWidth: "3.25rem" }}
          aria-label={
            t("selfService.expense.receipts.next") +
            (strip.after > 0 ? ` (+${number(strip.after, locale)})` : "")
          }
          className={ARROW}
        >
          {strip.after > 0 && (
            <span aria-hidden="true" className="ps-0.5">
              +{number(strip.after, locale)}
            </span>
          )}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
