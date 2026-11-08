import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { FieldTile } from "../field/FieldTile"
import { fieldState } from "../field/fieldState"
import { ERROR } from "../formUi"
import { DateField } from "../PickerFields"
import { DelegatePicker } from "./DelegatePicker"

const DATE = { weekday: "short", day: "numeric", month: "short", year: "numeric" }

function ErrorText({ id, text }) {
  if (!text) return null
  return (
    <p id={`${id}-error`} className={ERROR}>
      {text}
    </p>
  )
}

/**
 * Temsilcinin üç alanı, talep formunun karolarıyla: kişi (`DelegatePicker`), başlangıç ve bitiş
 * (takvimli karolar; dar alanda alt alta). Mor ton temsilcinin rengi. `form`: `useDelegateForm`.
 */
export function DelegateFields({ idBase, form, query = "" }) {
  const { t, locale } = useLocale()
  const fmt = getDateTimeFormat(locale, DATE)
  const dateTile = (key, value, onPick, extra = {}) => {
    const id = `${idBase}-${key}`
    const err = form.errors[key]
    return (
      <div className="min-w-0">
        <DateField
          id={id}
          labelId={`${id}-label`}
          value={value}
          onPick={onPick}
          {...extra}
          trigger={(open) => (
            <FieldTile
              id={id}
              icon={Calendar03Icon}
              tone="violet"
              label={t(`selfService.field.${key}`)}
              labelId={`${id}-label`}
              value={value ? fmt.format(value) : ""}
              valueId={`${id}-value`}
              placeholder={t("selfService.form.pickDate")}
              state={fieldState({ filled: Boolean(value), required: true, error: err })}
              open={open}
              aria-labelledby={`${id}-label ${id}-value`}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${id}-error` : undefined}
            />
          )}
        />
        <ErrorText id={id} text={err} />
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div>
        <DelegatePicker
          id={`${idBase}-who`}
          value={form.person}
          onChange={form.setPerson}
          initialQuery={query}
          state={
            form.errors.person
              ? "error"
              : fieldState({ filled: Boolean(form.person), required: true })
          }
          describedBy={form.errors.person ? `${idBase}-who-error` : undefined}
        />
        <ErrorText id={`${idBase}-who`} text={form.errors.person} />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {dateTile("start", form.start, form.setStart)}
        {dateTile("end", form.end, form.setEnd, {
          min: form.start ?? undefined,
          open: form.endOpen,
          onOpenChange: form.setEndOpen,
        })}
      </div>
    </div>
  )
}
