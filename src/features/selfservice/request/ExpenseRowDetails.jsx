import { useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ColumnInsertIcon from "@hugeicons/core-free-icons/ColumnInsertIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { ExpenseCell } from "./ExpenseCell"
import { DETAIL_LABEL } from "./expense/table/detailUi"
import { columnLabel } from "./formUi"

// Alanı ızgaraya sütun yapan küçük düğme: dört alanda dört yazı gürültü olurdu, adı ipucunda.
// Sekme sırasında değil: ayrıntıyı klavyeyle doldurmak alan başına bir durak (aynı iş "Sütunlar"
// menüsünde klavyeyle de yapılır).
const PIN =
  "relative -my-1 grid size-[max(1.5rem,24px)] shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-brand/[0.08] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"

/**
 * Kalemin "Ayrıntı"sı: ızgarada sütunu olmayan isteğe bağlı alanlar (varsayılan: fiş no, firma adı,
 * lokasyon, kişi sayısı). Fiş görselleri burada değil: masrafın başlığına eklenir. Varsayılanlar
 * görünür — lokasyon kategoriden seçili, kişi sayısı "1" yer tutucuda (yazılan rakam onun yanına
 * eklenmez) — ama değere yalnız kişi seçince ya da yazınca girer: asistana giden cümle değişmez.
 * Her alanın etiketinde sütun düğmesi ("… tabloya sütun olarak taşı"): alan bütün kalemler için
 * sütun olur.
 */
export function ExpenseRowDetails({
  id,
  n,
  base,
  row,
  rowName,
  fields,
  errors,
  onSet,
  onPin,
  style,
}) {
  const { t, locale } = useLocale()
  // Açılış bitince taşma serbest: alandaki liste (lokasyon) panelin kenarında kesilmesin.
  // transitionEnd'e güvenilmez — açılışta sık sık hiç uygulanmıyor, panel overflow:hidden kalıyor.
  const [settled, setSettled] = useState(false)
  return (
    <motion.div
      id={id}
      role="region"
      aria-label={t("selfService.form.detailsFor", { n })}
      data-details=""
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0, overflow: "hidden" }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => setSettled(true)}
      style={settled ? { ...style, overflow: "visible" } : style}
      className="min-w-0 overflow-hidden"
    >
      <div className="@container/details mb-2 mt-1 rounded-[0.875rem] bg-foreground/[0.02] p-3.5 ring-1 ring-inset ring-black/[0.05] dark:bg-white/[0.03] dark:ring-white/[0.07]">
        <div
          className={cn(
            "grid grid-cols-1 gap-x-3 gap-y-3.5 @[26rem]/details:grid-cols-2",
            fields.length > 2 && "@[46rem]/details:grid-cols-4",
          )}
        >
          {fields.map((f) => {
            const label = columnLabel(t, locale, f.name)
            return (
              <div key={f.name} className="relative min-w-0 has-[[data-morph-open]]:z-30">
                <div className={cn(DETAIL_LABEL, "justify-between")}>
                  <span aria-hidden="true" className="truncate">
                    {label}
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onPin(f.name)}
                    aria-label={t("selfService.form.cols.pin", { label })}
                    title={t("selfService.form.cols.pin", { label })}
                    className={PIN}
                  >
                    <HugeiconsIcon
                      icon={ColumnInsertIcon}
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
                <ExpenseCell
                  id={f.name}
                  row={row}
                  base={base}
                  rowName={rowName}
                  errors={errors}
                  onSet={onSet}
                  variant="field"
                />
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
