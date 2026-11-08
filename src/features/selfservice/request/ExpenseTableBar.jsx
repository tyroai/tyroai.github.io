import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { useLocale } from "@/hooks/useLocale"
import { defaultLayout, expenseProgress } from "@/features/selfservice/lib/expenseColumns"
import { countText } from "../kinds"
import { focusCell } from "./expense/table/gridFocus"

// Eksik alanların sırası: ızgaranın varsayılan sütun sırası (kategori tutardan önce).
const ORDER = defaultLayout().order

/**
 * Pencerenin alt şeridinin solu, masaüstü ızgarada: kırmızı "3 alan kaldı ›" (basınca ilk eksik
 * alana gider; ızgarada sütunu yoksa kalemin "Ayrıntı"sı açılır) ya da yeşil ✓ "Eksik alan yok"
 * (durum renkleri: eksik kırmızı, tamam yeşil). Toplam ve "Kalem ekle" ızgaranın kendi alt
 * şeridinde: burada tekrarlanmaz.
 */
export function ExpenseTableBar({ form, idBase }) {
  const { t, locale } = useLocale()
  const { rows } = form.expense
  const { left, first } = useMemo(() => expenseProgress(rows, ORDER), [rows])
  if (!left) {
    return (
      <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[0.8125rem] font-medium text-success-ink">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={2}
        />
        {t("selfService.expense.grid.ready")}
      </p>
    )
  }
  const jump = () => {
    if (document.getElementById(`${idBase}-${first.id}-${first.name}`))
      return focusCell(idBase, first.id, first.name)
    // Alan ızgarada sütun değil: önce kalemin "Ayrıntı"sı açılır, odak çizimden sonra.
    form.expense.showDetails(first.id, true)
    requestAnimationFrame(() => focusCell(idBase, first.id, first.name))
  }
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <button
        type="button"
        onClick={jump}
        className="group/left relative -ms-1 inline-flex min-h-8 items-center gap-2 rounded-lg px-1.5 text-[0.8125rem] font-medium text-danger-ink transition hover:bg-danger/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        {/* Eksik: kırmızı halka (formların "eksik" dili; dolu nokta "hata" gibi okunmasın). */}
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full border-[1.5px] border-danger bg-danger/15"
        />
        {countText(t, locale, "selfService.expense.grid.left", left)}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="size-3.5 opacity-70 transition-transform group-hover/left:translate-x-0.5 motion-reduce:transition-none rtl:-scale-x-100 rtl:group-hover/left:-translate-x-0.5"
          strokeWidth={2}
        />
      </button>
    </div>
  )
}
