import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { parseAmount } from "@/lib/requestForm"
import { day, money } from "../../kinds"
import { categoryIcon } from "../../detail/icons"
import { warningTexts } from "./history/warningText"
import { WarnNote } from "./history/WarnNote"

// Apple'ın gruplu listesi: sakin gri zemin, satırlar arasında simgenin hizasından başlayan ince çizgi.
const GROUP = "overflow-hidden rounded-2xl bg-muted/45"
const RULE = "absolute end-0 top-0 h-px bg-black/[0.06] dark:bg-white/[0.08]"

/**
 * Gözden geçirmenin kalemleri — gruplu liste: her kalem bir satır; solda kategorinin simgesi
 * (marka tonunda kutu — göz kalemleri buradan seçer), kategori, altında tarih · açıklama · fiş
 * no · firma; sağda tutar ve "Değiştir" (o kalemi açar). Olası mükerrer kalemin altında sarı
 * uyarı. `warnings`: kalem kimliği → uyarılar (`lineWarnings`). `edit`: Değiştir düğmesinin biçimi.
 */
export function ReviewLines({ rows, warnings, onEdit, edit }) {
  const { t, locale } = useLocale()
  return (
    <ol className={GROUP}>
      {rows.map((r, i) => {
        const v = r.values
        const amount = parseAmount(v.amount, locale)
        const sub = [
          day(v.date, locale, false),
          v.note,
          v.receipt && t("selfService.expense.receiptNo", { no: v.receipt }),
          v.firm,
        ]
          .map((x) => String(x ?? "").trim())
          .filter(Boolean)
        return (
          <li key={r.id} className="relative flex items-start gap-3 px-4 py-3">
            {i > 0 && <span aria-hidden="true" className={`${RULE} start-[3.75rem]`} />}
            <span
              aria-hidden="true"
              className="mt-px grid size-9 shrink-0 place-items-center rounded-xl bg-brand/[0.1] text-brand-ink"
            >
              <HugeiconsIcon
                icon={categoryIcon({ category: v.category })}
                className="size-[1.125rem]"
                strokeWidth={1.8}
              />
            </span>
            <span className="min-w-0 flex-1 pt-px">
              <span className="block truncate text-[0.875rem] font-semibold">
                <span className="sr-only">{t("selfService.form.row", { n: i + 1 })} · </span>
                {v.category}
              </span>
              {sub.length > 0 && (
                <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground">
                  {sub.join(" · ")}
                </span>
              )}
              {warningTexts(t, locale, warnings.get(r.id), v).map((w) => (
                <WarnNote key={w} className="mt-1">
                  {w}
                </WarnNote>
              ))}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5 pt-px">
              <span className="text-[0.9375rem] font-semibold tabular-nums">
                {money(amount, v.currency ?? "TRY", locale)}
              </span>
              <button type="button" className={edit} onClick={() => onEdit(r.id)}>
                {t("selfService.expense.edit")}
                <span className="sr-only"> · {t("selfService.form.row", { n: i + 1 })}</span>
              </button>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Gruplu listenin kutusu (masraf bilgileri). */
export function InfoGroup({ children }) {
  return <div className={GROUP}>{children}</div>
}

/** Gruplu listenin etiket · değer satırı (masraf bilgileri); ilk satırda çizgi yok. */
export function InfoRow({ label, first = false, children }) {
  return (
    <div className="relative flex min-h-11 items-center gap-4 px-4 py-2.5">
      {!first && <span aria-hidden="true" className={`${RULE} start-4`} />}
      <span className="shrink-0 text-[0.8125rem] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-end text-[0.875rem] font-medium">{children}</span>
    </div>
  )
}
