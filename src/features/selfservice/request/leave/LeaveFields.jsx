import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import CalendarCheckIn01Icon from "@hugeicons/core-free-icons/CalendarCheckIn01Icon"
import CalendarCheckOut01Icon from "@hugeicons/core-free-icons/CalendarCheckOut01Icon"
import { useLocale } from "@/hooks/useLocale"
import { optionLabel } from "@/lib/promptTemplates"
import { cn } from "@/lib/utils"
import { HeadPicker } from "../expense/head/HeadPicker"
import { FieldTile } from "../field/FieldTile"
import { fieldState } from "../field/fieldState"
import { IconTile } from "../field/IconTile"
import { leaveKindLook } from "../field/leaveKinds"
import { ERROR, capFirst, errorText } from "../formUi"
import { shortDay } from "./leaveText"

const ENDS = [
  { name: "start", icon: CalendarCheckIn01Icon },
  { name: "end", icon: CalendarCheckOut01Icon },
]

/**
 * İzin formunun üç alanı karo olarak: tür (kendi ikonu ve tonuyla; basınca ikonlu liste) ·
 * başlangıç · bitiş. Uç karoları takvimin hangi ucu seçtiğini gösterir (`active`, marka
 * çerçevesi); boş uç hafif kırmızı, dolu uçta ✓. Geniş sütunda üçü tek satırda.
 */
export function LeaveFields({ idBase, fields, values, errors, onKind, active, onActive }) {
  const { t, locale } = useLocale()
  const kindSlot = fields.kind.slot
  const options = useMemo(
    () =>
      kindSlot.options.map((k) => {
        const look = leaveKindLook(k)
        return {
          value: k,
          label: capFirst(optionLabel(t, kindSlot, k), locale),
          icon: <IconTile icon={look.icon} tone={look.tone} size="sm" />,
        }
      }),
    [t, locale, kindSlot],
  )
  const kindId = `${idBase}-kind`
  const kind = values.kind
  const look = leaveKindLook(kind)
  const label = (name) => capFirst(t(`myspace.slot.${name}`), locale)

  return (
    <div className="grid grid-cols-2 gap-3 @[36rem]/fields:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="col-span-2 min-w-0 @[36rem]/fields:col-span-1">
        <HeadPicker
          labelId={`${kindId}-label`}
          options={options}
          value={kind}
          onPick={onKind}
          className="w-[max(var(--radix-popover-trigger-width),16rem)]"
        >
          {(open) => (
            <FieldTile
              id={kindId}
              icon={look.icon}
              tone={look.tone}
              swap={kind}
              label={label("kind")}
              labelId={`${kindId}-label`}
              value={options.find((o) => o.value === kind)?.label}
              valueId={`${kindId}-value`}
              placeholder={t("selfService.form.choose")}
              state={fieldState({ filled: Boolean(kind), error: errors?.kind })}
              open={open}
              aria-labelledby={`${kindId}-label ${kindId}-value`}
              trailing={
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  aria-hidden="true"
                  strokeWidth={2}
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                    open && "rotate-180",
                  )}
                />
              }
            />
          )}
        </HeadPicker>
      </div>
      {ENDS.map(({ name, icon }) => {
        const id = `${idBase}-${name}`
        const err = errorText(t, fields[name].slot, errors?.[name])
        const value = values[name]
        const empty =
          name === "end" && values.start ? "selfService.leave.pickEnd" : "selfService.form.pickDate"
        return (
          <div key={name} className="min-w-0">
            <FieldTile
              id={id}
              icon={icon}
              label={label(name)}
              labelId={`${id}-label`}
              value={value ? shortDay(value, locale) : null}
              valueId={`${id}-value`}
              placeholder={t(empty)}
              state={fieldState({ filled: Boolean(value), required: true, error: err })}
              active={active === name}
              onClick={() => onActive(name)}
              aria-labelledby={`${id}-label ${id}-value`}
              aria-pressed={active === name}
              aria-invalid={Boolean(err)}
              aria-describedby={err ? `${id}-error` : undefined}
            />
            {err && (
              <p id={`${id}-error`} className={ERROR}>
                {err}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
