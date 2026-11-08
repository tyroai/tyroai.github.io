import { useId, useRef } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"
import { cn } from "@/lib/utils"

const GLIDE = { type: "spring", visualDuration: 0.36, bounce: 0.12 }
const STILL = { duration: 0 }

/**
 * Sade metin sekmeleri — altı çizili seçim, yanında küçük soluk sayı ("İzinler 7"). Kutu ve hap
 * yok; seçili sekmenin altındaki çizgi kayar (hareketi azalt tercihinde atlar). İki anlam:
 *
 * | `kind` | rol | kullanım |
 * |---|---|---|
 * | `tabs`  | `tablist` / `tab` (`aria-selected`, `aria-controls`) | kayıt sekmeleri |
 * | `group` | `group` / düğme (`aria-pressed`) | dönem, görünüm anahtarı |
 *
 * Yalnız seçili seçenek sekme durağı; oklar · Home · End seçimi değiştirir (sağdan sola dilde
 * ters). `rail`: altta ince ray (sekme şeridi), `fill`: seçenekler eşit en (telefon). `size`:
 * "sm" · "md" · "lg" (kayıt sekmeleri: sayfanın ana gezinmesi, biraz iri).
 *
 * @param {{ value: any, label: string, short?: string, count?: import("react").ReactNode, alert?: boolean }[]} p.options
 *   `alert`: sayı dikkat ister (bekleyen iş) — hangi sekme seçili olursa olsun dolgulu marka hapı.
 */
export function TextTabs({
  options,
  value,
  onChange,
  label,
  kind = "group",
  idPrefix,
  controls,
  rail = false,
  fill = false,
  size = "md",
  className,
}) {
  const group = useId()
  const reduce = useReducedMotion()
  const refs = useRef([])
  const at = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const tabs = kind === "tabs"
  const onKeyDown = (e) => {
    const next = rovingIndex(e.key, at, options.length, isRtl(e.currentTarget))
    if (next < 0) return
    e.preventDefault()
    if (next !== at) onChange(options[next].value)
    refs.current[next]?.focus({ preventScroll: true })
  }
  return (
    <div
      role={tabs ? "tablist" : "group"}
      aria-label={label}
      className={cn(
        "flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]",
        size === "sm" ? "gap-4" : "gap-6",
        // Ray gölgeyle (içe): kaydırılabilir kapta alttaki çizgi kesilmesin.
        rail && "shadow-[inset_0_-1px_0_var(--border)]",
        fill && "gap-0",
        className,
      )}
    >
      <LayoutGroup id={group}>
        {options.map((o, i) => {
          const on = i === at
          return (
            <button
              key={o.value ?? "all"}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={idPrefix ? `${idPrefix}-${o.value}` : undefined}
              type="button"
              role={tabs ? "tab" : undefined}
              aria-selected={tabs ? on : undefined}
              aria-controls={tabs ? controls : undefined}
              aria-pressed={tabs ? undefined : on}
              tabIndex={on ? 0 : -1}
              onClick={() => !on && onChange(o.value)}
              onKeyDown={onKeyDown}
              className={cn(
                "relative inline-flex min-w-0 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11",
                size === "sm"
                  ? "h-8 text-[0.8125rem]"
                  : size === "lg"
                    ? "h-12 text-[1rem]"
                    : "h-11 text-[0.875rem]",
                // Seçili olmayan yazı da AA: soluk gri değil, yazı renginin %65'i.
                on ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                fill && "flex-1 shrink px-1",
              )}
            >
              {o.short ? (
                <>
                  <span className="truncate @[30rem]/ss:hidden">{o.short}</span>
                  <span className="hidden truncate @[30rem]/ss:inline">{o.label}</span>
                </>
              ) : (
                <span className="truncate">{o.label}</span>
              )}
              {o.count != null && (
                // Sayı rozeti: seçili sekmede marka tonunda, ötekilerde sakin gri; dikkat isteyen sayı
                // (`alert`) her durumda dolgulu marka hapı (kenar çubuğunun rozeti).
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-px font-semibold tabular-nums transition-colors",
                    size === "lg"
                      ? "text-[0.75rem] leading-[1.125rem]"
                      : "text-[0.6875rem] leading-4",
                    o.alert
                      ? "bg-brand-solid text-white"
                      : on
                        ? "bg-brand/12 text-brand-ink"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {o.count}
                </span>
              )}
              {on && (
                <motion.span
                  layoutId="underline"
                  aria-hidden="true"
                  transition={reduce ? STILL : GLIDE}
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand"
                />
              )}
            </button>
          )
        })}
      </LayoutGroup>
    </div>
  )
}
