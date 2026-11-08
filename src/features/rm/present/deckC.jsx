import { day, monthLabel, num, pct } from "@/features/rm/lib/format"
import { yearMonth } from "@/lib/rm/engine/dates"
import { level } from "@/lib/rm/metrics"
import { cn } from "@/lib/utils"
import { ColorDot } from "../common/bits"
import { Frame, Label } from "./kit"

const FILL = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-foreground/20" }

/** Proje satırı: renk, kod, ad (en çok iki satır, kesilmez), tarih. */
function ProjectLine({ r, locale, date }) {
  return (
    <li className="flex items-center gap-[1.2cqw] border-b border-border/60 py-[0.85cqw] text-[1.35cqw] last:border-0">
      <ColorDot color={r.color} className="size-[1cqw]" />
      <span className="w-[5.5cqw] shrink-0 font-semibold text-foreground/70">{r.code}</span>
      <span className="line-clamp-2 min-w-0 flex-1 leading-snug">{r.name}</span>
      <span className="w-[6.5cqw] shrink-0 text-end tabular-nums text-muted-foreground">
        {day(r[date], locale)}
      </span>
    </li>
  )
}

/** Yaklaşanlar: 60 günde başlayan ve 30 günde biten projeler. */
export function UpcomingSlide({ ctx, foot }) {
  const { deck, rt, locale } = ctx
  // Yedi satır: iki satırlık adlarla da altlığa değmez.
  const col = (title, list, date) => (
    <div className="min-w-0">
      <Label aside={list.length}>{title}</Label>
      <ul>
        {list.slice(0, 7).map((r) => (
          <ProjectLine key={r.id} r={r} locale={locale} date={date} />
        ))}
      </ul>
      {list.length > 7 && (
        <p className="mt-[0.6cqw] text-[1.05cqw] text-muted-foreground">
          {rt("rm.deck.more", { n: list.length - 7 })}
        </p>
      )}
    </div>
  )
  return (
    <Frame eyebrow={rt("rm.present.s5.eyebrow")} title={rt("rm.present.s5.title")} foot={foot}>
      <div className="grid h-full grid-cols-2 gap-[3cqw] overflow-hidden">
        {col(rt("rm.deck.up.starting"), deck.starting, "start")}
        {col(rt("rm.deck.up.ending"), deck.ending, "end")}
      </div>
    </Frame>
  )
}

/** Zaman çizelgesi: en büyük projeler, ay çizgileri ve bugün işareti. */
export function TimelineSlide({ ctx, foot }) {
  const { ov, rt, locale, today } = ctx
  const open = ov.rows
    .filter((r) => r.phase !== "done" && r.start != null && r.end != null)
    .sort((a, b) => b.hours - a.hours)
  const shown = open.slice(0, 13).sort((a, b) => a.start - b.start || a.end - b.end)
  if (!shown.length) {
    return (
      <Frame eyebrow={rt("rm.present.s4.eyebrow")} title={rt("rm.deck.t.timeline")} foot={foot}>
        <p className="text-[1.6cqw] text-muted-foreground">{rt("rm.deck.busy.empty")}</p>
      </Frame>
    )
  }
  const a = Math.min(...shown.map((r) => r.start))
  const b = Math.max(...shown.map((r) => r.end))
  const span = Math.max(1, b - a)
  const pos = (n) => `${((n - a) / span) * 100}%`
  // Ay başları (çizgi + etiket); çok sıksa her ikinci ay.
  const ticks = []
  let [y, m] = yearMonth(a)
  for (let g = 0; g < 40; g++) {
    m++
    if (m > 11) {
      m = 0
      y++
    }
    const n = Math.round(Date.UTC(y, m, 1) / 864e5)
    if (n > b) break
    ticks.push({ n, y, m })
  }
  const step = ticks.length > 10 ? 2 : 1
  return (
    <Frame
      eyebrow={rt("rm.present.s4.eyebrow")}
      title={rt("rm.present.s4.title", {
        from: day(a, locale),
        to: day(b, locale, { year: true }),
      })}
      sub={
        open.length > shown.length
          ? rt("rm.present.s4.more", { n: open.length - shown.length })
          : null
      }
      foot={foot}
    >
      {/* Ad soldaki sütunda (kod + ad): kısa çubukta kesilmez; çubuk yalnız takvimi gösterir. */}
      <div className="relative grid h-full grid-cols-[19cqw_1fr] grid-rows-[auto_1fr] gap-x-[1.2cqw]">
        <div className="relative col-start-2 row-start-1 h-[2cqw]">
          {ticks.map((t, i) =>
            i % step ? null : (
              <span
                key={t.n}
                className="absolute -translate-x-1/2 text-[0.9cqw] uppercase tracking-[0.06em] text-muted-foreground rtl:translate-x-1/2"
                style={{ insetInlineStart: pos(t.n) }}
              >
                {monthLabel(t.y, t.m, locale)}
              </span>
            ),
          )}
        </div>
        <ul className="col-span-2 col-start-1 row-start-2 grid grid-cols-subgrid content-start gap-y-[0.5cqw]">
          {shown.map((r) => (
            <li key={r.id} className="col-span-2 grid grid-cols-subgrid items-center text-[1.1cqw]">
              <span className="flex min-w-0 items-baseline gap-[0.7cqw]">
                <b className="shrink-0 font-semibold text-foreground/70">{r.code}</b>
                <span className="truncate text-foreground/85">{r.name}</span>
              </span>
              <span className="relative h-[1.9cqw] rounded-full bg-foreground/[0.04]">
                {ticks.map((t) => (
                  <span
                    key={t.n}
                    aria-hidden="true"
                    className="absolute inset-y-[-0.25cqw] w-px bg-border/70"
                    style={{ insetInlineStart: pos(t.n) }}
                  />
                ))}
                <span
                  className="absolute inset-y-[0.25cqw] rounded-full"
                  style={{
                    insetInlineStart: pos(r.start),
                    width: `max(1.5cqw, ${((r.end - r.start) / span) * 100}%)`,
                    background: `color-mix(in oklch, ${r.color || "var(--color-brand)"} 70%, transparent)`,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
        {/* Bugün çizgisi ızgaranın dışında: hücre kaplarsa satırlar yer değiştirir. */}
        {today >= a && today <= b && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-[20.2cqw] end-0"
          >
            <span
              className="absolute inset-y-0 w-[0.2cqw] bg-danger/70"
              style={{ insetInlineStart: pos(today) }}
            >
              <span className="absolute -top-[0.2cqw] end-[0.5cqw] whitespace-nowrap rounded-full bg-danger px-[0.6cqw] text-[0.85cqw] font-semibold text-white">
                {rt("rm.deck.tl.today")}
              </span>
            </span>
          </span>
        )}
      </div>
    </Frame>
  )
}

/** Kapasite öngörüsü: aylık kapasite ve atanan saat, boş/eksik gün; ekiplerin ilk boşluğu. */
export function ForecastSlide({ ctx, foot }) {
  const { deck, rt, locale, periodLabel } = ctx
  const months = deck.forecast
  const max = Math.max(1, ...months.map((m) => Math.max(m.cap, m.pj)))
  const rooms = [...deck.rooms].sort(
    (p, q) => (p.room ? p.room.from : Infinity) - (q.room ? q.room.from : Infinity),
  )
  return (
    <Frame
      eyebrow={rt("rm.deck.fc.eyebrow")}
      title={rt("rm.deck.fc.title", { period: periodLabel })}
      sub={rt("rm.deck.fc.sub")}
      foot={foot}
    >
      {/* Satır sınırlı: grafik altlığa taşmaz. */}
      <div className="grid h-full grid-cols-[1.5fr_1fr] grid-rows-[minmax(0,1fr)] gap-[3cqw]">
        <ul
          className="grid h-full min-h-0 items-end gap-[0.8cqw] pb-[0.4cqw]"
          style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
        >
          {months.map((m) => (
            <li
              key={m.key}
              className="flex h-full min-w-0 flex-col items-center justify-end gap-[0.6cqw]"
            >
              <span
                className={cn(
                  "text-[1cqw] tabular-nums",
                  level(m.x) === "over" ? "font-semibold text-danger-ink" : "text-muted-foreground",
                )}
              >
                {pct(m.x, locale)}
              </span>
              <span className="relative w-full max-w-[5cqw] flex-1">
                <span
                  className="absolute inset-x-0 bottom-0 rounded-[0.6cqw] bg-foreground/[0.07]"
                  style={{ height: `${(m.cap / max) * 100}%` }}
                />
                <span
                  className={cn(
                    "absolute inset-x-[0.6cqw] bottom-0 rounded-[0.5cqw]",
                    FILL[level(m.x)],
                  )}
                  style={{ height: `${(m.pj / max) * 100}%` }}
                />
              </span>
              <span className="text-[0.9cqw] uppercase tracking-[0.06em] text-muted-foreground">
                {monthLabel(m.y, m.m, locale)}
              </span>
              <span
                className={cn(
                  "text-[0.95cqw] font-semibold tabular-nums",
                  m.free >= 0 ? "text-success-ink" : "text-danger-ink",
                )}
              >
                {m.free >= 0 ? "+" : "−"}
                {num(Math.abs(m.free), locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="min-w-0">
          <Label>{rt("rm.deck.fc.rooms")}</Label>
          <ul className="grid gap-[0.4cqw]">
            {rooms.slice(0, 9).map((t) => (
              <li
                key={t.team}
                className="flex items-center justify-between gap-[1cqw] rounded-[0.9cqw] bg-foreground/[0.035] px-[1.2cqw] py-[0.5cqw] text-[1.15cqw] dark:bg-white/[0.05]"
              >
                <span className="truncate font-medium">{t.team}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    t.room ? "text-success-ink" : "text-danger-ink",
                  )}
                >
                  {t.room
                    ? rt("rm.deck.fc.room", {
                        month: monthLabel(t.room.y, t.room.m, locale, { long: true }),
                      })
                    : rt("rm.deck.fc.noRoom")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  )
}
