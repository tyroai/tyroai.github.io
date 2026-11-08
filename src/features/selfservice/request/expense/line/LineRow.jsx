import { memo, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tag01Icon from "@hugeicons/core-free-icons/Tag01Icon"
import { categoryIcon } from "@/features/selfservice/detail/icons"
import { useLocale } from "@/hooks/useLocale"
import { formErrors, parseAmount } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { day, money } from "../../../kinds"
import { useLineWarning } from "../history/lineWarningsContext"
import { warningTexts } from "../history/warningText"
import { NumberBadge } from "../table/NumberBadge"
import { BADGE_REST, BADGE_SMALL, EDGE } from "./lineUi"

/**
 * Kategorinin 40 px sakin simgesi (geçmiş masrafların kalem kartıyla aynı dil). Fiş görseli
 * burada değil: fişler masrafın başlığında. Kategori seçilmemişse kesik çizgili boş etiket.
 */
function CategoryMark({ category }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[0.625rem]",
        category
          ? "bg-muted/80 text-foreground/60"
          : ["border border-dashed text-muted-foreground/55", EDGE],
      )}
    >
      <HugeiconsIcon
        icon={category ? categoryIcon({ category }) : Tag01Icon}
        className="size-[1.125rem]"
        strokeWidth={1.7}
      />
    </span>
  )
}

/**
 * Kapalı kalem (en az 56 px): numara (tamamsa yeşil ✓, `NumberBadge`), kategorinin simgesi,
 * kategori ve altında tarih · açıklama; sağda tutar ve gönderme denemesinden sonra eksikse kırmızı
 * "Eksik"; olası mükerrerde numaranın köşesinde sarı nokta (metni görünmez, düğmenin adında). Basınca (Enter, boşluk) kalem açılır. `first`/`last`: kapalı kümenin ilki ve sonu (köşeler). `memo`: başka bir kalem
 * yazılırken kapalı satırlar yeniden çizilmez — `onOpen` kalemin kimliğiyle hep aynı işi yapar
 * (durum güncellemeleri işlevsel), bu yüzden karşılaştırmaya girmez.
 */
export const LineRow = memo(LineRowView, (a, b) =>
  ["row", "n", "invalid", "first", "last"].every((k) => a[k] === b[k]),
)

function LineRowView({ row, n, invalid, first, last, onOpen }) {
  const { t, locale } = useLocale()
  const v = row.values
  const sum = parseAmount(v.amount, locale)
  const warns = warningTexts(t, locale, useLineWarning(row), v)
  const done = useMemo(() => !Object.keys(formErrors("expense", v)).length, [v])
  // Alt satır: tarih ve kalemi tanıtan ilk yazı (açıklama, yoksa firma adı).
  const what = String(v.note ?? "").trim() || String(v.firm ?? "").trim()
  const sub = [day(v.date, locale, false), what].filter(Boolean).join(" · ")

  return (
    <button
      type="button"
      aria-expanded="false"
      data-line-row=""
      onClick={onOpen}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
        first && "rounded-t-[1.0625rem]",
        last && "rounded-b-[1.0625rem]",
      )}
    >
      <NumberBadge
        n={n}
        state={invalid ? "error" : done ? "done" : null}
        warn={warns.length > 0}
        rest={BADGE_REST}
        className={BADGE_SMALL}
      />
      <CategoryMark category={v.category} />
      <span className="min-w-0 flex-1">
        <span className="sr-only">{t("selfService.form.row", { n })}: </span>
        <span
          className={cn(
            "block truncate text-[0.875rem] font-medium",
            !v.category && "text-muted-foreground",
          )}
        >
          {v.category ?? t("selfService.form.noCategory")}
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-muted-foreground">{sub}</span>
        {done && !invalid && (
          <span className="sr-only"> · {t("selfService.expense.line.ready")}</span>
        )}
        {warns.length > 0 && <span className="sr-only"> · {warns.join(" · ")}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "text-[0.9375rem] font-semibold tabular-nums",
            sum == null && "font-medium text-muted-foreground",
          )}
        >
          {sum == null ? "—" : money(sum, v.currency ?? "TRY", locale)}
        </span>
        {invalid && (
          <span className="inline-flex h-5 items-center rounded-full bg-danger/10 px-2 text-[0.75rem] font-semibold text-danger-ink">
            {t("selfService.expense.line.incomplete")}
          </span>
        )}
      </span>
    </button>
  )
}
