import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../../kinds"
import { MAX_RECEIPTS } from "../../useExpenseRows"

/**
 * Masraf gövdesine dosya sürüklenirken (fiş alanlarının üstü dışında) beliren durgun katman:
 * "Bırak; fişler masrafa eklenir" — formun neresine bırakılırsa bırakılsın fişler başlığa gider
 * (`useBodyDrop`). `full`: masrafın fişleri dolu (en çok 10), sınır yazar. Olayları alttaki
 * öğelere bırakır (`pointer-events-none`); yazısı uzun listede de görünür yerde (yapışık).
 */
export function DropVeil({ full }) {
  const { t, locale } = useLocale()
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -inset-2 z-40 rounded-[1.25rem] border-2 border-dashed bg-card/70 backdrop-blur-[2px]",
        full ? "border-foreground/25" : "border-brand-ink",
      )}
    >
      <div className="sticky top-[38%] flex justify-center py-10">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-background px-4 py-2 text-[0.875rem] font-semibold shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)] dark:border-white/[0.1]",
            full ? "text-muted-foreground" : "text-brand-ink",
          )}
        >
          <HugeiconsIcon icon={Attachment01Icon} className="size-4" strokeWidth={1.8} />
          {full
            ? t("selfService.form.receiptFull", { n: number(MAX_RECEIPTS, locale) })
            : t("selfService.expense.receipts.dropNow")}
        </span>
      </div>
    </div>
  )
}
