import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../../kinds"
import { capFirst } from "../../formUi"
import { MISSING_CHIP, MISSING_CHIP_TRIED, NEED_INK, OK_INK, SECTION, TITLE } from "./panelUi"

/** Alana götürür: gövdede görünmüyorsa ortaya kaydırır, sonra odaklar (kutu ya da seçicinin tetiği). */
function goTo(idBase, field) {
  const el = document.getElementById(`${idBase}-${field}`)
  if (!el) return
  const box = el.closest(".overflow-y-auto")?.getBoundingClientRect()
  const at = el.getBoundingClientRect()
  if (!box || at.top < box.top + 8 || at.bottom > box.bottom - 8)
    el.scrollIntoView({ block: "center" })
  el.focus({ preventScroll: true })
}

/**
 * "Eksikler": gönderimi engelleyen alanlar, her biri o alana götüren hafif kırmızı çip (alandaki
 * kırmızı çerçeveyle aynı dil). Gönderme denendikten sonra başlık da kırmızı, çipler koyulaşır
 * (hata cümlesi alt şeritte). Eksik yoksa yeşil "Gönderime hazır". `items`:
 * `advanceInsights().missing`.
 */
export function MissingFields({ items, tried, idBase }) {
  const { t, locale } = useLocale()

  if (!items.length) {
    return (
      <div className={SECTION}>
        <p className={cn(TITLE, OK_INK)}>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={2}
          />
          {t("selfService.advance.summary.ready")}
        </p>
      </div>
    )
  }

  return (
    <div className={SECTION}>
      <p className={cn(TITLE, tried && NEED_INK)}>
        {t("selfService.expense.summary.missing")}
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger/[0.1] px-1.5 text-[0.6875rem] font-semibold tabular-nums text-danger-ink">
          {number(items.length, locale)}
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map(({ field, error }) => {
          const name = capFirst(t(`myspace.slot.${field}`), locale)
          return (
            <li key={field} className="min-w-0">
              <button
                type="button"
                onClick={() => goTo(idBase, field)}
                className={cn(MISSING_CHIP, tried && MISSING_CHIP_TRIED)}
              >
                <span className="truncate">
                  {error === "amount"
                    ? t("selfService.expense.summary.invalid", { field: name })
                    : name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
