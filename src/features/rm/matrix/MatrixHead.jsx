import { dayToDate, isoWeek, yearMonth } from "@/lib/rm/engine/dates"
import { day, monthLabel } from "@/features/rm/lib/format"
import { bandsFor, monthKey, weekKey, yearKey } from "@/features/rm/lib/matrix"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"

const WD = new Map()
function weekdayShort(n, locale) {
  if (!WD.has(locale)) WD.set(locale, new Intl.DateTimeFormat(locale, { weekday: "short" }))
  return WD.get(locale).format(dayToDate(n))
}

const BAND =
  "h-7 border-b border-s border-border/50 bg-background px-2 text-center text-[0.6875rem] font-semibold tracking-[0.04em] text-foreground/75"

/** Sütunun alt başlığı: gün (haftanın günü + tarih), hafta (H43 + tarih) ya da ay. `dim`: ikinci
 * satır soluk (bugünün sütunu marka renginde; soluklaşırsa okunmaz). */
function Leaf({ c, zoom, locale, rt, dim }) {
  const soft = dim ? "opacity-70" : ""
  if (zoom === "day") {
    return (
      <span className="flex flex-col items-center leading-tight">
        <span className={cn("text-[0.6875rem] uppercase", soft)}>
          {weekdayShort(c.from, locale)}
        </span>
        <span className="tabular-nums">{dayToDate(c.from).getDate()}</span>
        {c.type === "Arife" && <span className="text-[0.6875rem] text-warning-ink">½</span>}
        {c.type === "Tatil" && <span className="sr-only">{rt("rm.matrix.holiday")}</span>}
      </span>
    )
  }
  if (zoom === "week") {
    return (
      <span className="flex flex-col items-center leading-tight">
        <span className="font-semibold">{rt("rm.matrix.week", { n: isoWeek(c.from) })}</span>
        <span className={cn("text-[0.6875rem] tabular-nums", soft)}>{day(c.from, locale)}</span>
      </span>
    )
  }
  const [y, m] = yearMonth(c.from)
  return <span className="font-semibold uppercase">{monthLabel(y, m, locale)}</span>
}

/**
 * Katlı başlık (HTML matrisinin dili): gün görünümünde Ay › Hafta › Gün, hafta görünümünde
 * Ay › Hafta, ay görünümünde Yıl › Ay. İlk sütun ve Σ bütün katları kaplar; bugünün sütunu
 * marka renginde ve altı çizili.
 */
export function MatrixHead({ cols, zoom, todayIdx, corner }) {
  const { rt, locale } = useRmText()
  const monthBands = bandsFor(cols, monthKey).map((b) => {
    const [y, m] = yearMonth(b.from)
    return { ...b, label: monthLabel(y, m, locale, { long: true }) }
  })
  const bands =
    zoom === "day"
      ? [
          monthBands,
          bandsFor(cols, weekKey).map((b) => ({
            ...b,
            label: `${rt("rm.matrix.week", { n: isoWeek(b.from) })} · ${day(b.from, locale)}`,
          })),
        ]
      : zoom === "week"
        ? [monthBands]
        : [bandsFor(cols, yearKey).map((b) => ({ ...b, label: b.key }))]
  const depth = bands.length + 1
  return (
    <thead className="sticky top-0 z-20 bg-background">
      {bands.map((row, r) => (
        <tr key={r}>
          {r === 0 && (
            <th
              scope="col"
              rowSpan={depth}
              className="sticky start-0 z-30 min-w-32 border-b border-e border-border/60 bg-background px-3 text-start align-bottom text-[0.6875rem] font-medium text-muted-foreground @[40rem]/rm:min-w-56"
            >
              <span className="block pb-2">{corner}</span>
            </th>
          )}
          {row.map((b) => (
            <th key={b.key} scope="colgroup" colSpan={b.span} className={BAND}>
              <span className="block truncate">{b.label}</span>
            </th>
          ))}
          {r === 0 && (
            <th
              scope="col"
              rowSpan={depth}
              className="sticky end-0 z-30 min-w-16 border-b border-s border-border/60 bg-background px-2 text-end align-bottom text-[0.6875rem] font-semibold text-muted-foreground"
            >
              <span className="block pb-2">{rt("rm.matrix.total")}</span>
            </th>
          )}
        </tr>
      ))}
      <tr>
        {cols.map((c, i) => (
          <th
            key={c.key}
            scope="col"
            data-col={i}
            aria-current={i === todayIdx ? "date" : undefined}
            className={cn(
              "h-11 min-w-11 border-b border-s border-border/50 px-1 text-xs font-medium",
              c.type === "Tatil" && "bg-foreground/[0.05]",
              i === todayIdx && "border-b-2 border-b-brand font-semibold text-brand",
            )}
          >
            <Leaf c={c} zoom={zoom} locale={locale} rt={rt} dim={i !== todayIdx} />
          </th>
        ))}
      </tr>
    </thead>
  )
}
