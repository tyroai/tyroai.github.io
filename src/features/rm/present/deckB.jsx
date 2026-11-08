import { day, monthLabel, num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { Avatar } from "../common/bits"
import { BarRow, Frame, Label } from "./kit"

const FILL = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-foreground/20" }
const HEAT = {
  over: "bg-danger/14 font-semibold text-danger-ink",
  high: "bg-warning/16 text-warning-ink",
  ok: "text-foreground/80",
  none: "text-muted-foreground/60",
}
const INK = { over: "font-semibold text-danger-ink", high: "text-warning-ink" }

/** Önümüzdeki üç ayın en yoğun projeleri: saat, pay, kişi sayısı, PM. */
export function BusySlide({ ctx, foot }) {
  const { deck, rt, locale } = ctx
  const { list, total } = deck.busy
  const max = Math.max(0.0001, ...list.map((x) => x.share))
  const shown = list.reduce((s, x) => s + x.share, 0)
  return (
    <Frame
      eyebrow={rt("rm.deck.busy.eyebrow")}
      title={rt("rm.deck.busy.title")}
      sub={
        total
          ? rt("rm.deck.busy.sub", {
              date: day(deck.horizon, locale, { year: true }),
              h: num(total, locale),
              n: list.length,
              pct: pct(shown, locale),
            })
          : null
      }
      foot={foot}
    >
      {list.length === 0 ? (
        <p className="text-[1.6cqw] text-muted-foreground">{rt("rm.deck.busy.empty")}</p>
      ) : (
        <ul className="grid content-start gap-[0.2cqw]">
          {list.map(({ row: r, h, n, share }) => (
            <BarRow
              key={r.id}
              labelW="27cqw"
              lead={
                <span
                  aria-hidden="true"
                  className="grid h-[2.6cqw] w-[4.2cqw] shrink-0 place-items-center rounded-[0.6cqw] text-[0.95cqw] font-bold text-foreground/80"
                  style={{
                    background: `color-mix(in oklab, ${r.color || "var(--muted-foreground)"} 26%, transparent)`,
                  }}
                >
                  {r.code}
                </span>
              }
              label={r.name}
              sub={[
                r.pm && rt("rm.panel.pm", { name: fullName(ctx.people, r.pm) }),
                rt("rm.deck.busy.row", { n }),
              ]
                .filter(Boolean)
                .join(" · ")}
              value={share / max}
              color={`color-mix(in oklab, ${r.color || "var(--color-brand)"} 75%, var(--color-brand))`}
              right={
                <>
                  <b className="font-semibold">{pct(share, locale)}</b>
                  <span className="ms-[0.6cqw] text-muted-foreground">
                    {rt("rm.unit.hours", { n: num(h, locale) })}
                  </span>
                </>
              }
            />
          ))}
        </ul>
      )}
    </Frame>
  )
}

/** Ekip yoğunluğu: dönemin doluluğu (çubuk) ve ay ay ısı tablosu. */
export function TeamsSlide({ ctx, foot }) {
  const { ov, rt, locale, periodLabel } = ctx
  const over = ov.teams.filter((t) => level(t.x) === "over").length
  const months = ov.grid.months.slice(0, 6)
  return (
    <Frame
      eyebrow={rt("rm.deck.teams.eyebrow")}
      title={rt("rm.deck.teams.title", { period: periodLabel })}
      sub={rt("rm.deck.teams.sub", { over, n: ov.teams.length })}
      foot={foot}
    >
      <div className="grid h-full grid-cols-[1fr_1.15fr] gap-[3cqw]">
        <div className="min-w-0">
          <Label>{rt("rm.team.card.title")}</Label>
          <ul>
            {ov.teams.slice(0, 7).map((t) => (
              <BarRow
                key={t.team}
                label={t.team}
                sub={rt("rm.team.card.row", {
                  n: t.n,
                  pj: num(t.pj, locale),
                  cap: num(t.cap, locale),
                })}
                value={Math.min(1, t.x || 0)}
                tone={FILL[level(t.x)]}
                right={<span className={cn(INK[level(t.x)])}>{pct(t.x, locale)}</span>}
              />
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <Label>{rt("rm.deck.teams.heat")}</Label>
          <table className="w-full border-separate border-spacing-[0.35cqw] text-[1.1cqw]">
            <thead>
              <tr>
                <th className="w-[24%]" />
                {months.map((m) => (
                  <th
                    key={m.key}
                    className="text-center text-[0.95cqw] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    {monthLabel(m.y, m.m, locale)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ov.grid.rows.slice(0, 10).map((row) => (
                <tr key={row.team}>
                  <th scope="row" className="truncate text-start font-normal">
                    {row.team}
                  </th>
                  {row.cells.slice(0, 6).map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "rounded-[0.5cqw] py-[0.45cqw] text-center tabular-nums",
                        HEAT[level(c.x)],
                      )}
                    >
                      {c.x == null ? "—" : pct(c.x, locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Frame>
  )
}

function PersonLine({ o, people, children }) {
  return (
    <li className="flex items-center gap-[1cqw] border-b border-border/60 py-[0.7cqw] last:border-0">
      <Avatar
        name={o.r.name}
        className="size-[2.8cqw] shrink-0 [&>span]:text-[0.9cqw]"
        over={level(o.x0) === "over"}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.3cqw] font-medium">
          {fullName(people, o.r.name)}
        </span>
        <span className="block truncate text-[1cqw] text-muted-foreground">
          {[o.r.team, o.top?.join(", ")].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="shrink-0 text-end text-[1.15cqw] tabular-nums">{children}</span>
    </li>
  )
}

/** Kişi yoğunluğu: aşımdakiler (bu ay ve gelecek ay) ve boş kapasitesi olanlar. */
export function PeopleSlide({ ctx, foot }) {
  const { ov, rt, locale, people } = ctx
  const { over, idle, months } = ov.load
  const [a, b] = months
  return (
    <Frame
      eyebrow={rt("rm.deck.people.eyebrow")}
      title={rt("rm.deck.people.title")}
      sub={rt("rm.deck.people.sub", { o: ov.ov.overPeople.length, i: idle.length })}
      foot={foot}
    >
      <div className="grid h-full grid-cols-2 gap-[3cqw] overflow-hidden">
        <div className="min-w-0">
          <Label aside={over.length}>{rt("rm.deck.people.over")}</Label>
          {over.length === 0 ? (
            <p className="text-[1.3cqw] text-muted-foreground">{rt("rm.deck.people.none")}</p>
          ) : (
            <ul>
              {over.slice(0, 6).map((o) => (
                <PersonLine key={o.r.id} o={o} people={people}>
                  <span className={cn("block", INK[level(o.x0)])}>
                    {monthLabel(a.y, a.m, locale)} {pct(o.x0, locale)}
                  </span>
                  {b && (
                    <span className={cn("block text-muted-foreground", INK[level(o.x1)])}>
                      {monthLabel(b.y, b.m, locale)} {pct(o.x1, locale)}
                    </span>
                  )}
                </PersonLine>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <Label aside={idle.length}>{rt("rm.deck.people.idle")}</Label>
          {idle.length === 0 ? (
            <p className="text-[1.3cqw] text-muted-foreground">{rt("rm.deck.people.none")}</p>
          ) : (
            <ul>
              {idle.slice(0, 6).map((o) => (
                <PersonLine key={o.r.id} o={{ ...o, top: null }} people={people}>
                  <span className="rounded-full bg-success/12 px-[0.8cqw] py-[0.3cqw] text-[1cqw] font-medium text-success-ink">
                    {rt("rm.detail.people.free", { n: num(o.free, locale, 1) })}
                  </span>
                </PersonLine>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Frame>
  )
}
