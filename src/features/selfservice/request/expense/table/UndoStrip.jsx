import { AnimatePresence, motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const mac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")

/**
 * "Kalem 3 silindi · Geri al" — ızgaranın alt şeridinde, silmeden sonra 8 saniye (`useRowUndo`).
 * Kaldırılan fişte de aynısı ("Fiş kaldırıldı · Geri al", `text`); Excel'den yapıştırmada
 * "5 kalem yapıştırıldı · Geri al" ve ardında sessiz not (`note`: sınıra takılan, okunamayan
 * satırlar). `onUndo` yoksa düğme çizilmez. Canlı bölge hep çizili (boşken de): ekran okuyucu
 * duyar — duyuruyu başka bir bölge yapıyorsa `announce` kapalı. Üstündeyken ya da odak içindeyken
 * süre durur; kısayolu (Ctrl/⌘+Z) yalnız kalemde yazılı (`keys`).
 */
export function UndoStrip({ undo, onUndo, text, note, keys = true, announce = true, className }) {
  const { t } = useLocale()
  const last = undo.last
  return (
    <div
      role={announce ? "status" : undefined}
      onPointerEnter={() => undo.setHold(true)}
      onPointerLeave={() => undo.setHold(false)}
      onFocus={() => undo.setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && undo.setHold(false)}
      className={cn("min-w-0", className)}
    >
      <AnimatePresence initial={false}>
        {last && (
          <motion.span
            key={last.key ?? last.entry.row?.id ?? last.entry.file?.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span
              className={cn(
                "inline-flex h-8 min-w-0 max-w-full items-center gap-2 rounded-full bg-foreground/[0.06] ps-3 text-[0.8125rem] text-foreground/85",
                onUndo ? "pe-1" : "pe-3",
              )}
            >
              <span className="truncate">
                {text ?? t("selfService.expense.removed", { n: last.n })}
              </span>
              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="relative inline-flex h-[max(1.5rem,24px)] shrink-0 items-center gap-1.5 rounded-full bg-background px-2.5 text-[0.75rem] font-semibold text-brand-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
                >
                  {t("selfService.leave.undo")}
                  {keys && (
                    <kbd
                      aria-hidden="true"
                      className="hidden font-sans text-[0.75rem] font-medium text-muted-foreground pointer-fine:inline"
                    >
                      {mac() ? "⌘Z" : "Ctrl+Z"}
                    </kbd>
                  )}
                </button>
              )}
            </span>
            {note && <span className="text-[0.75rem] text-muted-foreground">{note}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
