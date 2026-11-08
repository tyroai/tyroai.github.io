import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { useLocale } from "@/hooks/useLocale"
import { LINE_DETAILS, listText, missingFields } from "@/features/selfservice/lib/expenseLine"
import { formErrors } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { capFirst } from "../../formUi"
import { useLineWarning } from "../history/lineWarningsContext"
import { warningTexts } from "../history/warningText"
import { NumberBadge } from "../table/NumberBadge"
import { LineDetails } from "./LineDetails"
import { LineFields } from "./LineFields"
import { CARD_SHADOW, EDGE, TEXT_BTN } from "./lineUi"

/**
 * Kalemin canlı durumu, durum renkleriyle: kırmızı kısa "Tutar ve kategori kaldı" (gönderme
 * denendiyse kalın) ya da yeşil "Hazır".
 */
function Status({ missing, tried }) {
  const { t, locale } = useLocale()
  if (!missing.length) {
    // ✓ numaranın rozetinde: burada yalnız söz.
    return (
      <span className="mt-0.5 block text-[0.75rem] font-medium text-success-ink">
        {t("selfService.expense.line.ready")}
      </span>
    )
  }
  const fields = listText(
    locale,
    missing.map((name) => t(`myspace.slot.${name}`)),
  )
  return (
    <span
      className={cn(
        "mt-0.5 line-clamp-2 text-[0.75rem] leading-4 text-danger-ink",
        tried && "font-semibold",
      )}
    >
      {/* "Tutar ve kategori kaldı": alan adları sözlükte cümle içi küçük harfle. */}
      {capFirst(t("selfService.expense.line.missing", { fields }), locale)}
    </span>
  )
}

/**
 * Açık kalemin kartı: başlık (numara — tamamsa yeşil ✓, "Kalem n", canlı durum; Kopyala · Sil;
 * olası mükerrerde numaranın köşesinde sarı nokta, metni kategorinin altında), ana alanlar (gruplu liste) ve
 * "Ayrıntı". Başlığa basmak kalemi kapatır. Fiş kalemde değil: masrafın başlığına
 * eklenir. `errors`: gönderme denemesinden sonraki hatalar; `onRemove` tek kalemde yok;
 * `canCopy`: 20 kalem sınırı dolmadı.
 */
export function LineCard({ form, row, n, base, errors, canCopy, onCopy, onRemove, onCollapse }) {
  const { t, locale } = useLocale()
  const warns = warningTexts(t, locale, useLineWarning(row), row.values)
  const rows = form.expense
  const live = useMemo(() => formErrors("expense", row.values), [row.values])
  const missing = missingFields(live)
  const tried = Boolean(errors && Object.keys(errors).length)
  // Ayrıntıda hata varsa açık durur; kişi orada bir şey değiştirince açık kalır (hata gidince
  // kapanıp yazdığı alanı elinden almasın).
  const pinned = rows.details.has(row.id)
  const detailBad = LINE_DETAILS.some((name) => errors?.[name])
  const open = pinned || detailBad
  const set = (name, value) => rows.set(row.id, name, value)
  const setDetail = (name, value) => {
    if (!pinned) rows.showDetails(row.id, true)
    set(name, value)
  }

  return (
    <div
      data-xl-card=""
      role="group"
      aria-labelledby={`${base}-title`}
      className={cn(
        "@container/line relative rounded-[1.125rem] border bg-card",
        EDGE,
        CARD_SHADOW,
      )}
    >
      {/* Uzun dilde (Kopyala · Sil uzun) başlık dar kalırsa iki düğme birlikte alt satıra iner:
          durum sözü kesilmesin. */}
      <header className="flex flex-wrap items-center justify-end gap-x-1 py-2 pe-2 ps-2 shortest:py-1">
        <button
          type="button"
          data-line-head=""
          aria-expanded="true"
          onClick={onCollapse}
          className="group/head flex min-h-12 min-w-0 flex-1 basis-40 items-center gap-2.5 rounded-xl px-2 text-start transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <NumberBadge
            n={n}
            state={tried ? "error" : missing.length ? null : "done"}
            solid
            active
            warn={warns.length > 0}
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[0.9375rem] font-semibold tracking-[-0.01em]">
              <span id={`${base}-title`} className="whitespace-nowrap">
                {t("selfService.form.row", { n })}
              </span>
              <HugeiconsIcon
                icon={ArrowUp01Icon}
                aria-hidden="true"
                strokeWidth={2}
                className="size-3.5 text-muted-foreground transition-colors group-hover/head:text-foreground"
              />
            </span>
            <Status missing={missing} tried={tried} />
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={!canCopy}
            onClick={onCopy}
            aria-label={t("selfService.form.rowCopy", { n })}
            className={cn(
              TEXT_BTN,
              "text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" strokeWidth={1.8} />
            {t("selfService.expense.line.copy")}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={t("selfService.form.rowRemove", { n })}
              className={cn(
                TEXT_BTN,
                "text-foreground/70 hover:bg-danger/10 hover:text-danger-ink",
              )}
            >
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" strokeWidth={1.8} />
              {t("selfService.expense.line.remove")}
            </button>
          )}
        </div>
      </header>
      <LineFields row={row} base={base} errors={errors} onSet={set} />
      <LineDetails
        row={row}
        n={n}
        base={base}
        errors={errors}
        open={open}
        forced={open && !pinned}
        onToggle={() => rows.showDetails(row.id, !pinned || !open)}
        onSet={setDetail}
      />
    </div>
  )
}
