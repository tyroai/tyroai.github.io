import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"

// 1 Ocak 2024 Pazartesi: hafta içi kısa adları dilin kendi takviminden.
const MONDAY = Date.UTC(2024, 0, 1)

/** Hafta içi gün seçimi (Pzt–Cum); değer gün dizisi, 0 = Pazartesi. */
export function DayChips({ value, onChange, label, invalid = false }) {
  const { locale } = useRmText()
  const names = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
    return [0, 1, 2, 3, 4].map((i) => f.format(new Date(MONDAY + i * 864e5)))
  }, [locale])
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {names.map((n, i) => {
        const on = value.includes(i)
        return (
          <button
            key={n}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((d) => d !== i) : [...value, i].sort())}
            className={cn(
              "h-8 min-w-9 rounded-lg px-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:min-w-11",
              on
                ? "bg-foreground/[0.08] font-semibold text-foreground dark:bg-white/[0.12]"
                : "text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground",
              invalid && !value.length && "ring-1 ring-inset ring-danger/50",
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
