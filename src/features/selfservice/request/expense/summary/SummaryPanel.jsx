import { useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { useRequestData } from "../../requestData"
import { StatusToggle } from "./StatusToggle"
import { SummaryHero } from "./SummaryHero"
import { SummaryParts } from "./SummaryParts"
import { CARD, RULE, SIDE_SCROLL, cell } from "./summaryUi"
import { useExpenseSummary } from "./useExpenseSummary"
import { useScrollRoom } from "./useSummaryLayout"
import { warningCount } from "./warnCount"

// Sıkı özetin ayrıntı hücreleri: telefonda alt alta, şeritte iki, geniş şeritte dört sütun.
const DETAIL = [
  "",
  "border-t @[36rem]/summary:border-s @[36rem]/summary:border-t-0",
  "border-t @[60rem]/summary:border-s @[60rem]/summary:border-t-0",
  "border-t @[36rem]/summary:border-s @[60rem]/summary:border-t-0",
]

/**
 * MASRAF ÖZETİ (masaüstü ve tablet; telefonda gövdede yok: alt şeritte `ExpenseDetails`) — izin
 * formunun etki kartının masraftaki karşılığı; canlı ve yalnız formdan hesaplanır
 * (`useExpenseSummary` › `features/selfservice/lib/expenseInsights`): toplam (para birimine göre), kalem ve fiş sayısı,
 * tarih aralığı; "Eksikler" (alana götüren düğmeler); ileri tarihli, aynı görünen ve ERP'de eşi
 * olabilecek kalemler (kişinin masraf kayıtlarıyla, `useRequestData`); masrafın fişleri (kalemin
 * değil: ERP'de başlığa eklenir); kategori dağılımı ve yönetici (`SummaryParts`; "Ne olacak?"
 * panelde değil: formun alt şeridindeki bilgi düğmesinde).
 * `side`: kalemlerin yanında 18rem kart — hepsi alt alta, yapışık, uzunsa kendi içinde kayar.
 * Değilse kalemlerin üstünde sıkı özet: toplam ve durum satırı, ayrıntısı açılır (kalemlere yer
 * kalsın); şeritte yan yana, dar kapta alt alta. `onBehalf`: başkası adına — kişinin kendi
 * yöneticisi o masrafın onayıyla ilgisiz, gösterilmez.
 */
export function SummaryPanel({ form, side, idBase, onBehalf, className }) {
  const { t } = useLocale()
  const ref = useRef(null)
  useScrollRoom(ref, side)
  const [more, setMore] = useState(false)
  const { expenses: history } = useRequestData() ?? {}
  const summary = useExpenseSummary({ form, idBase, history })
  const { info, tried, errors } = summary
  const detailsId = `${idBase}-summary-details`
  const parts = (cls) => (
    <SummaryParts side={side} summary={summary} idBase={idBase} onBehalf={onBehalf} cls={cls} />
  )

  return (
    <aside
      ref={ref}
      aria-label={t("selfService.expense.summary.title")}
      className={cn("@container/summary min-w-0", className)}
    >
      <div className={cn(CARD, side && SIDE_SCROLL)}>
        {side ? (
          <>
            <SummaryHero side info={info} className={cell(true)} />
            {parts(() => cn(cell(true), RULE, "border-t"))}
          </>
        ) : (
          <>
            <div className="@[36rem]/summary:flex">
              <SummaryHero info={info} className={cn(cell(false), "flex-1 self-center")} />
              <StatusToggle
                missing={info.missing.length}
                errors={errors}
                warnings={warningCount(info)}
                tried={tried}
                open={more}
                onToggle={() => setMore((v) => !v)}
                controls={more ? detailsId : undefined}
              />
            </div>
            <AnimatePresence initial={false}>
              {more && (
                <motion.div
                  id={detailsId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      RULE,
                      "grid grid-cols-1 border-t @[36rem]/summary:grid-cols-2 @[60rem]/summary:grid-cols-4",
                    )}
                  >
                    {parts((i) => cn(cell(false), RULE, DETAIL[i]))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </aside>
  )
}
