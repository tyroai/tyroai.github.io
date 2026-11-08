import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { FieldTile } from "@/features/selfservice/request/field/FieldTile"
import { DueBody } from "@/features/todo/DuePicker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { keyToDay } from "@/features/calendar/lib/range"
import { dayFull } from "../format"

/**
 * Son tarih alanı: karo To-Do'nun kendi tarih menüsünü açar (`DueBody`: Bugün · Yarın · Gelecek hafta ·
 * Tarih seç · Tarihi kaldır); tarih doluyken karonun ucunda tek dokunuşluk kaldır düğmesi de var.
 * Düğme karonun içinde değil yanında (iç içe düğme olmaz). `value`: "YYYY-AA-GG" ya da null.
 */
export function DueField({ value, onChange }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const pick = (key) => {
    onChange(key)
    setOpen(false)
  }
  return (
    <div className="cal-task-due" data-set={value ? "" : undefined}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FieldTile
            icon={Calendar03Icon}
            label={t("todo.detail.due")}
            value={value ? dayFull(keyToDay(value), locale) : null}
            placeholder={t("todo.due.set")}
            open={open}
            aria-haspopup="dialog"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="w-[17rem] gap-0 p-0"
        >
          <DueBody value={value} onPick={pick} onClear={() => pick(null)} />
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          className="cal-task-x cal-task-clear"
          aria-label={t("todo.due.remove")}
          title={t("todo.due.remove")}
          onClick={() => onChange(null)}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            className="cal-ic"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  )
}
