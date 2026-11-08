import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { ownerOf } from "@/features/selfservice/lib/expenseHeadView"
import { cn } from "@/lib/utils"
import { ExpenseForm } from "../ExpenseForm"
import { ExpenseHead } from "../ExpenseHead"
import { ExpenseTable } from "../ExpenseTable"
import { MAX_RECEIPTS } from "../useExpenseRows"
import { ExpenseReview } from "./ExpenseReview"
import { LineWarningsProvider } from "./history/LineWarningsProvider"
import { PasteAnnounce, PasteStrip } from "./paste/PasteStrip"
import { ReadMarksProvider } from "./receipts/readMarks"
import { useReceiptReading } from "./receipts/useReceiptReading"
import { usePasteRows } from "./paste/usePasteRows"
import { SummaryPanel } from "./summary/SummaryPanel"
import { useSummarySide } from "./summary/useSummaryLayout"
import { DropVeil } from "./table/DropVeil"
import { useBodyDrop } from "./useBodyDrop"

/**
 * Masraf formunun gövdesi: gözden geçirmede yalnız özet (`ExpenseReview`, tam genişlik); yoksa
 * başlık (kimin adına · şirket · açıklama; fiş şeridi), kalemler (form doğrudan onlarla açılır;
 * masaüstünde tablo, telefonda ve dar pencerede kartlar) ve "Masraf özeti" (`SummaryPanel`).
 * Yerleşim formun genişliğine göre (`useSummarySide`): form ≥ 80rem ve tablo sığıyorsa iki
 * sütun — solda başlık ve kalemler, sağda yapışık özet (18rem); değilse özet başlıkla kalemlerin
 * arasında tam genişlik sıkı şerit. Telefonda özet gövdede yok (kalemlere yer kalsın): alt
 * şeritteki ayrıntı düğmesinde (`ExpenseDetails`). Özet DOM'da kalemlerden sonra: sekme sırası
 * başlıktan doğrudan kalemlere iner, özet en sonda. Gövdenin herhangi bir yerine bırakılan ya da
 * yapıştırılan fişler masrafın başlığına eklenir (`useBodyDrop`; ERP'de de başlıkta durur).
 * Excel'den yapıştırılan satırlar kalem olur (`paste/usePasteRows`): ızgarada hücreden, fareli
 * ekranda yazı alanı dışında her yerden. Sonuç şeridi ızgaranın alt şeridinde; kartlarda
 * kalemlerin altında. Fiş şeridinin "Fişlerden doldur"u fişleri okuyup kalemleri doldurur
 * (`receipts/useReceiptReading`); okunan hücrelerde değnek işareti (`ReadMarksProvider`).
 */
export function ExpenseBody({ form, flow, idBase, owners, columns, table, via = "chat" }) {
  const [node, setNode] = useState(null)
  const mobile = useIsMobile()
  const side = useSummarySide(node, table ? columns.minRem : 0)
  // Dokunmatikte yapıştırma alanlara olduğu gibi gider: gövde yalnız fareli ekranda metin alır.
  const fine = useMediaQuery("(pointer: fine)")
  const paste = usePasteRows({ form, idBase, columns })
  const drop = useBodyDrop(flow.add, !flow.review, fine ? paste.run : null)
  const reading = useReceiptReading(form.expense)
  if (flow.review)
    return (
      <ExpenseReview
        form={form}
        owners={owners}
        review={flow.review}
        onEdit={flow.edit}
        via={via}
      />
    )
  return (
    <div
      ref={setNode}
      {...drop.handlers}
      className={cn(
        "relative grid",
        side ? "grid-cols-[minmax(0,1fr)_18rem] grid-rows-[auto_1fr] gap-x-6" : "grid-cols-1",
      )}
    >
      <div className="col-start-1 row-start-1 min-w-0">
        <ExpenseHead
          head={form.head}
          setHead={form.setHead}
          defaultTitle={form.defaultTitle}
          idBase={idBase}
          owners={owners}
          receipts={flow.receipts}
          reading={reading}
        />
      </div>
      <div className={cn("col-start-1 min-w-0", side ? "row-start-2" : "row-start-3")}>
        <LineWarningsProvider rows={form.expense.rows}>
          <ReadMarksProvider marks={reading.marks}>
            {table ? (
              <ExpenseTable form={form} idBase={idBase} columns={columns} paste={paste} />
            ) : (
              <ExpenseForm form={form} idBase={idBase} />
            )}
          </ReadMarksProvider>
        </LineWarningsProvider>
        {!table && paste.last && <PasteStrip paste={paste} className="mt-3" />}
      </div>
      {!mobile && (
        <SummaryPanel
          form={form}
          side={side}
          idBase={idBase}
          // Başkası adına girilen masrafta kişinin kendi yöneticisi gösterilmez (onaylayanı ERP bilir).
          onBehalf={Boolean(ownerOf(form.head, owners.owners))}
          className={
            side
              ? "sticky top-0 col-start-2 row-[1/span_2] self-start"
              : "col-start-1 row-start-2 mb-5"
          }
        />
      )}
      {drop.over && <DropVeil full={form.expense.receipts.length >= MAX_RECEIPTS} />}
      <PasteAnnounce paste={paste} />
    </div>
  )
}
