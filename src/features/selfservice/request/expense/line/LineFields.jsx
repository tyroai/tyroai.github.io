import { useLocale } from "@/hooks/useLocale"
import { amountText } from "@/features/selfservice/lib/expenseLine"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { amountPlaceholder, asciiDigits } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { fieldState, isFilled } from "../../field/fieldState"
import { capFirst, errorText } from "../../formUi"
import { DateField } from "../../PickerFields"
import { SlotSelect } from "../../SlotSelect"
import { AMOUNT_HIDE, AmountShown } from "../AmountShown"
import { CategorySelect } from "../history/CategorySelect"
import { RowHint } from "../RowHint"
import { ReadMark } from "../receipts/readMarks"
import { ListCell } from "./ListCell"
import { enterNext, revealList } from "./lineFocus"
import { INPUT, RULE } from "./lineUi"
import "./lineList.css"

const SLOTS = PROMPT_TEMPLATES.expense.slots
// Açılan liste kaydırma alanının altında kalmasın (telefonda kalemin altı dar).
const REVEAL = revealList()
// Tutar: kalemin büyük sayısı (alan ve dinlenirken biçimli görünüşü aynı yazıyla).
const FIGURE = "text-[1rem] font-semibold tracking-[-0.01em] tabular-nums"

/**
 * Açık kalemin ana alanları — gruplu liste: Tarih · Tutar (kalemin büyük sayısı, yanında para
 * birimi; dinlenirken yerel biçimde, "1.234.567,89") · Kategori (en üstte "Son kullandıkların";
 * altında öneri, ileri tarih ya da olası mükerrer uyarısı) · Açıklama. Dar kartta alt alta, geniş
 * kartta iki sütun. Boş zorunlu alan (tutar, kategori) hafif kırmızı çerçeveli; hatalar gönderme
 * denemesinden sonra (`errors`). Enter sonraki alana geçer, formu göndermez.
 */
export function LineFields({ row, base, errors, onSet }) {
  const { t, locale } = useLocale()
  const v = row.values
  const field = (name) => {
    const id = `${base}-${name}`
    const error = errorText(t, SLOTS[name], errors?.[name])
    // Zorunlu boş alan hafif kırmızı çerçeveli (`lineList.css`); dolu alanda ✓ yok: kalemin
    // tamamlandığını numarasındaki ✓ söyler.
    const state = fieldState({ filled: isFilled(v[name]), required: true, error })
    return {
      need: state === "need" ? state : undefined,
      cell: {
        id,
        error,
        label: capFirst(t(`myspace.slot.${name}`), locale),
        mark: <ReadMark rowId={row.id} field={name} value={v[name]} />,
      },
      aria: {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${id}-error` : undefined,
      },
    }
  }
  const date = field("date")
  const amount = field("amount")
  const category = field("category")
  const note = field("note")
  const curId = `${base}-currency`
  const shown = amountText(v.amount, locale)
  const figure = shown && shown !== v.amount ? shown : null

  return (
    <div className={cn("xl-list grid grid-cols-1 border-t @[36rem]/line:grid-cols-2", RULE)}>
      <ListCell {...date.cell} start className="before:hidden">
        <DateField
          id={date.cell.id}
          labelId={`${date.cell.id}-label`}
          value={v.date}
          onPick={(d) => onSet("date", d)}
          error={date.cell.error}
          errorId={`${date.cell.id}-error`}
        />
      </ListCell>

      <ListCell {...amount.cell} side className="@[36rem]/line:before:hidden">
        <div className="relative min-w-0 flex-1" data-field={amount.need}>
          <input
            id={amount.cell.id}
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={v.amount ?? ""}
            placeholder={amountPlaceholder(locale)}
            onChange={(e) => onSet("amount", asciiDigits(e.target.value))}
            onKeyDown={enterNext}
            {...amount.aria}
            className={cn(INPUT, FIGURE, figure && AMOUNT_HIDE)}
          />
          <AmountShown text={figure} className={cn("no-ios-zoom px-3", FIGURE)} />
        </div>
        <span id={`${curId}-label`} className="sr-only">
          {capFirst(t("myspace.slot.currency"), locale)}
        </span>
        <div className="w-[5.25rem] shrink-0" {...REVEAL}>
          <SlotSelect
            id={curId}
            labelId={`${curId}-label`}
            label={capFirst(t("myspace.slot.currency"), locale)}
            name="currency"
            slot={SLOTS.currency}
            value={v.currency}
            onPick={(c) => onSet("currency", c)}
            align="end"
            panelWidth={160}
          />
        </div>
      </ListCell>

      <ListCell {...category.cell}>
        <div className="w-full min-w-0" data-field={category.need} {...REVEAL}>
          <CategorySelect
            id={category.cell.id}
            labelId={`${category.cell.id}-label`}
            label={category.cell.label}
            name="category"
            slot={SLOTS.category}
            value={v.category}
            onPick={(c) => onSet("category", c)}
            error={category.cell.error}
            errorId={`${category.cell.id}-error`}
            // Zorunlu boşun kırmızı tonlu zemininde de AA: soluk gri yerine biraz koyu.
            placeholder={<span className="text-foreground/70">{t("selfService.form.choose")}</span>}
            // Liste kalemin sağından sola açılır: dar ekranda taşmasın.
            panelWidth={320}
            align="end"
          />
        </div>
      </ListCell>
      {/* Kategorinin ipucu (öneri, ileri tarih ya da mükerrer); yoksa satır hiç yer tutmaz. */}
      <div className="px-4 pb-3 empty:hidden @[36rem]/line:order-last @[36rem]/line:col-span-2">
        <RowHint row={row} onPick={(c) => onSet("category", c)} focusId={category.cell.id} />
      </div>

      <ListCell {...note.cell} side>
        <input
          id={note.cell.id}
          type="text"
          enterKeyHint="done"
          autoComplete="off"
          maxLength={160}
          value={v.note ?? ""}
          placeholder={capFirst(t("myspace.template.optional"), locale)}
          onChange={(e) => onSet("note", e.target.value)}
          onKeyDown={enterNext}
          {...note.aria}
          className={INPUT}
        />
      </ListCell>
    </div>
  )
}
