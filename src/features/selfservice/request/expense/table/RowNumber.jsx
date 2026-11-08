import { useLocale } from "@/hooks/useLocale"
import { useLineWarning } from "../history/lineWarningsContext"
import { warningTexts } from "../history/warningText"
import { NumberBadge } from "./NumberBadge"

// Dinlenen kalemin numarası sakin; yazılan kalemde (odak içinde ya da takvim açık) marka tonunda.
const REST =
  "text-muted-foreground group-focus-within/row:bg-brand/12 group-focus-within/row:text-brand-ink group-data-[active]/row:bg-brand/12 group-data-[active]/row:text-brand-ink"

/**
 * Kalemin numarası ve durumu (`NumberBadge`): eksiksiz kalemde yeşil ✓, gönderme denemesinden
 * sonra eksik kalemde kırmızı numara ve satırın başında kırmızı çubuk (yazılan satırda marka
 * çubuğu öne geçer, `grid.css`). Olası mükerrerde (ERP'de eşi ya da formda aynısı) köşede
 * sarı nokta. Durum yalnız renkle verilmez: görünmez metin ("Hazır" · "Eksik: kategori,
 * tutar" · uyarı) ekran okuyucuya, aynısı imlecin altında da söyler.
 */
export function RowNumber({ row, n, invalid, missing }) {
  const { t, locale } = useLocale()
  const ready = !missing.length
  const warns = warningTexts(t, locale, useLineWarning(row), row?.values)
  const status = [
    invalid
      ? t("selfService.form.rowInvalid")
      : ready
        ? t("selfService.expense.grid.rowReady")
        : t("selfService.expense.grid.rowMissing", {
            fields: missing.map((m) => t(`myspace.slot.${m}`)).join(", "),
          }),
    ...warns,
  ].join(" · ")
  return (
    <div
      className="flex h-10 items-center justify-center pointer-coarse:h-11"
      title={`${t("selfService.form.row", { n })} · ${status}`}
    >
      {invalid && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute start-0 top-3.5 h-6 w-[3px] rounded-full bg-danger pointer-coarse:top-4"
        />
      )}
      <NumberBadge
        n={n}
        state={invalid ? "error" : ready ? "done" : null}
        warn={warns.length > 0}
        rest={REST}
      />
      <span className="sr-only">{status}</span>
    </div>
  )
}
