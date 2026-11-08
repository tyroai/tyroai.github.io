import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { DELEGATE_ITEM, TABS } from "../kinds"
import { IconTile } from "../request/field/IconTile"
import { partLook } from "./narrateLook"

// Masrafta çipte gösterilen en çok kalem; fazlası tek çipte sayı.
const LINES = 4

/**
 * Anlat'ın "anladığım": her parça formdaki alanın ikonu ve tonuyla bir çip (yeni anlaşılan çip
 * kısa bir kayışla gelir), altında uyarılar (sarı). `showForm`: başta açılacak formun çipi (menüde).
 * Masrafta başlık ve her kalem bir çip (kategori · firma · tutar · tarih); dörtten fazla kalem "+3 kalem".
 * Hiçbir şey anlaşılmadıysa örnekli tek satır.
 */
export function NarrateChips({ result, showForm = false, className }) {
  const { t, locale } = useLocale()
  const reduced = useReducedMotion()
  if (!result) return null
  if (!result.kind) {
    return (
      <p className={cn("text-[0.8125rem] leading-snug text-muted-foreground", className)}>
        {t("selfService.narrate.unknown")}
      </p>
    )
  }
  const tab = showForm ? [...TABS, DELEGATE_ITEM].find((x) => x.id === result.kind) : null
  // Yalnız masraf kalemleri sayıyla kısalır; izin ve avansın alanları hep görünür.
  const lines = result.parts.filter((p) => p.key === "line")
  const shown = [...result.parts.filter((p) => p.key !== "line"), ...lines.slice(0, LINES)]
  const chips = [
    ...(tab
      ? [
          {
            id: "form",
            icon: tab.cta,
            tone: "brand",
            text: t(`selfService.cta.${tab.id}`),
            form: true,
          },
        ]
      : []),
    ...shown.map((p) => ({ id: p.key + (p.index ?? ""), ...partLook(p, t, locale) })),
    ...(lines.length > LINES
      ? [{ id: "more", text: t("selfService.narrate.moreLines", { n: lines.length - LINES }) }]
      : []),
  ]
  return (
    <div className={cn("space-y-2", className)}>
      <ul aria-live="polite" className="flex flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {chips.map((c) => (
            <motion.li
              key={`${c.id}:${c.text}`}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border pe-2.5 ps-1 text-[0.8125rem] font-medium",
                c.form
                  ? "border-transparent bg-brand-fill-deep text-brand-on-brand"
                  : "border-black/[0.08] bg-card dark:border-white/[0.1]",
              )}
            >
              {!c.icon ? null : c.form ? (
                <HugeiconsIcon
                  icon={c.icon}
                  aria-hidden="true"
                  className="ms-1 size-3.5 shrink-0"
                  strokeWidth={2}
                />
              ) : (
                <IconTile icon={c.icon} tone={c.tone} size="xs" />
              )}
              <span className="truncate">{c.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {result.warnings.map((w) => (
        <p
          key={w}
          className="flex items-start gap-1.5 text-[0.75rem] leading-snug text-warning-ink"
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            aria-hidden="true"
            className="mt-px size-3.5 shrink-0"
          />
          {t(`selfService.narrate.warn.${w}`)}
        </p>
      ))}
    </div>
  )
}
