import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { CalendarMonthGrid } from "@/components/common/CalendarMonthGrid"
import { useLocale } from "@/hooks/useLocale"
import { localDayKey } from "@/lib/todo"
import { keyToDate } from "@/lib/todoInsights"

/**
 * Hatırlatıcı ve tekrar seçicilerinin gövdeleri — ayrıntı paneli (`TodoDetail`) ve satır
 * menüsü (`TaskMenu`) aynı gövdeyi kullanır; iki yüzey aynı kuralla yazsın.
 */

const REPEATS = ["daily", "weekdays", "weekly", "monthly", "yearly"]

export function ReminderBody({ current, dueKey, onSave, onClear }) {
  const { t } = useLocale()
  const startKey = current ? localDayKey(current) : (dueKey ?? localDayKey())
  const [day, setDay] = useState(() => keyToDate(startKey))
  const [month, setMonth] = useState(() => keyToDate(startKey))
  const [time, setTime] = useState(() =>
    current
      ? `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`
      : "09:00",
  )
  function save() {
    const [h, m] = time.split(":").map(Number)
    const at = new Date(day)
    at.setHours(h || 0, m || 0, 0, 0)
    onSave(at)
  }
  return (
    <div>
      <CalendarMonthGrid
        visibleMonth={month}
        onPrev={() => setMonth((x) => new Date(x.getFullYear(), x.getMonth() - 1, 1))}
        onNext={() => setMonth((x) => new Date(x.getFullYear(), x.getMonth() + 1, 1))}
        selectedDay={day}
        onSelectDay={setDay}
        picker
        minDay={new Date()}
      />
      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[0.75rem] text-muted-foreground">
          {t("todo.reminder.time")}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="no-ios-zoom h-8 rounded-lg border border-border bg-background px-2 text-[0.8125rem] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="h-8 rounded-full bg-brand-fill-deep px-3 text-[0.75rem] font-semibold text-brand-on-brand"
        >
          {t("todo.reminder.save")}
        </button>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-[0.8125rem] text-destructive transition hover:bg-destructive/10"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
          {t("todo.reminder.remove")}
        </button>
      )}
    </div>
  )
}

/** Tekrar seçenekleri; son tarih yoksa önce tarih istenir (To Do'nun kuralı). */
export function RepeatOptions({ value, hasDue, onPick }) {
  const { t } = useLocale()
  if (!hasDue) {
    return (
      <p className="px-2.5 py-2 text-[0.75rem] leading-snug text-muted-foreground">
        {t("todo.repeat.needsDue")}
      </p>
    )
  }
  return (
    <>
      {REPEATS.map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onPick(k)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.8125rem] outline-none transition hover:bg-accent focus-visible:bg-accent pointer-coarse:min-h-11"
        >
          {t(`todo.repeat.${k}`)}
          {value === k && (
            <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-brand" strokeWidth={2.2} />
          )}
        </button>
      ))}
      {value && (
        <button
          type="button"
          onClick={() => onPick(null)}
          className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-2.5 py-2 text-left text-[0.8125rem] text-destructive transition hover:bg-destructive/10 pointer-coarse:min-h-11"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
          {t("todo.repeat.remove")}
        </button>
      )}
    </>
  )
}
