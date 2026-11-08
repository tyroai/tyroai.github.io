import { useState } from "react"
import { CalendarMonthGrid } from "@/components/common/CalendarMonthGrid"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { localDayKey } from "@/lib/todo"
import { keyToDate } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { longDate } from "./horizonFormat"

const MAX_TITLE = 255

/**
 * Yeni hedef: ad, tarih (ay ızgarası; geçmiş gün seçilmez) ve — birden çok liste izleniyorsa —
 * hangi listeye. To Do'ya o günün tarihli görevi olarak yazılır, kartta hemen görünür.
 */
export default function HorizonAdd({ horizon, onDone }) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const today = localDayKey()
  const [title, setTitle] = useState("")
  const [dueKey, setDueKey] = useState(null)
  const [month, setMonth] = useState(() => {
    const d = keyToDate(today)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [listId, setListId] = useState(horizon.selected[0]?.id ?? null)
  const ready = title.trim() && dueKey && listId

  function submit(e) {
    e.preventDefault()
    if (!ready) return
    if (horizon.add({ title, dueKey, listId })) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3 pt-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
        placeholder={t("widgets.horizon.addPlaceholder")}
        aria-label={t("widgets.horizon.addName")}
        // Pencere bu alan için açıldı; telefonda klavye çekmeceyi kaplamasın diye kendiliğinden açılmaz.
        autoFocus={!mobile}
        className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-[0.875rem] outline-none placeholder:text-muted-foreground focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/25 pointer-coarse:h-11"
      />
      <div className="rounded-2xl border border-border/70 px-1 pt-1 pb-0.5">
        <CalendarMonthGrid
          picker
          roomy={mobile}
          visibleMonth={month}
          onPrev={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNext={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          selectedDay={dueKey ? keyToDate(dueKey) : null}
          onSelectDay={(d) => setDueKey(localDayKey(d))}
          minDay={keyToDate(today)}
        />
      </div>
      {horizon.selected.length > 1 && (
        <div
          role="radiogroup"
          aria-label={t("widgets.horizon.addList")}
          className="flex flex-wrap gap-1.5"
        >
          {horizon.selected.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={listId === l.id}
              onClick={() => setListId(l.id)}
              className={cn(
                "inline-flex h-8 max-w-full items-center rounded-full border px-3 text-[0.75rem] transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
                listId === l.id
                  ? "border-brand/40 bg-brand/[0.08] font-semibold text-brand-ink"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="truncate">{l.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[0.75rem] text-muted-foreground [&::first-letter]:uppercase">
          {dueKey ? longDate(dueKey, locale) : t("widgets.horizon.addPickDate")}
        </span>
        <button
          type="submit"
          disabled={!ready}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-brand-solid px-4 text-[0.8125rem] font-semibold text-brand-on-brand transition outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 pointer-coarse:h-11"
        >
          {t("widgets.horizon.addSubmit")}
        </button>
      </div>
    </form>
  )
}
