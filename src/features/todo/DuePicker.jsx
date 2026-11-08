import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { CalendarMonthGrid } from "@/components/common/CalendarMonthGrid"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { localDayKey } from "@/lib/todo"
import { addDays, dueLabel, endOfWeekKey, keyToDate } from "@/lib/todoInsights"
import { FIRST_DAY } from "@/lib/weekStart"
import { cn } from "@/lib/utils"

/**
 * Son tarih seçici — To Do'nun kendi menüsü: Bugün · Yarın · Gelecek hafta ·
 * Tarih seç · Kaldır.
 *
 * ⚠️ **IZGARA AYNI BİLEŞEN** (`CalendarMonthGrid`in seçici kipi — Akışım'ın
 * "İzin iste" şablonu da onu kullanıyor). İkinci bir takvim, aynı ayı iki
 * farklı hafta başıyla çizmek demekti.
 *
 * ⚠️ **"GELECEK HAFTA" = GELECEK HAFTANIN İLK GÜNÜ**, "bugün + 7" DEĞİL — To
 * Do'nun anlamı bu ve hafta başı DİLİN kararı (`FIRST_DAY`).
 */
const OPTS_WEEKDAY = { weekday: "short" }

function QuickRow({ label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] outline-none transition hover:bg-accent focus-visible:bg-accent pointer-coarse:min-h-11"
    >
      <span>{label}</span>
      {hint && <span className="text-[0.71875rem] text-muted-foreground">{hint}</span>}
    </button>
  )
}

/** Açılır içeriğin gövdesi — ayrı bileşen: her açılış taze bir ayla başlasın. */
export function DueBody({ value, onPick, onClear }) {
  const { t, locale } = useLocale()
  const today = localDayKey()
  const [grid, setGrid] = useState(false)
  const [month, setMonth] = useState(() => keyToDate(value ?? today))
  const firstDay = FIRST_DAY[locale] ?? 1
  const nextWeek = addDays(endOfWeekKey(today, firstDay), 1)
  const fmt = getDateTimeFormat(locale, OPTS_WEEKDAY)

  if (grid) {
    return (
      <CalendarMonthGrid
        visibleMonth={month}
        onPrev={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        onNext={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        selectedDay={value ? keyToDate(value) : null}
        onSelectDay={(d) => onPick(localDayKey(d))}
        picker
      />
    )
  }
  return (
    <div className="p-1.5">
      <QuickRow
        label={t("todo.due.today")}
        hint={fmt.format(keyToDate(today))}
        onClick={() => onPick(today)}
      />
      <QuickRow
        label={t("todo.due.tomorrow")}
        hint={fmt.format(keyToDate(addDays(today, 1)))}
        onClick={() => onPick(addDays(today, 1))}
      />
      <QuickRow
        label={t("todo.due.nextWeek")}
        hint={fmt.format(keyToDate(nextWeek))}
        onClick={() => onPick(nextWeek)}
      />
      <div className="my-1 h-px bg-border" />
      <button
        type="button"
        onClick={() => setGrid(true)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] outline-none transition hover:bg-accent focus-visible:bg-accent pointer-coarse:min-h-11"
      >
        {t("todo.due.pick")}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-3.5 text-muted-foreground"
          strokeWidth={2}
        />
      </button>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] text-destructive outline-none transition hover:bg-destructive/10 focus-visible:bg-destructive/10 pointer-coarse:min-h-11"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
          {t("todo.due.remove")}
        </button>
      )}
    </div>
  )
}

/**
 * Ekleme satırının hapı + açılır. Ayrıntı paneli yalnız gövdeyi (`DueBody`) kendi değer
 * düğmesiyle açar (`detail/TimingRows.jsx`).
 */
export function DuePicker({ value, onChange, className }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const today = localDayKey()
  const label = dueLabel(value, today, t, locale)

  const pick = (key) => {
    onChange(key)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={value ? `${t("todo.detail.due")}: ${label}` : t("todo.due.set")}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[0.75rem] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/30 pointer-coarse:h-11",
            value
              ? "border-brand/30 bg-brand/[0.08] font-medium text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            className,
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={1.9} />
          {value ? (
            label
          ) : (
            <span className="hidden @[30rem]/board:inline">{t("todo.due.set")}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={t("todo.detail.due")}
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="w-[17rem] gap-0 p-0"
      >
        <DueBody value={value} onPick={pick} onClear={() => pick(null)} />
      </PopoverContent>
    </Popover>
  )
}
