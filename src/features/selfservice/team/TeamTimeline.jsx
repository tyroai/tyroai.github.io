import { useId, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { groupOf } from "@/lib/selfServiceTeam"
import { cn } from "@/lib/utils"
import { range } from "../kinds"
import { rowNav } from "./rowNav"
import { others, shortDay } from "./teamText"
import { TimelineNav } from "./TimelineNav"
import { Legend } from "./timelineParts"
import { cols, ROW } from "./columns"
import { GroupRow, Row } from "./timelineRows"

// Gün numaraları ancak 6 haftalık pencerede okunur; 3 ayda yalnız hafta başları.
const DAY_NUMBERS_UPTO = 42

/**
 * EKİP İZİN ÇİZELGESİ (geniş kap) — gezinilen dönem (varsayılan bu haftanın Pazartesi'sinden 6
 * hafta; ‹ › ile pencere boyu kayar, "Bugün" geri getirir, aralık 6 hafta · 3 ay:
 * `TimelineNav`), gün sütunları; her
 * satır bir kişi, izin aralıkları marka tonunda çubuk (bana bağlılarda tür adıyla; çalışılan
 * kayıtlar kesikli, saatlik kayıtlar nokta — yönetici ve ekip arkadaşında yalnız türsüz
 * "İzinde"); doğum günü ve iş yıl dönümü günün sütununda küçük rozet (`Marker`). İki bölüm varsa
 * bölüm satırlarıyla ayrılır. Hafta sonları soluk, bugünün sütunu vurgulu. Anlamı bir tablo: satır
 * başlığı kişi (basınca kişi bölmesi; ↑/↓ ile satırlar arası), hücresi izinlerin ve günlerin okunur
 * listesi; çubuk ve rozetler süs (`aria-hidden`), ayrıntı ipucunda.
 */
export function TeamTimeline({
  timeline,
  marks,
  window: win,
  onNav,
  onWeeks,
  groups,
  rows,
  photos,
  presence,
  onOpen,
  className,
}) {
  const { t, locale } = useLocale()
  const titleId = useId()
  const legendId = useId()
  const { days, weekStarts } = timeline
  const n = days.length
  const first = days[0].date
  const last = days[n - 1].date
  const span = range(first, last, locale)
  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows])
  const dayFmt = getDateTimeFormat(locale, { day: "numeric" })
  const split = (groups?.length ?? 0) > 1
  const full = !groups || groups.some((g) => g.id === "reports")
  const sizeOf = new Map((groups ?? []).map((g) => [g.id, others(g.rows)]))
  const dense = n > DAY_NUMBERS_UPTO
  // Göstergede yalnız pencerede işareti olan gün türleri.
  const kinds = ["birthday", "anniversary"].filter((kind) =>
    [...marks.values()].some((list) => list.some((o) => o.kind === kind && o.date <= last)),
  )
  // Satırlar bölüm sırasıyla gelir (`teamOverview`); bölüm değişince başlık satırı.
  const body = []
  let lastGroup = null
  for (const tr of timeline.rows) {
    const row = byKey.get(tr.key)
    if (!row) continue
    const group = row.group ?? groupOf(row)
    if (split && group !== lastGroup)
      body.push(<GroupRow key={`group-${group}`} id={group} count={sizeOf.get(group) ?? 0} />)
    lastGroup = group
    body.push(
      <Row
        key={tr.key}
        row={row}
        occasions={marks.get(row.key)}
        segments={tr.segments}
        n={n}
        first={first}
        last={last}
        photo={photos.get(row.person.address)}
        presence={presence.get(row.person.upn)}
        onOpen={onOpen}
      />,
    )
  }
  return (
    <section
      aria-labelledby={titleId}
      className={cn("overflow-hidden rounded-2xl border border-border/70", className)}
    >
      {/* `data-tl-*`: Kartlar düzeni başlığı sekmelerle aynı satıra alır (`team/teamCards.css`). */}
      <div
        data-tl-head=""
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pb-2 pt-2.5"
      >
        <h3
          id={titleId}
          data-tl-title=""
          className="flex items-center gap-1.5 text-[0.875rem] font-semibold"
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            aria-hidden="true"
            className="size-4 text-brand-ink"
            strokeWidth={1.9}
          />
          {t("selfService.team.timeline.title")}
          {/* Gezinince yeni aralık ekran okuyucuya da söylenir. */}
          <span aria-live="polite" className="font-normal tabular-nums text-muted-foreground">
            · {span}
          </span>
        </h3>
        <TimelineNav
          window={win}
          weeks={n / 7}
          onNav={onNav}
          onWeeks={onWeeks}
          className="ms-auto -me-2"
        />
      </div>
      <div
        role="table"
        aria-labelledby={titleId}
        aria-describedby={legendId}
        className="relative border-t border-border/60 [--ncol:9.5rem] @[60rem]/ss:[--ncol:12.5rem]"
      >
        {/* Gün sütunlarının zemini bir kez, bütün satırların altında: hafta sonu, bugün, hafta ayracı. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-0 start-[var(--ncol)] grid"
          style={cols(n)}
        >
          {days.map((d, i) => (
            <span
              key={i}
              className={cn(
                d.weekend && "bg-foreground/[0.045]",
                d.today && "bg-brand/[0.1]",
                i > 0 && d.date.getDay() === 1 && "border-s border-border/70",
              )}
            />
          ))}
        </div>
        <div role="rowgroup" className="relative">
          <div role="row" className={cn(ROW, "border-b border-border/60")}>
            <span
              role="columnheader"
              className="self-end px-3 pb-1.5 text-[0.6875rem] font-medium text-muted-foreground @[60rem]/ss:px-4"
            >
              {t("selfService.team.timeline.person")}
            </span>
            <span role="columnheader" className="min-w-0 pb-1 pt-1.5">
              <span className="sr-only">
                {t("selfService.team.timeline.leaves", { range: span })}
              </span>
              <span aria-hidden="true" className="grid gap-y-0.5" style={cols(n)}>
                {weekStarts.map((w, i) => (
                  <span
                    key={w.index}
                    className="row-start-1 truncate ps-1 text-[0.6875rem] font-semibold text-foreground/80"
                    style={{
                      gridColumn: `${w.index + 1} / ${(weekStarts[i + 1]?.index ?? n) + 1}`,
                    }}
                  >
                    {shortDay(w.date, locale)}
                  </span>
                ))}
                {days.map((d, i) => (
                  <span
                    key={i}
                    data-tl-day=""
                    className={cn(
                      "row-start-2 hidden text-center text-[0.6875rem] tabular-nums",
                      !dense && "@[56rem]/ss:block",
                      // Hafta sonu zemininde de AA: soluk gri değil, yazı renginin %70'i.
                      d.today ? "font-bold text-brand-ink" : "text-foreground/70",
                    )}
                    style={{ gridColumn: i + 1 }}
                  >
                    {dayFmt.format(d.date)}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>
        <div role="rowgroup" className="relative" onKeyDown={rowNav}>
          {body}
        </div>
      </div>
      {!timeline.rows.some((r) => r.segments.length) && (
        <p className="border-t border-border/60 px-4 py-2.5 text-[0.75rem] text-muted-foreground">
          {t(win.home ? "selfService.team.upcoming.empty" : "selfService.team.timeline.emptyronge")}
        </p>
      )}
      <Legend
        id={legendId}
        full={full}
        kinds={kinds}
        className="border-t border-border/60 px-4 py-2.5"
      />
    </section>
  )
}
