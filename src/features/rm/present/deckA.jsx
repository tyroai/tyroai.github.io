import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import DashboardSpeed01Icon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { catLabel, monthLabel, num, pct } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { BarRow, Frame, Label, Message, Stat } from "./kit"

// Sayı yer tutucuları kalın: göz önce rakamı yakalar.
const BOLD = new Set(["n", "pct"])
function Rich({ text, vars }) {
  return String(text)
    .split(/(\{\w+\})/g)
    .map((part, i) => {
      const m = /^\{(\w+)\}$/.exec(part)
      if (!m || vars?.[m[1]] == null) return part
      return BOLD.has(m[1]) ? (
        <b key={i} className="font-semibold tabular-nums">
          {vars[m[1]]}
        </b>
      ) : (
        String(vars[m[1]])
      )
    })
}

/** Ana mesajın metni ve değişkenleri (`deck.messages` öğesinden). */
function messageText(m, rt, locale) {
  switch (m.key) {
    case "peak":
      return [
        rt("rm.answer.peak"),
        {
          team: m.peak.team,
          month: monthLabel(m.peak.month.y, m.peak.month.m, locale, { long: true }),
          pct: pct(m.peak.x, locale),
        },
      ]
    case "over":
      return [rt("rm.ins.over"), { n: m.n }]
    case "overNone":
      return [rt("rm.answer.overNone"), {}]
    case "busy":
      return [
        rt("rm.deck.msg.busy"),
        { code: m.row.code, name: m.row.name, pct: pct(m.share, locale) },
      ]
    case "starting":
      return [rt("rm.ins.starting"), { n: m.n }]
    default:
      return [rt(`rm.deck.msg.${m.key}`), { n: num(m.n, locale), team: m.team }]
  }
}

/** Kapak: marka degradesi, toplantı ve ay, filtre, dört büyük sayı. */
export function CoverSlide({ ctx, foot }) {
  const { deck, rt, locale, monthName, ov, filterNote } = ctx
  const t = deck.totals
  const tiles = [
    [rt("rm.kpi.open"), num(t.open, locale)],
    [rt("rm.deck.stat.people"), num(t.people, locale)],
    [rt("rm.deck.stat.teams"), num(t.teams, locale)],
    [rt("rm.kpi.util"), pct(ov.ov.utilNow, locale)],
  ]
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-brand-from via-brand-via to-brand-to p-[4.5cqw] text-brand-on-ramp [print-color-adjust:exact]">
      <span
        aria-hidden="true"
        className="absolute -end-[8cqw] -top-[12cqw] size-[40cqw] rounded-full bg-white/15 blur-[3cqw]"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-[20cqw] -start-[12cqw] size-[42cqw] rounded-full bg-black/10 blur-[4cqw]"
      />
      <p className="relative flex items-center gap-[0.8cqw] text-[1.5cqw] font-semibold">
        tyroRM
        <span className="font-normal opacity-75">· IT Resource Management</span>
      </p>
      <div className="relative mt-auto">
        <p className="text-[1.25cqw] font-semibold uppercase tracking-[0.18em] opacity-85">
          {rt("rm.present.eyebrow", { month: monthName })}
        </p>
        <h1 className="mt-[1.1cqw] text-[5.6cqw] font-semibold leading-[1.02] tracking-[-0.035em]">
          {rt("rm.deck.cover.title")}
        </h1>
        <p className="mt-[1.2cqw] text-[1.55cqw] opacity-90">
          {filterNote || rt("rm.deck.cover.all", { period: ctx.periodLabel })}
        </p>
      </div>
      <dl className="relative mt-[3cqw] grid grid-cols-4 gap-[1.4cqw]">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-[1.3cqw] bg-white/15 p-[1.6cqw] ring-1 ring-white/25">
            <dt className="truncate text-[1.15cqw] opacity-85">{label}</dt>
            <dd className="mt-[0.6cqw] text-[3.4cqw] font-semibold leading-none tabular-nums tracking-[-0.03em]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="relative mt-[2cqw] flex items-center justify-between text-[0.95cqw] opacity-80">
        {foot}
      </div>
    </div>
  )
}

/** Yönetici özeti: solda ana mesajlar, sağda dört sayı. */
export function SummarySlide({ ctx, foot }) {
  const { deck, rt, locale, ov } = ctx
  const t = deck.totals
  const o = ov.ov
  return (
    <Frame eyebrow={rt("rm.deck.sum.eyebrow")} title={rt("rm.deck.sum.title")} foot={foot}>
      <div className="grid h-full grid-cols-[1.25fr_1fr] gap-[2.4cqw]">
        <div className="min-w-0">
          <Label>{rt("rm.deck.sum.msgs")}</Label>
          <ul className="grid gap-[0.9cqw]">
            {deck.messages.map((m) => {
              const [text, vars] = messageText(m, rt, locale)
              return (
                <Message key={m.key} tone={m.tone}>
                  <Rich text={text} vars={vars} />
                </Message>
              )
            })}
          </ul>
        </div>
        <div className="grid grid-cols-2 content-start gap-[1.4cqw]">
          <Stat
            icon={Folder01Icon}
            tone="brand"
            label={rt("rm.kpi.open")}
            value={num(t.open, locale)}
            sub={rt("rm.kpi.openCap", { a: t.active, u: t.upcoming })}
          />
          <Stat
            icon={DashboardSpeed01Icon}
            tone="violet"
            label={rt("rm.kpi.util")}
            value={pct(o.utilNow, locale)}
            sub={rt("rm.kpi.utilCap", { pct: pct(o.utilNext, locale) })}
            warn={o.utilNow > 1}
          />
          <Stat
            icon={UserWarning01Icon}
            tone="pink"
            label={rt("rm.kpi.over")}
            value={num(o.overPeople.length, locale)}
            sub={rt("rm.deck.stat.overSub", { n: deck.totals.people })}
            warn={o.overPeople.length > 0}
          />
          <Stat
            icon={Clock01Icon}
            tone="teal"
            label={rt("rm.deck.stat.ahead")}
            value={num(t.hoursAhead, locale)}
            sub={rt("rm.deck.stat.aheadSub")}
          />
        </div>
      </div>
    </Frame>
  )
}

/** Portföy: evre şeridi, kategoriye ve önceliğe göre açık projeler. */
export function PortfolioSlide({ ctx, foot }) {
  const { deck, rt, locale } = ctx
  const t = deck.totals
  const all = t.active + t.upcoming + t.done || 1
  const phases = [
    ["active", t.active, "bg-brand"],
    ["upcoming", t.upcoming, "bg-brand/45"],
    ["done", t.done, "bg-foreground/15"],
  ]
  const maxCat = Math.max(1, ...deck.cats.map((c) => c.n))
  const maxPrio = Math.max(1, ...deck.prios.map((c) => c.n))
  return (
    <Frame
      eyebrow={rt("rm.deck.port.eyebrow")}
      title={rt("rm.deck.port.title", { n: t.open })}
      sub={rt("rm.deck.port.sub", { a: t.active, u: t.upcoming, d: t.done })}
      foot={foot}
    >
      <div className="flex h-full flex-col gap-[2.2cqw]">
        <div>
          <div className="flex h-[2.4cqw] overflow-hidden rounded-full">
            {phases.map(([k, n, cls]) => (
              <span key={k} className={cls} style={{ width: `${(n / all) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-[0.9cqw] flex gap-[2.4cqw] text-[1.2cqw]">
            {phases.map(([k, n, cls]) => (
              <li key={k} className="flex items-center gap-[0.6cqw]">
                <span aria-hidden="true" className={cn("size-[0.9cqw] rounded-full", cls)} />
                {rt(`rm.deck.port.${k}`)}
                <b className="font-semibold tabular-nums">{num(n, locale)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-[3cqw]">
          <div className="min-w-0">
            <Label>{rt("rm.deck.port.cats")}</Label>
            <ul>
              {deck.cats.slice(0, 7).map((c) => (
                <BarRow
                  key={c.name}
                  lead={
                    <span
                      aria-hidden="true"
                      className="size-[1cqw] shrink-0 rounded-full"
                      style={{ background: c.color || "var(--muted-foreground)" }}
                    />
                  }
                  label={catLabel(c.name)}
                  value={c.n / maxCat}
                  color={c.color || undefined}
                  right={num(c.n, locale)}
                />
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <Label>{rt("rm.deck.port.prios")}</Label>
            <ul>
              {deck.prios.slice(0, 7).map((p) => (
                <BarRow
                  key={p.name}
                  label={p.name}
                  value={p.n / maxPrio}
                  tone="bg-violet-500/70"
                  right={num(p.n, locale)}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Frame>
  )
}
