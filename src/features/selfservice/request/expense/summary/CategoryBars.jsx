import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText, money } from "../../../kinds"
import { NOTE, REST_TONE, TONES, title } from "./summaryUi"

/**
 * Kategori dağılımı: en büyük dört kategori ve tutarları ("Ulaşım (Yurtiçi) · ₺450,00"), kalanların
 * sayısı. Tek para biriminde üstte payları gösteren ince çubuk (renkli noktalar onun anahtarı);
 * birden çok para biriminde çubuk yok — tutarlar çevrilmeden karşılaştırılamaz. Henüz kategori
 * yokken ne zaman dolacağını söyler. `cats`: `expenseInsights().categories`; `side`: yan panelin
 * başlık boyu.
 */
export function CategoryBars({ cats, side, className }) {
  const { t, locale } = useLocale()
  const { top, rest, restShare } = cats
  const parts = top.filter((c) => c.share > 0).length + (restShare > 0 ? 1 : 0)
  const bar = parts > 1
  return (
    <div className={className}>
      <p className={title(side)}>{t("selfService.expense.summary.categories")}</p>
      {!top.length && (
        <p className={cn(NOTE, "mt-1.5 text-pretty")}>
          {t("selfService.expense.summary.noCategories")}
        </p>
      )}
      {bar && (
        <span
          aria-hidden="true"
          className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full bg-foreground/[0.06]"
        >
          {top.map(
            (c, i) =>
              c.share > 0 && (
                <span
                  key={c.category}
                  className={cn("h-full", TONES[i])}
                  style={{ width: `${c.share * 100}%` }}
                />
              ),
          )}
          {restShare > 0 && (
            <span className={cn("h-full", REST_TONE)} style={{ width: `${restShare * 100}%` }} />
          )}
        </span>
      )}
      {top.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {top.map((c, i) => (
            <li key={c.category} className="flex items-center gap-2 text-[0.8125rem] leading-snug">
              {bar && (
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", TONES[i])} />
              )}
              <span className="min-w-0 flex-1 truncate" title={c.category}>
                {c.category}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {c.totals.length
                  ? c.totals.map(([cur, sum]) => money(sum, cur, locale)).join(" + ")
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rest > 0 && (
        <p className={cn(NOTE, "mt-1.5")}>
          {countText(t, locale, "selfService.expense.summary.moreCategories", rest)}
        </p>
      )}
    </div>
  )
}
