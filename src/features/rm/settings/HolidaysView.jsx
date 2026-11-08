import { useMemo, useState } from "react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarCheckIn01Icon from "@hugeicons/core-free-icons/CalendarCheckIn01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num, weekday } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"
import { ALL } from "./table"

const SELECT = "w-auto rounded-full data-[size=default]:h-9 pointer-coarse:data-[size=default]:h-11"

/** Tür rozeti: tatil tam gün, arife yarım gün. */
function TypeBadge({ eve }) {
  const { rt } = useRmText()
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-[0.6875rem] font-medium whitespace-nowrap",
        eve
          ? "bg-warning/14 text-warning-ink"
          : "bg-sky-500/[0.12] text-sky-700 dark:bg-sky-400/[0.16] dark:text-sky-300",
      )}
    >
      {eve ? rt("rm.set.h.eveHalf") : rt("rm.set.h.holiday")}
    </span>
  )
}

/**
 * Tatiller: TR tatili herkese, ülke tatili yalnız o ülkedeki projeye; arife yarım gün. Üstte
 * sıradaki tatil; geçmiş günler soluk.
 */
export function HolidaysView() {
  const { rt, locale } = useRmText()
  const { data, edit, openEditor, today } = useRm()
  const list = useMemo(() => data.st.holidays || [], [data.st.holidays])
  const names = new Map((data.st.lk?.countries || []).map((c) => [c.code, c.name]))
  const countries = [...new Set(list.map((h) => h.country || "TR"))].sort()
  const years = [
    ...new Set(list.map((h) => String(h.date || "").slice(0, 4)).filter(Boolean)),
  ].sort()
  const [country, setCountry] = useState("TR")
  const [year, setYear] = useState(
    () => years.find((y) => y === String(new Date().getFullYear())) ?? years[0] ?? ALL,
  )
  const shown = useMemo(
    () =>
      list
        .filter(
          (h) =>
            (country === ALL || (h.country || "TR") === country) &&
            (year === ALL || String(h.date).startsWith(year)),
        )
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [list, country, year],
  )
  const next = shown.find((h) => toDay(h.date) >= today)
  const cname = (c) => (names.get(c) ? `${names.get(c)} (${c})` : c)

  return (
    <RmCard
      icon={Calendar03Icon}
      tone="sky"
      title={rt("rm.set.holidays")}
      sub={rt("rm.set.holidaysSub", { n: shown.length })}
      action={
        edit
          ? {
              label: rt("rm.hol.add"),
              onClick: () =>
                openEditor({
                  kind: "holiday",
                  id: null,
                  country: country === ALL ? "TR" : country,
                }),
            }
          : null
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className={cn(SELECT, "min-w-[10rem]")} aria-label={rt("rm.set.country")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.set.allCountries")}</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {cname(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className={cn(SELECT, "min-w-[7rem]")} aria-label={rt("rm.set.year")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.set.allYears")}</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {next && (
        <p className="mb-3 flex items-center gap-2.5 rounded-2xl bg-sky-500/[0.08] px-4 py-2.5 text-sm dark:bg-sky-400/[0.1]">
          <HugeiconsIcon
            icon={CalendarCheckIn01Icon}
            className="size-4 shrink-0 text-sky-700 dark:text-sky-300"
            strokeWidth={1.8}
          />
          <span className="min-w-0">
            <span className="font-medium">{rt("rm.set.h.next")}</span>{" "}
            {rt("rm.set.h.nextLine", {
              name: next.name || rt("rm.set.h.holiday"),
              date: `${weekday(toDay(next.date), locale)} ${day(toDay(next.date), locale)}`,
              n: num(toDay(next.date) - today, locale),
            })}
          </span>
        </p>
      )}
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{rt("rm.set.h.none")}</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((h) => {
            const n = toDay(h.date)
            const past = n < today
            const name = h.name || rt("rm.set.h.holiday")
            return (
              <li
                key={h.id ?? `${h.date}${h.country}`}
                className={cn(
                  "flex min-h-12 items-center gap-3 border-t border-border/50 py-2 first:border-t-0",
                  past && "text-muted-foreground",
                )}
              >
                <span className="w-24 shrink-0 tabular-nums">
                  <span className="block text-sm">{day(n, locale, { year: true })}</span>
                  <span className="block text-xs text-muted-foreground">{weekday(n, locale)}</span>
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  {edit && h.id ? (
                    <button
                      type="button"
                      onClick={() => openEditor({ kind: "holiday", id: h.id })}
                      className="max-w-full truncate rounded text-start underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
                    >
                      {name}
                    </button>
                  ) : (
                    <span className="block truncate">{name}</span>
                  )}
                </span>
                <TypeBadge eve={h.type === "Arife"} />
                <span className="w-10 shrink-0 text-end text-xs font-medium text-foreground/70">
                  {h.country || "TR"}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </RmCard>
  )
}
