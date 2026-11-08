import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { amountPlaceholder, asciiDigits } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { CONTROL, ERROR, LABEL, capFirst, errorText } from "./formUi"
import { fieldState, isFilled } from "./field/fieldState"
import { StatusBadge } from "./field/StatusBadge"
import { DateField } from "./PickerFields"
import { SlotSelect } from "./SlotSelect"

/**
 * Şablon alanından form alanı — türüne göre: tarih (takvim), seçici (morph-select; uzun listede
 * aramalı), tutar (+ yanında para birimi seçicisi), yazı. Etiket şablonun alan adı (`myspace.slot.<ad>`); eklenebilir
 * alanın etiketinde kaldırma düğmesi. Durum (`field/fieldState`): dolu alanın etiketinde yeşil ✓, zorunlu
 * boş alanda hafif kırmızı çerçeve (`data-field`, `requestForm.css`).
 */
export function SlotField({
  tkey,
  idBase,
  field,
  values,
  onChange,
  error,
  onRemove,
  dateOpen,
  onDateOpen,
  className,
}) {
  const { t, locale } = useLocale()
  const { name, slot, unit } = field
  const id = `${idBase}-${name}`
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  const label = capFirst(t(`myspace.slot.${name}`), locale)
  const value = values[name]
  const set = (v) => onChange(name, v)
  const err = errorText(t, slot, error)
  const common = { id, labelId, error: err, errorId }
  const state = fieldState({ filled: isFilled(value), required: slot.required, error: err })

  let control
  if (slot.type === "date") {
    control = (
      <DateField
        {...common}
        value={value}
        min={values[slot.after]}
        onPick={set}
        open={dateOpen}
        onOpenChange={onDateOpen}
      />
    )
  } else if (slot.type === "choice") {
    control = (
      <SlotSelect {...common} label={label} name={name} slot={slot} value={value} onPick={set} />
    )
  } else {
    control = (
      <InputControl
        {...common}
        slot={slot}
        value={value}
        onChange={set}
        unit={unit && { name: unit, value: values[unit], onChange: (v) => onChange(unit, v) }}
        tkey={tkey}
        name={name}
      />
    )
  }

  return (
    <div className={className} data-field={state ?? undefined}>
      <div className={cn(LABEL, onRemove && "justify-between")}>
        <label id={labelId} htmlFor={id} className="flex min-w-0 items-center gap-1.5">
          {label}
          {slot.addable && !slot.required && (
            <span className="font-normal text-muted-foreground">
              {" · "}
              {t("myspace.template.optional")}
            </span>
          )}
          <StatusBadge state={state} className="static size-4 ring-0" />
        </label>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(name)}
            aria-label={t("myspace.template.remove", { label })}
            className="relative -my-1 grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
          >
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
      {control}
      {err && (
        <p id={errorId} className={ERROR}>
          {err}
        </p>
      )}
    </div>
  )
}

/** Tutar ya da yazı. Tutarın para birimi kutunun sonunda yerel seçici (telefonda sistem listesi). */
function InputControl({ id, labelId, slot, value, onChange, unit, error, errorId, tkey, name }) {
  const { t, locale } = useLocale()
  const amount = slot.type === "amount"
  const input = (
    <input
      id={id}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(amount ? asciiDigits(e.target.value) : e.target.value)}
      inputMode={amount ? "decimal" : undefined}
      autoComplete="off"
      spellCheck={!amount}
      maxLength={amount ? 24 : 160}
      // Kişi sayısı tam sayı: yer tutucu varsayılanı ("1"), tutar gibi "0,00" değil.
      placeholder={amount ? (name === "people" ? "1" : amountPlaceholder(locale)) : undefined}
      aria-labelledby={labelId}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn(
        CONTROL,
        "no-ios-zoom placeholder:text-muted-foreground/70",
        amount && "tabular-nums",
      )}
    />
  )
  if (!unit) return input
  const unitSlot = PROMPT_TEMPLATES[tkey].slots[unit.name]
  // Para birimi tutarın yanında kendi seçicisi: kısa liste, simgesiyle.
  return (
    <div className="flex min-w-0 gap-2">
      <div className="min-w-0 flex-1">{input}</div>
      <SlotSelect
        id={`${id}-${unit.name}`}
        label={capFirst(t(`myspace.slot.${unit.name}`), locale)}
        name={unit.name}
        slot={unitSlot}
        value={unit.value}
        onPick={unit.onChange}
        align="end"
        panelWidth={160}
        className="w-[6.75rem] shrink-0"
      />
    </div>
  )
}

/** Eklenmemiş isteğe bağlı alanlar: "+ Fiş no" gibi çipler; basınca alan varsayılanıyla açılır. */
export function AddableChips({ idBase, fields, values, onAdd }) {
  const { t, locale } = useLocale()
  const missing = fields.filter((f) => values[f.name] === undefined)
  if (!missing.length) return null
  return (
    <div
      role="group"
      aria-label={t("myspace.template.optionalTitle")}
      className="flex flex-wrap gap-1.5"
    >
      {missing.map((f) => (
        <button
          key={f.name}
          id={`${idBase}-add-${f.name}`}
          type="button"
          onClick={() => onAdd(f)}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-[0.75rem] font-medium text-muted-foreground transition hover:border-brand/45 hover:bg-brand/[0.05] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            aria-hidden="true"
            className="size-3"
            strokeWidth={2.2}
          />
          {capFirst(t(`myspace.slot.${f.name}`), locale)}
        </button>
      ))}
    </div>
  )
}
