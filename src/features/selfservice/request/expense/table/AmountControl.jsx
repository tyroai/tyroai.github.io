import { useLocale } from "@/hooks/useLocale"
import { amountText } from "@/features/selfservice/lib/expenseLine"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { amountPlaceholder, asciiDigits } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { CONTROL, capFirst, errorText } from "../../formUi"
import { SlotSelect } from "../../SlotSelect"
import { AMOUNT_HIDE, AmountShown } from "../AmountShown"

const CURRENCY = PROMPT_TEMPLATES.expense.slots.currency
// Kalemin büyük sayısı: alan ve dinlenirken görünüşü aynı yazıyla.
const FIGURE = "text-[0.9375rem] font-semibold tabular-nums tracking-[-0.01em]"
// Dokunmatikte yazı 16 px (`no-ios-zoom`): iç boşluk daralır, sekiz haneli tutar sütuna sığar
// (para birimi kutusu daralmaz: "TRY" kesilirdi).
const PAD = "px-3 pointer-coarse:px-2"

/**
 * Izgaranın tutar hücresi: kalemin büyük sayısı sağa yaslı, para birimi yanında sessiz ek.
 * Dinlenirken tutar yerel biçimde ("1.234.567,89", `AmountShown`; değer yazıldığı gibi kalır).
 * Boşken yer tutucu ("0,00") ve hücrenin hafif kırmızı çerçevesi (`ExpenseCell`, `grid.css`).
 * Alanın kimliği `${base}-amount`, para biriminin `${base}-currency`.
 */
export function AmountControl({ base, values, rowName, err, errors, onSet }) {
  const { t, locale } = useLocale()
  const cellId = `${base}-amount`
  const curId = `${base}-currency`
  const raw = values.amount ?? ""
  const shown = amountText(raw, locale)
  const figure = shown && shown !== raw ? shown : null
  return (
    <div className="flex min-w-0 gap-1">
      <div className="relative min-w-0 flex-1">
        <input
          id={cellId}
          type="text"
          autoComplete="off"
          data-cell="amount"
          value={raw}
          onChange={(e) => onSet("amount", asciiDigits(e.target.value))}
          inputMode="decimal"
          maxLength={24}
          placeholder={amountPlaceholder(locale)}
          aria-labelledby={`${cellId}-label`}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${cellId}-error` : undefined}
          className={cn(
            CONTROL,
            PAD,
            FIGURE,
            "no-ios-zoom text-end placeholder:font-normal placeholder:text-muted-foreground/60",
            figure && AMOUNT_HIDE,
          )}
        />
        <AmountShown
          text={figure}
          className={cn(PAD, FIGURE, "no-ios-zoom border border-transparent")}
        />
      </div>
      <div data-cell="currency" className="w-[4.75rem] shrink-0">
        <SlotSelect
          id={curId}
          labelId={`${curId}-label`}
          label={rowName}
          name="currency"
          slot={CURRENCY}
          value={values.currency ?? CURRENCY.addDefault?.(values) ?? null}
          onPick={(value) => onSet("currency", value)}
          panelWidth={160}
          align="end"
          error={errorText(t, CURRENCY, errors?.currency)}
          errorId={`${curId}-error`}
        />
        <span id={`${curId}-label`} className="sr-only">
          {rowName} · {capFirst(t("myspace.slot.currency"), locale)}
        </span>
      </div>
    </div>
  )
}
