import { motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"

// Kenar sütunlarda balon içeri kayar (kabın dışına taşmasın); ok yine günün üstünde kalır.
// Konum ekran koordinatıyla ölçülür: yön (RTL) fark etmez.
const SHIFT = { center: "-50%", left: "-0.875rem", right: "calc(-100% + 0.875rem)" }

/**
 * Ekip işaretli günün üstünde ince bir balon: o gün izinli olanların adları (onaydaysa "onayda").
 * Yalnız ince işaretçide (fare); dokunmatikte ve ekran okuyucuda aynı bilgi günün adında.
 * `tip`: `{ x, y, align, people }` — kaba göre px (günün üst ortası); `align`: center · left · right.
 */
export function TeamTip({ tip }) {
  const { t } = useLocale()
  if (!tip) return null
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className="pointer-events-none absolute z-20 pointer-coarse:hidden"
      style={{ left: tip.x, top: tip.y }}
    >
      <div
        className="absolute bottom-1.5 left-0 w-max max-w-[15rem] rounded-md bg-foreground px-3 py-2 text-[0.75rem] leading-snug text-background shadow-lg"
        style={{ transform: `translateX(${SHIFT[tip.align]})` }}
      >
        <p className="mb-0.5 text-[0.6875rem] font-medium text-background/70">
          {t("selfService.leave.legend.team")}
        </p>
        <ul>
          {tip.people.map((p) => (
            <li key={p.key} className="truncate">
              {p.name}
              {p.pending && (
                <span className="text-background/70">
                  {" · "}
                  {t("selfService.leave.pendingStatus")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-[3px] left-0 size-2.5 -translate-x-1/2 rotate-45 rounded-[0.125rem] bg-foreground"
      />
    </motion.div>
  )
}
