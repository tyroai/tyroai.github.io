import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { yearEndLeave } from "@/features/selfservice/lib/yearEndLeave"

const SHOWN = 4

/**
 * Kasım–Aralık'ta yönetici için sakin bir satır: bağlılarının yıl sonuna kalan yıllık izni
 * ("Ayşe 12 gün · Mehmet 9 gün"), en çok dört ad + "+N kişi". Yoksa hiç çizilmez.
 */
export function YearEndLeave({ rows, className }) {
  const { t, locale } = useLocale()
  const list = yearEndLeave(rows)
  if (!list.length) return null
  const num = getNumberFormat(locale, { maximumFractionDigits: 1 })
  const items = list
    .slice(0, SHOWN)
    .map((x) => t("selfService.team.yearEnd.item", { name: x.name, n: num.format(x.remain) }))
  if (list.length > SHOWN)
    items.push(t("selfService.team.yearEnd.more", { n: list.length - SHOWN }))
  return (
    <p
      role="note"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-[0.8125rem] text-foreground/80 ${className ?? ""}`}
    >
      <HugeiconsIcon
        icon={Calendar03Icon}
        aria-hidden="true"
        className="size-4 shrink-0"
        strokeWidth={1.9}
      />
      <span className="font-medium">{t("selfService.team.yearEnd.title")}</span>
      <span className="min-w-0 flex-1">{items.join(" · ")}</span>
    </p>
  )
}
