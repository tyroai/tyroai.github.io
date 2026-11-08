import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { RecordInfoList } from "@/components/record-window/RecordInfoList"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { localDayKey } from "@/lib/todo"
import { dueLabel } from "@/lib/todoInsights"
import { DueBody } from "../DuePicker"
import { ReminderBody, RepeatOptions } from "../TaskTiming"

const OPTS_STAMP = { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }

/**
 * Değer düğmesi + açılır: macOS'un açılır düğmesi gibi değer ve küçük ok. Boşken gri "Ekle".
 * Düğmenin adı etiketi de söyler ("Son tarih: Yarın") — `dt` ile bağı yok.
 */
function Pick({ label, value, disabled, width, children }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const text = value ?? t("todo.detail.add")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${text}`}
          className="td-pick"
          data-empty={value ? undefined : ""}
        >
          <span className="td-pick-text">{text}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className={width === "wide" ? "w-[17rem] gap-0 p-0" : "w-60 gap-0 p-1.5"}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Zamanlama satırları — etiket | değer: son tarih · hatırlatıcı · tekrar. Gövdeler satır menüsüyle
 * aynı (`DueBody`, `ReminderBody`, `RepeatOptions`): iki yüzey aynı kuralla yazar. Biten görevde
 * hatırlatıcı ve tekrar kapalı (önceki panelle aynı).
 */
export function TimingRows({ task, onChange }) {
  const { t, locale } = useLocale()
  const reminder = task.reminderAt ? new Date(task.reminderAt) : null
  const rows = [
    {
      key: "due",
      label: t("todo.detail.due"),
      value: (
        <Pick
          label={t("todo.detail.due")}
          value={task.dueKey ? dueLabel(task.dueKey, localDayKey(), t, locale) : null}
          width="wide"
        >
          {(close) => (
            <DueBody
              value={task.dueKey}
              onPick={(dueKey) => {
                onChange({ dueKey })
                close()
              }}
              onClear={() => {
                onChange({ dueKey: null })
                close()
              }}
            />
          )}
        </Pick>
      ),
    },
    {
      key: "reminder",
      label: t("todo.menu.reminder"),
      value: (
        <Pick
          label={t("todo.menu.reminder")}
          value={reminder ? getDateTimeFormat(locale, OPTS_STAMP).format(reminder) : null}
          disabled={task.done}
          width="wide"
        >
          {(close) => (
            <ReminderBody
              current={reminder}
              dueKey={task.dueKey}
              onSave={(d) => {
                onChange({ reminderAt: d.toISOString() })
                close()
              }}
              onClear={
                reminder
                  ? () => {
                      onChange({ reminderAt: null })
                      close()
                    }
                  : null
              }
            />
          )}
        </Pick>
      ),
    },
    {
      key: "repeat",
      label: t("todo.menu.repeat"),
      value: (
        <Pick
          label={t("todo.menu.repeat")}
          value={task.recurrence ? t(`todo.repeat.${task.recurrence}`) : null}
          disabled={task.done}
        >
          {(close) => (
            <RepeatOptions
              value={task.recurrence}
              hasDue={Boolean(task.dueKey)}
              onPick={(recurrence) => {
                onChange({ recurrence })
                close()
              }}
            />
          )}
        </Pick>
      ),
    },
  ]
  return <RecordInfoList rows={rows} />
}
