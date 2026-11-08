import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { titleOf } from "@/lib/expenseHead"
import { companyOf, onBehalfText } from "@/features/selfservice/lib/expenseHeadView"
import { lineWarnings } from "@/features/selfservice/lib/expenseInsights"
import { expenseSummary } from "@/features/selfservice/lib/requestFormItems"
import { optionLabel, PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { cn } from "@/lib/utils"
import { countText, money } from "../../kinds"
import { capFirst } from "../formUi"
import { useRequestData } from "../requestData"
import { ReceiptPane } from "./ReceiptPane"
import { InfoGroup, InfoRow, ReviewLines } from "./ReviewLines"
import { ReviewReceipts } from "./ReviewReceipts"

const COMPANY_SLOT = PROMPT_TEMPLATES.expense.slots.company
// Bölüm başlıkları: gövdeden bir kademe büyük, tam mürekkep — sayfayı tararken önce onlar okunsun.
const SECTION = "text-[0.8125rem] font-bold uppercase tracking-[0.07em] text-foreground/85"
const EDIT =
  "relative shrink-0 rounded text-[0.8125rem] font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-3"

/**
 * Masrafın gözden geçirme adımı (her masraf, tek kalemde de): başlık bilgileri ve masrafın fişleri
 * (bir kez; kalemde fiş yok), kalemler, para birimine göre toplamlar ve TYRO'ya gidecek mesajın
 * kendisi (`review.text`; fişler küçültülüp adlandırılmış — gönderilen birebir bu). Engelleyen
 * hata buraya gelmez: önce doğrulama geçer; olası mükerrer (ERP'de eşi ya da formda aynısı)
 * kalemin altında sarı uyarı, engellemez. "Değiştir" düzenlemeye döner (kalemde o kalem
 * açılır). Açılınca odak adımın başına geçer: klavyeyle ikinci Enter gözden geçirmeden
 * göndermesin, ekran okuyucu adımın değiştiğini duysun.
 *
 * Geniş formda (≥ 60rem; `requestForm.css` › `.req-review`) iki yarı — imzala & gönder
 * penceresinin önizleme düzeni: solda gidecek masrafın fişi (`ReviewReceipt`, yazıcıdan çıkar),
 * sağda bu özet (`ReceiptPane`: pencereye sığar). Dar formda yalnız özet. `via` "erp" ise (Gönder
 * ERP'ye yazar) TYRO'ya gidecek mesaj bölümü yok.
 */
export function ExpenseReview({ form, owners, review, onEdit, via = "chat" }) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const [showText, setShowText] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  const { rows, receipts } = form.expense
  const { head } = form
  // Başlık bağlamıyla aynı söz: "Kerem Aydın adına" ya da kişinin adı ("Kendim" yedeği).
  const owner =
    onBehalfText(t, head, owners.owners) ?? (owners.name || t("selfService.form.head.self"))
  const company = capFirst(optionLabel(t, COMPANY_SLOT, head.company), locale)
  const { totals } = expenseSummary(rows, locale)
  const { expenses: history } = useRequestData() ?? {}
  const warnings = useMemo(() => lineWarnings(rows, history, locale), [rows, history, locale])

  return (
    // Geniş pencerede satır okunur boyda kalsın: kalemin adı ile tutarı arasına ekran girmesin.
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={t("selfService.expense.reviewing")}
      className="req-review mx-auto w-full max-w-[64rem] outline-none"
    >
      {!mobile && <ReceiptPane form={form} owners={owners} />}
      <div className="req-review-main min-w-0 space-y-6">
        <section aria-labelledby="ss-review-head">
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h3 id="ss-review-head" className={SECTION}>
              {t("selfService.form.head.label")}
            </h3>
            <button type="button" className={EDIT} onClick={() => onEdit(null)}>
              {t("selfService.expense.edit")}
            </button>
          </div>
          <InfoGroup>
            <InfoRow label={t("selfService.form.head.owner")} first>
              {owner}
            </InfoRow>
            {/* Telefonda kendi şirketin yazılmaz (formun hiçbir yerinde); başka şirket seçildiyse görünür. */}
            {!(mobile && !companyOf(head.company)) && (
              <InfoRow label={t("selfService.form.head.company")}>{company}</InfoRow>
            )}
            <InfoRow label={t("selfService.form.head.title")}>
              {titleOf(head, form.defaultTitle)}
            </InfoRow>
            {receipts.length > 0 && (
              <InfoRow label={t("selfService.expense.receipts.title")}>
                <span className="flex justify-end">
                  <ReviewReceipts receipts={receipts} />
                </span>
              </InfoRow>
            )}
          </InfoGroup>
        </section>

        <section aria-labelledby="ss-review-rows">
          <h3 id="ss-review-rows" className={cn(SECTION, "mb-2 px-1")}>
            {t("selfService.expense.rowsTitle", { n: rows.length })}
          </h3>
          <ReviewLines rows={rows} warnings={warnings} onEdit={onEdit} edit={EDIT} />
        </section>

        {/* Toplam: marka tonunda tek kart — sayfanın en çok aranan rakamı. */}
        <section
          aria-label={t("selfService.form.totalLabel")}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-2xl bg-brand/[0.06] px-5 py-4 ring-1 ring-inset ring-brand/15"
        >
          <span className="text-[0.875rem] font-semibold text-foreground/80">
            {t("selfService.form.totalLabel")} ·{" "}
            {countText(t, locale, "selfService.form.lineCount", rows.length)}
          </span>
          <span className="flex flex-wrap gap-x-6 gap-y-1">
            {totals.map(([cur, sum]) => (
              <span
                key={cur}
                className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] tabular-nums"
              >
                {money(sum, cur, locale)}
              </span>
            ))}
          </span>
        </section>

        {/* TYRO'ya gidecek mesaj yalnız sohbet yolunda: ERP'ye yazılan talepte mesaj yok. */}
        {via !== "erp" && (
          <section className="space-y-2">
            <p className="flex items-center gap-1">
              <button
                type="button"
                aria-expanded={showText}
                onClick={() => setShowText((s) => !s)}
                className="inline-flex min-h-6 items-center gap-1 rounded text-[0.875rem] font-bold text-foreground/85 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
              >
                {t("selfService.expense.messageTitle")}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  aria-hidden="true"
                  strokeWidth={2}
                  className={cn("size-3.5 transition-transform", showText && "rotate-180")}
                />
              </button>
              {/* Mesajın nereye gittiği: uzun cümle yerine ⓘ. */}
              <InfoTip text={t("selfService.form.how")} className="size-6" />
            </p>
            {showText && (
              <p className="whitespace-pre-wrap rounded-xl bg-muted/60 px-3.5 py-3 text-[0.8125rem] leading-relaxed">
                {review.text}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
