import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { asciiDigits } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { CategorySelect } from "./expense/history/CategorySelect"
import { AmountControl } from "./expense/table/AmountControl"
import { fieldState, isFilled } from "./field/fieldState"
import { CONTROL, ERROR, capFirst, errorText } from "./formUi"
import { ReadMark } from "./expense/receipts/readMarks"
import { DateField } from "./PickerFields"
import { SlotSelect } from "./SlotSelect"

const SLOTS = PROMPT_TEMPLATES.expense.slots
// Izgarada durumu gösterilen zorunlu hücreler (tarihin varsayılanı hep dolu).
const NEED = new Set(["category", "amount"])
const SHORT_DATE = { day: "numeric", month: "short", year: "numeric" }
// Seçicinin açılır liste genişliği ve hizası: kategori adları uzun, lokasyon dar.
const PANEL = { category: [380, "start"], location: [190, "start"] }
// Yazı alanları: tutar ve kişi sayısı rakam, ötekiler serbest metin.
const TEXT = {
  note: { maxLength: 160, spellCheck: true },
  receipt: { maxLength: 40 },
  firm: { maxLength: 120, spellCheck: true },
  people: { maxLength: 3, numeric: true },
}

/**
 * Masraf kaleminin bir alanı — sütunun kimliğine göre: tarih, seçici (kategori, lokasyon), tutar
 * (+ para birimi) ya da yazı (açıklama, fiş no, firma, kişi sayısı). `variant`:
 * "grid" ızgara hücresi (dinlenirken çizgisiz, `grid.css`), "field" ayrıntı panelindeki form
 * alanı. Alanın adı görünmez etiket ("Kalem 3 · Tutar"); kimliği `${base}-${alan}` (odak ve hata
 * oraya). İsteğe bağlı seçicide varsayılan görünür (değer kişi seçince yazılır); kişi sayısının
 * varsayılanı ("1") yer tutucu — yazılan rakam onun yanına eklenmez. Izgarada boş zorunlu hücre
 * (`data-field="need"`: kategori, tutar; `field/fieldState`) hafif kırmızı çerçeveli, hatada net
 * kırmızı (`grid.css`). `start`: kalemde yazmaya başlanacak hücre (`data-row-start`);
 * `onPopover(açık)`: tarih takvimi açılıp kapanınca.
 */
export function ExpenseCell({
  id,
  row,
  base,
  rowName,
  values = row.values,
  errors,
  onSet,
  onPopover,
  start = false,
  variant = "grid",
}) {
  const { t, locale } = useLocale()
  const grid = variant === "grid"
  const slot = SLOTS[id]
  const err = errorText(t, slot, errors?.[id])
  const cellId = `${base}-${id}`
  // Izgarada zorunlu hücrenin durumu: boşsa hafif kırmızı çerçeve, hatada net kırmızı (`grid.css`).
  const state =
    grid && NEED.has(id)
      ? fieldState({ filled: isFilled(values[id]), required: true, error: err })
      : null
  const common = { id: cellId, labelId: `${cellId}-label`, error: err, errorId: `${cellId}-error` }
  const set = (value) => onSet(id, value)

  let control
  if (id === "amount") {
    control = (
      <AmountControl
        base={base}
        values={values}
        rowName={rowName}
        err={err}
        errors={errors}
        onSet={onSet}
      />
    )
  } else if (slot.type === "date") {
    control = (
      <DateControl common={common} value={values.date} onPick={set} onOpenChange={onPopover} />
    )
  } else if (slot.type === "choice") {
    const [width, align] = PANEL[id] ?? [220, "start"]
    // Kategoride en üstte kişinin "Son kullandıkların"ı.
    const Select = id === "category" ? CategorySelect : SlotSelect
    control = (
      <Select
        {...common}
        label={rowName}
        name={id}
        slot={slot}
        value={values[id] ?? slot.addDefault?.(values) ?? null}
        onPick={set}
        panelWidth={width}
        align={align}
        placeholder={
          grid && id === "category" ? (
            // Zorunlu boşun kırmızı tonlu zemininde de AA: soluk gri yerine biraz koyu.
            <span className="text-foreground/70">{t("selfService.expense.grid.todoCategory")}</span>
          ) : undefined
        }
      />
    )
  } else {
    const opt = TEXT[id] ?? TEXT.note
    control = (
      <input
        id={cellId}
        type="text"
        autoComplete="off"
        data-cell={id}
        value={values[id] ?? ""}
        onChange={(e) => set(opt.numeric ? asciiDigits(e.target.value) : e.target.value)}
        inputMode={opt.numeric ? "numeric" : undefined}
        maxLength={opt.maxLength}
        spellCheck={opt.spellCheck ?? false}
        // Izgarada boş hücre çizgisiz: soluk tire yazılacak yeri belli eder.
        placeholder={id === "people" ? "1" : grid ? "—" : undefined}
        aria-labelledby={`${cellId}-label`}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${cellId}-error` : undefined}
        className={cn(
          CONTROL,
          "no-ios-zoom placeholder:text-muted-foreground/70",
          opt.numeric && "tabular-nums",
          opt.numeric && grid && "text-end",
        )}
      />
    )
  }

  return (
    <div
      data-cell={id}
      data-row-start={start ? "" : undefined}
      data-field={state ?? undefined}
      // Uzun kategori adı kesilir; tamamı imlecin altında.
      title={grid && id === "category" ? (values.category ?? undefined) : undefined}
      className={cn("relative min-w-0 has-[[data-morph-open]]:z-30", grid && "xg-cell")}
    >
      <span id={`${cellId}-label`} className="sr-only">
        {rowName} · {capFirst(t(`myspace.slot.${id}`), locale)}
      </span>
      {control}
      {/* Fişten okunan değer: köşede değnek (değer değişince söner). */}
      <ReadMark
        rowId={row.id}
        field={id}
        value={values[id]}
        className="pointer-events-auto absolute -end-1 -top-1.5 z-10 ring-2 ring-card"
      />
      {err && (
        <p id={`${cellId}-error`} className={cn(ERROR, "px-1")}>
          {err}
        </p>
      )}
    </div>
  )
}

/** Tarih: takvim açıkken kalem "yazılan" kalır — takvim pencerenin dışında çizilir, odak oradadır. */
function DateControl({ common, value, onPick, onOpenChange }) {
  const [open, setOpen] = useState(false)
  const change = (next) => {
    setOpen(next)
    onOpenChange?.(next)
  }
  return (
    <DateField
      {...common}
      value={value}
      onPick={onPick}
      format={SHORT_DATE}
      open={open}
      onOpenChange={change}
    />
  )
}
