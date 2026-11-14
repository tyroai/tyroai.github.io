import { forwardRef } from "react"
import { motion } from "motion/react"
import { useAnimatedIcon } from "@/hooks/useAnimatedIcon"
import { cn } from "@/lib/utils"
import { RollText } from "@/components/common/RollText"
import "./notchIndicator.css"

/**
 * Halka çemberin DIŞINDA: 52 px'lik tuvalde, çemberden 2,5 px boşlukla ayrı bir halka — soluk tam
 * iz + üstünde sayıyla dolan yay (Apple'ın etkinlik halkasının dili). İz sayı sıfırken de "boş
 * halka"yı söyler; veri yoksa ikisi de çizilmez. Ölçüler px: rem kutu kök yazıyla ölçeklenirdi.
 */
const RING_BOX = 52
const RING_R = 21.75
const RING_STROKE = 2.5
const RING_C = 2 * Math.PI * RING_R
/** Halka bir oran değil yoğunluk: "kaç iş bekliyor" — 5 ve üzeri tam dolu, 2 varsa %40. */
const RING_FULL_AT = 5

/**
 * Ray düğmesi (yan ray, telefon şeridi, Tercihler önizlemesi). `forwardRef` ŞART: Radix
 * `PopoverTrigger asChild` ref'i ve `data-state`i bu elemana takıyor — seçili görünüm
 * `data-[state=open]` ile gelir, ayrı state yok. `glyph`: widget yuvasında ikonun yerine
 * widget'ın tepsideki yüzü (`TrayGlyph`; boyu kendisinde, o yüzden svg kuralı ona uygulanmaz).
 * `value`: sayı yerine kısa değer hapı ("14°", `SlotIndicator`), `srSuffix`: değerin ekran okuyucu
 * eki (", 12 derece"; ad içerikten kurulur), `dot`: canlı nokta, `alert`: sayı
 * olmadan da sıcak (gecikmiş iş, yaklaşan toplantı).
 */
export const RailButton = forwardRef(function RailButton(
  {
    icon,
    animatedIcon,
    glyph,
    label,
    srSuffix,
    count,
    value,
    dot,
    alert,
    accent,
    delay,
    className,
    onMouseEnter,
    onMouseLeave,
    ...props
  },
  ref,
) {
  // Veri yoksa (null) halka hiç çizilmez; sıfırsa boş halka (yay yok).
  const clamped = typeof count === "number" ? Math.min(count / RING_FULL_AT, 1) : null
  // Sayı VARSA düğme "sıcak": halka, çemberin kenarı ve hale paletin açıklığı sabitlenmiş tonunu
  // alır (`--notch-hot-N`). Sayı yok ya da sıfırsa halka sessiz mürekkepte.
  const hot = (typeof count === "number" && count > 0) || Boolean(alert)
  // Hareketi düğmenin tamamı tetikler (`useAnimatedIcon`in kuralı); Radix'in olayları zincirlenir.
  const { icon: iconNode, hoverProps } = useAnimatedIcon({ icon, animatedIcon })
  const enter = (e) => {
    hoverProps.onMouseEnter?.(e)
    onMouseEnter?.(e)
  }
  const leave = (e) => {
    hoverProps.onMouseLeave?.(e)
    onMouseLeave?.(e)
  }
  return (
    <motion.button
      ref={ref}
      type="button"
      // Değer varken ad içerikten kurulur (görünen ad + gizli ek): `aria-label` görünen yazıyla
      // örtüşmezdi (axe `label-content-name-mismatch`).
      aria-label={srSuffix ? undefined : label}
      data-hot={hot ? "" : undefined}
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      className={cn(
        // Çember ile ad arası 0,75rem: halka çemberin 5 px dışına taşıyor. İçerik `min-h` içinde.
        "relative flex min-h-[4.75rem] w-[4.5rem] flex-col items-center justify-center gap-3 rounded-[1.5rem] px-[0.1875rem] py-[0.4375rem] text-[var(--notch-muted)] transition-colors",
        "hover:bg-[var(--notch-raised)] hover:text-[var(--notch-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--notch-focus)]",
        "data-[state=open]:bg-[var(--notch-selected)] data-[state=open]:text-[var(--notch-ink)]",
        "data-[hot]:text-[var(--notch-ink)]",
        className,
      )}
      {...props}
    >
      <span
        className="relative grid size-9 place-items-center rounded-full border border-[var(--notch-line)] bg-[var(--notch-raised)] transition-[border-color,box-shadow] duration-300"
        style={
          hot
            ? {
                color: accent,
                borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
                boxShadow: `0 0 12px color-mix(in oklab, ${accent} 24%, transparent)`,
              }
            : undefined
        }
      >
        {clamped != null && (
          // Tuval çemberden her yönde 8 px büyük (52 px) ve onu ortalıyor.
          <svg
            viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
            className="pointer-events-none absolute left-1/2 top-1/2 size-[52px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-visible"
            aria-hidden="true"
          >
            <circle
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              r={RING_R}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-current opacity-[0.16]"
            />
            <motion.circle
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              r={RING_R}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              className="stroke-current [filter:drop-shadow(0_0_4px_currentColor)]"
              strokeDasharray={RING_C}
              initial={{ strokeDashoffset: RING_C }}
              animate={{ strokeDashoffset: RING_C * (1 - clamped) }}
              transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        )}
        {glyph ? (
          <span className="relative flex text-[var(--notch-ink)]">{glyph}</span>
        ) : (
          // Boyut sınıfı YALNIZ bu sarmalayıcıda: dışarıdaki `[&_svg]` halkanın svg'sini de yakalardı.
          <span className="relative flex text-[var(--notch-ink)] [&_svg]:!size-[1.125rem]">
            {iconNode}
          </span>
        )}
      </span>
      {/* Uzun widget adı tek satırda kısalır (tam adı ipucunda); ray boyu değişmez. */}
      <span className="max-w-full truncate text-[0.6875rem] font-semibold tracking-[0.01em]">
        {label}
      </span>
      {srSuffix && <span className="sr-only">{srSuffix}</span>}
      {/* Sayı rozeti halkaya teğet, üstüne değil: merkezi 45°'de ~28 px'te, halkanın dış kenarına
          yaslanır. Ayıran şey zeminin kendisi (dolu accent + yumuşak gölge, iOS rozeti gibi), beyaz
          halka yok. Sayı değişince `key` ile yeniden doğar ve küçük bir pop yapar. */}
      {count != null && count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 460, damping: 26, mass: 0.7 }}
          className="absolute -top-[0.1875rem] right-[0.5rem] grid h-4 min-w-4 place-items-center rounded-full px-[0.3125rem] text-[0.6875rem] font-semibold leading-none tabular-nums tracking-[-0.01em] shadow-[0_2px_6px_rgb(0_0_0/0.22)]"
          style={{ background: accent, color: "var(--notch-on-hot)" }}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
      {/* Değer hapı sayı rozetinin yerinde ve dilinde (aynı dolgu ve mürekkep); adı düğmenin
          `aria-label`ında, burası süs. Sayı varken çizilmez. */}
      {!(count > 0) && (value || dot) && (
        <span
          aria-hidden="true"
          className="notch-ind"
          data-dot={dot && !value ? "" : undefined}
          style={{ "--notch-ind": accent }}
        >
          {value ? <RollText text={value} /> : null}
        </span>
      )}
    </motion.button>
  )
})
