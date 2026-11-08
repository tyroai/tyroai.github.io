import CalendarCheckOut01Icon from "@hugeicons/core-free-icons/CalendarCheckOut01Icon"
import BatteryMedium01Icon from "@hugeicons/core-free-icons/BatteryMedium01Icon"
import CalendarRemove01Icon from "@hugeicons/core-free-icons/CalendarRemove01Icon"
import DashboardSpeed01Icon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import UserRemove01Icon from "@hugeicons/core-free-icons/UserRemove01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { day, monthLabel, num, pct } from "@/features/rm/lib/format"
import { level, ratio } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar, ColorDot, Meter } from "../common/bits"
import { DetailSection, RmDetailFrame } from "../common/RmDetailFrame"
import { useRm } from "../shell/RmContext"
import { CapacityMetric } from "./CapacityMetric"
import { INK, METER, ROW } from "./metricUi"

const METRICS = {
  open: { icon: Folder01Icon, tone: "brand" },
  util: { icon: DashboardSpeed01Icon, tone: "violet" },
  over: { icon: UserWarning01Icon, tone: "pink" },
  risk: { icon: CalendarRemove01Icon, tone: "fuchsia" },
  cap: { icon: BatteryMedium01Icon, tone: "blue" },
  unstaffed: { icon: UserRemove01Icon, tone: "slate" },
  ending: { icon: CalendarCheckOut01Icon, tone: "teal" },
}

function Projects({ title, list, meta, onProject }) {
  const { rt } = useRmText()
  const { people } = useRm()
  if (!list.length) return null
  return (
    <DetailSection
      title={title}
      aside={<span className="text-xs tabular-nums text-muted-foreground">{list.length}</span>}
    >
      <ul className="grid gap-0.5">
        {list.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onProject(r.id)}
              className={ROW}
              aria-label={`${r.code} ${r.name}`}
            >
              <ColorDot color={r.color} />
              <span className="w-11 shrink-0 text-xs font-semibold text-foreground/70">
                {r.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{r.name}</span>
                {r.pm && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {rt("rm.panel.pm", { name: fullName(people, r.pm) })}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta(r)}</span>
            </button>
          </li>
        ))}
      </ul>
    </DetailSection>
  )
}

function People({ title, list, months, onPerson }) {
  const { locale } = useRmText()
  const { people } = useRm()
  if (!list.length) return null
  const [a, b] = months
  return (
    <DetailSection
      title={title}
      aside={<span className="text-xs tabular-nums text-muted-foreground">{list.length}</span>}
    >
      <ul className="grid gap-0.5">
        {list.map((o) => (
          <li key={o.r.id}>
            <button type="button" onClick={() => onPerson(o.r.id)} className={ROW}>
              <Avatar name={o.r.name} over={level(o.x0) === "over"} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {fullName(people, o.r.name)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[o.r.team, o.top.join(", ")].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="grid shrink-0 text-end text-xs tabular-nums">
                <span className={cn(INK[level(o.x0)])}>
                  {monthLabel(a.y, a.m, locale)} {pct(o.x0, locale)}
                </span>
                {b && (
                  <span className={cn("text-muted-foreground", INK[level(o.x1)])}>
                    {monthLabel(b.y, b.m, locale)} {pct(o.x1, locale)}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </DetailSection>
  )
}

function Util({ ov, onTeam }) {
  const { rt, locale } = useRmText()
  const [m0, m1] = ov.grid.months
  return (
    <>
      <DetailSection title={rt("rm.metric.teamsNow")}>
        <ul className="grid gap-0.5">
          {ov.grid.rows.map((row) => {
            const x0 = ratio(row.cells[0]?.b)
            const x1 = ratio(row.cells[1]?.b)
            return (
              <li key={row.team}>
                <button type="button" onClick={() => onTeam(row.team)} className={ROW}>
                  <span className="w-28 shrink-0 truncate text-sm font-medium">{row.team}</span>
                  <span className="flex-1">
                    <Meter value={Math.min(1, x0 || 0)} tone={METER[level(x0)]} label={row.team} />
                  </span>
                  <span className="grid w-16 shrink-0 text-end text-xs tabular-nums">
                    <span className={cn(INK[level(x0)])}>{pct(x0, locale)}</span>
                    {m1 && (
                      <span className={cn("text-muted-foreground", INK[level(x1)])}>
                        {monthLabel(m1.y, m1.m, locale)} {pct(x1, locale)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {m0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {rt("rm.metric.utilNote", { month: monthLabel(m0.y, m0.m, locale, { long: true }) })}
          </p>
        )}
      </DetailSection>
      <DetailSection title={rt("rm.metric.months")}>
        <ul className="grid gap-2">
          {ov.months.map((m) => (
            <li
              key={m.key}
              className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-xs"
            >
              <span className="text-muted-foreground">
                {monthLabel(m.y, m.m, locale, { long: true })}
              </span>
              <Meter
                value={Math.min(1, m.x || 0)}
                tone={METER[level(m.x)]}
                label={monthLabel(m.y, m.m, locale, { long: true })}
              />
              <span className={cn("text-end tabular-nums", INK[level(m.x)])}>
                {pct(m.x, locale)}
              </span>
            </li>
          ))}
        </ul>
      </DetailSection>
    </>
  )
}

/**
 * Göstergenin ayrıntısı (Genel Bakış'ta kutuya basınca): o sayıyı oluşturan projeler, kişiler ya
 * da ekipler; satıra basınca kendi paneli açılır, sayfadan çıkılmaz.
 */
export function MetricPanel({ ov, metric, onClose, onProject, onPerson, onTeam }) {
  const { rt, locale } = useRmText()
  const k = METRICS[metric] ? metric : null
  const open = ov.rows.filter((r) => r.phase !== "done")
  const sig = (s) => open.filter((r) => r.signals.includes(s))
  const date = (field) => (r) => day(r[field], locale, { year: true })
  const months = ov.load.months
  const over0 = ov.load.over.filter((o) => (o.x0 ?? 0) > 1.0001)
  const over1 = ov.load.over.filter((o) => (o.x0 ?? 0) <= 1.0001)
  const P = (title, list, meta) => (
    <Projects title={title} list={list} meta={meta} onProject={onProject} />
  )
  return (
    <RmDetailFrame
      open={Boolean(k)}
      id={k}
      label={k ? rt(`rm.kpi.${k}`) : ""}
      onClose={onClose}
      lead={k && <IconTile icon={METRICS[k].icon} tone={METRICS[k].tone} />}
      title={k ? rt(`rm.kpi.${k}`) : ""}
      sub={k ? rt(`rm.kpi.hint.${k}`) : ""}
    >
      {k === "open" && (
        <>
          {P(
            rt("rm.metric.active"),
            open.filter((r) => r.phase === "active").sort((a, b) => a.end - b.end),
            date("end"),
          )}
          {P(
            rt("rm.metric.upcoming"),
            open.filter((r) => r.phase === "upcoming").sort((a, b) => a.start - b.start),
            date("start"),
          )}
        </>
      )}
      {k === "util" && <Util ov={ov} onTeam={onTeam} />}
      {k === "cap" && <CapacityMetric ov={ov} onTeam={onTeam} />}
      {k === "over" && (
        <>
          <People
            title={rt("rm.metric.overNow")}
            list={over0}
            months={months}
            onPerson={onPerson}
          />
          <People
            title={rt("rm.metric.overNext")}
            list={over1}
            months={months}
            onPerson={onPerson}
          />
          {!ov.load.over.length && <Empty text={rt("rm.kpi.overNone")} />}
        </>
      )}
      {k === "risk" && (
        <>
          {P(
            rt("rm.risk.sec.overdue"),
            sig("overdue").sort((a, b) => a.end - b.end),
            date("end"),
          )}
          {P(
            rt("rm.risk.sec.late"),
            sig("late").sort((a, b) => b.lateH - a.lateH),
            (r) => rt("rm.unit.hours", { n: num(r.lateH, locale) }),
          )}
          {!sig("overdue").length && !sig("late").length && <Empty text={rt("rm.metric.none")} />}
        </>
      )}
      {k === "unstaffed" &&
        (sig("unstaffed").length ? (
          P(rt("rm.risk.sec.unstaffed"), sig("unstaffed"), date("start"))
        ) : (
          <Empty text={rt("rm.metric.none")} />
        ))}
      {k === "ending" && (
        <>
          {P(
            rt("rm.risk.sec.ending"),
            sig("endingSoon").sort((a, b) => a.end - b.end),
            date("end"),
          )}
          {P(
            rt("rm.risk.sec.starting"),
            sig("startingSoon").sort((a, b) => a.start - b.start),
            date("start"),
          )}
          {!sig("endingSoon").length && !sig("startingSoon").length && (
            <Empty text={rt("rm.metric.none")} />
          )}
        </>
      )}
    </RmDetailFrame>
  )
}

function Empty({ text }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{text}</p>
}
