import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import { resetTours } from "@/components/tour/tourStore"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { LIST_ROW as ROW, OFFSCREEN_STYLE, TOURS_ID } from "./helpContent"
import { PAGES } from "./helpPages"

// Turu olan sayfalar (tur kimliği = yardım sayfasının kimliği), kenar çubuğunun sırasıyla.
const TOUR_PAGES = ["home", "selfservice", "feed", "todo", "chat"]

/**
 * Rehber turları: her sayfanın kısa turunu yeniden açar (`?tour=<kimlik>`, açabildiği sayfalar) ve
 * bütün turları sıfırlar — sayfa turları ilk ziyaretteki gibi, talep formu ve Anlat ipuçları ilk
 * açılışta yeniden gelir. Ayrıntı: docs/features/rehber-turlari.md.
 */
export function HelpTours() {
  const { t } = useLocale()
  const { canOpen } = usePageAccess()
  const pages = PAGES.filter((p) => TOUR_PAGES.includes(p.id) && canOpen(p.to))
  const reset = () => {
    resetTours()
    notify.success(t("help.tours.resetDone"))
  }
  return (
    <section
      id={TOURS_ID}
      aria-labelledby="help-tours-title"
      className="scroll-mt-28 space-y-3"
      style={OFFSCREEN_STYLE}
    >
      <div className="min-w-0">
        <h2
          id="help-tours-title"
          tabIndex={-1}
          className="text-base font-semibold tracking-tight outline-none"
        >
          {t("help.tours.title")}
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{t("help.tours.subtitle")}</p>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
        {pages.map((page) => (
          <li key={page.id} className="flex flex-col">
            <Link to={`${page.to}?tour=${page.id}`} className={ROW}>
              <HugeiconsIcon
                icon={page.icon}
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                {t(`help.pages.${page.id}.title`)}
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground/60 rtl:rotate-180"
              />
            </Link>
          </li>
        ))}
        <li className="flex flex-col">
          <button type="button" onClick={reset} className={cn(ROW, "text-start")}>
            <HugeiconsIcon
              icon={RefreshIcon}
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-snug">
                {t("help.tours.reset")}
              </span>
              <span className="block text-[0.8125rem] text-muted-foreground">
                {t("help.tours.resetHint")}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  )
}
