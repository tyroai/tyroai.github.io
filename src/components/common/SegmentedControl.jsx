import { useEffect, useId, useRef } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useScrollFade } from "@/hooks/useScrollFade"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"
import { cn } from "@/lib/utils"

// Arc'ın "morph" yayı: paylaşılan vurgu hafif esneyerek yerine oturur.
const GLIDE = { type: "spring", visualDuration: 0.42, bounce: 0.16 }
const STILL = { duration: 0 }
const FADE = 20

/**
 * BÖLMELİ SEÇİM — birkaç kısa, hemen uygulanan seçenek (dönem yılları, Bilgilerim | Ekibim):
 * seçim vurgusu seçenekler arasında kayar. Arc'ın segmented-control bileşeninden uyarlandı
 * (uiarc.dev, MIT): yalnız seçili seçenek sekme durağı; oklar (sağdan sola dilde ters), Home ve
 * End seçimi taşır. Sığmazsa iz kendi içinde kayar, kenar yalnız devamı olan yanda solar;
 * seçili seçenek görünür alana kaydırılır. Düğmeler `aria-pressed` (`role="group"`).
 * Hareketi azalt tercihinde vurgu kaymaz, atlar.
 *
 * @param {{ value: any, label: string, icon?: object, accessory?: import("react").ReactNode, title?: string, tip?: { title?: string, body: string } }[]} p.options
 *   `tip`: üstüne gelince açıklama balonu (ör. ölçünün hesabı); `title` yerine, ikisi birlikte verilmez.
 * @param {any} p.value seçili değer (`null` da bir değer olabilir: "Tümü")
 * @param {(value: any) => void} p.onChange
 * @param {string} p.label grubun adı (ekran okuyucu)
 * @param {string} [p.iconFrom] ikonun göründüğü kap genişliği sınıfı (ör. "@[30rem]/ss:block")
 * @param {string} [p.itemClassName] seçeneklerin ek sınıfı (dar kapta daha sıkı dolgu)
 * @param {boolean} [p.fill] kabın tam enine yayılır, seçenekler eşit pay alır (telefonda)
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  iconFrom,
  itemClassName,
  fill = false,
  className,
}) {
  const id = useId()
  const reduce = useReducedMotion()
  const track = useRef(null)
  const refs = useRef([])
  const at = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  // Kenar solması yalnız devamı olan yanda (sağdan sola dilde yönler ters).
  useScrollFade(track, "x", FADE)

  // Seçili seçenek hep tam görünür (solmanın dışında). Yalnız iz kayar, sayfa değil.
  const first = useRef(true)
  useEffect(() => {
    const node = track.current
    const button = refs.current[at]
    const instant = first.current || reduce
    first.current = false
    if (!node || !button || node.scrollWidth <= node.clientWidth) return
    const box = node.getBoundingClientRect()
    const own = button.getBoundingClientRect()
    const delta =
      own.left - FADE < box.left
        ? own.left - FADE - box.left
        : own.right + FADE > box.right
          ? own.right + FADE - box.right
          : 0
    if (delta) node.scrollBy({ left: delta, behavior: instant ? "auto" : "smooth" })
  }, [at, reduce])

  const onKeyDown = (e) => {
    const next = rovingIndex(e.key, at, options.length, isRtl(e.currentTarget))
    if (next < 0) return
    e.preventDefault()
    if (next !== at) onChange(options[next].value)
    refs.current[next]?.focus({ preventScroll: true })
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex min-w-0 max-w-full shrink rounded-full bg-foreground/[0.06] p-0.5",
        fill && "flex w-full",
        className,
      )}
    >
      <LayoutGroup id={id}>
        <div
          ref={track}
          className={cn(
            "isolate flex min-w-0 gap-0.5 overflow-x-auto overscroll-x-contain rounded-full [mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)] [scrollbar-width:none] rtl:[mask-image:linear-gradient(to_left,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)] [&::-webkit-scrollbar]:hidden",
            fill && "flex-1",
          )}
        >
          {options.map((o, i) => {
            const on = i === at
            const button = (
              <button
                key={o.value ?? "all"}
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                aria-pressed={on}
                tabIndex={on ? 0 : -1}
                title={o.title}
                onClick={() => !on && onChange(o.value)}
                onKeyDown={onKeyDown}
                className={cn(
                  "relative inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:min-w-11",
                  // Koyu temada hap zemine yakın: seçili durumu yazı farkı da taşısın (≥ 3:1).
                  on
                    ? "text-foreground"
                    : "text-foreground/70 hover:text-foreground dark:text-foreground/50 dark:hover:text-foreground",
                  fill && "flex-1 shrink",
                  itemClassName,
                )}
              >
                {on && (
                  <motion.span
                    layoutId="segment"
                    aria-hidden="true"
                    transition={reduce ? STILL : GLIDE}
                    className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm ring-1 ring-foreground/[0.06] dark:bg-foreground/20 dark:shadow-none"
                  />
                )}
                {o.icon && (
                  <HugeiconsIcon
                    icon={o.icon}
                    aria-hidden="true"
                    className={cn("size-4 shrink-0", iconFrom && cn("hidden", iconFrom))}
                    strokeWidth={1.9}
                  />
                )}
                <span className="truncate">{o.label}</span>
                {o.accessory}
              </button>
            )
            if (!o.tip) return button
            return (
              <Tooltip key={o.value ?? "all"}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="max-w-[17rem] flex-col items-start gap-0 px-3 py-2.5"
                >
                  {o.tip.title ? (
                    <p className="text-[0.8125rem] font-semibold text-background">{o.tip.title}</p>
                  ) : null}
                  <p
                    className={cn(
                      "text-xs leading-relaxed text-background/80",
                      o.tip.title && "mt-1",
                    )}
                  >
                    {o.tip.body}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </LayoutGroup>
    </div>
  )
}
