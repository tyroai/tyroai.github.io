import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { Button } from "@/components/ui/button"
import { personHours, resCap } from "@/lib/rm/engine/capacity"
import { monthLabel, num, pct } from "@/features/rm/lib/format"
import {
  level,
  monthsBetween,
  openManDays,
  periodRange,
  personBuckets,
  ratio,
} from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar, ColorDot, Meter } from "../common/bits"
import { DetailSection, PanelStats, RmDetailFrame } from "../common/RmDetailFrame"
import { BTN } from "../edit/ui"
import { useRm } from "../shell/RmContext"

/** Kişi ayrıntısı: kapasite kuralı, ay ay doluluk ve kapasiteyi dolduran projeler. */
export function PersonPanel({ person, period, measure, onClose, onProject }) {
  const { rt, locale } = useRmText()
  const { data, today, derived, params, people, edit, openEditor } = useRm()
  const { st, plan } = data
  const view = useMemo(() => {
    if (!person) return null
    const { from, to } = periodRange(st, plan, period, today)
    const months = monthsBetween(from, to)
    return { months, pb: personBuckets(st, plan, person, months) }
  }, [person, st, plan, period, today])

  const h = person ? personHours(person, st.settings) : null
  const full = person ? plan.teams.isFullDay(person) : false
  const projects = view
    ? Object.entries(view.pb.T.per)
        .map(([pid, o]) => ({ ...o, row: derived.rows.find((r) => r.id === pid) }))
        .filter((x) => x.row)
        .sort((a, b) => b.h - a.h)
    : []

  const openProject = onProject ?? ((id) => params.go("projeler", { p: id }))
  const m0 = view?.months[0]
  const x0 = m0 ? ratio(view.pb.M[m0.key], measure) : null
  const xT = view ? ratio(view.pb.T, measure) : null
  const free = view ? openManDays(view.pb.T, +st.settings.dayHours || 8, measure) : 0
  return (
    <RmDetailFrame
      open={Boolean(person)}
      id={person?.id}
      label={rt("rm.panel.person")}
      onClose={onClose}
      lead={person && <Avatar name={person.name} size="lg" over={(x0 ?? 0) > 1.0001} />}
      title={person ? fullName(people, person.name) : ""}
      sub={
        person
          ? [person.team, person.role, people.get(person.name)?.title].filter(Boolean).join(" · ")
          : ""
      }
    >
      {person && view && (
        <>
          {edit && (
            <div className="flex flex-wrap gap-2 border-b border-border/50 px-4 py-3 @[30rem]/detail:px-5">
              <Button
                variant="outline"
                className={BTN}
                onClick={() => openEditor({ kind: "person", rid: person.id })}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.8} />
                {rt("rm.pform.edit")}
              </Button>
            </div>
          )}
          <PanelStats
            items={[
              {
                key: "now",
                label: rt("rm.panel.statNow"),
                value: pct(x0, locale),
                tone: level(x0) === "over" ? "danger" : level(x0) === "high" ? "warn" : undefined,
              },
              {
                key: "period",
                label: rt("rm.panel.statPeriod"),
                value: pct(xT, locale),
                tone: level(xT) === "over" ? "danger" : level(xT) === "high" ? "warn" : undefined,
              },
              {
                key: "free",
                label: rt(free >= 0 ? "rm.panel.statFree" : "rm.panel.statShort"),
                value: num(Math.abs(free), locale),
                tone: free < 0 ? "danger" : "ok",
              },
            ]}
          />
          <DetailSection title={rt("rm.panel.capacity")}>
            <p className="text-sm">
              {full
                ? rt("rm.panel.ruleFull", { dh: h.dh })
                : rt("rm.panel.ruleCons", {
                    dh: h.dh,
                    sup: h.sup,
                    dev: h.dev,
                    net: resCap(st, plan, person),
                  })}
            </p>
            {person.closing && !full && (
              <p className="mt-1 text-sm text-muted-foreground">
                {rt("rm.panel.closing", { n: st.settings.closingDays })}
              </p>
            )}
          </DetailSection>
          <DetailSection title={rt(`rm.capacity.measure.${measure}`)}>
            <ul className="grid gap-2">
              {view.months.map((m) => {
                const b = view.pb.M[m.key]
                const x = ratio(b, measure)
                const lv = level(x)
                return (
                  <li
                    key={m.key}
                    className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {monthLabel(m.y, m.m, locale, { long: true })}
                    </span>
                    <Meter
                      value={x == null ? 0 : Math.min(x, 1)}
                      tone={lv === "over" ? "danger" : lv === "high" ? "warn" : "brand"}
                      label={monthLabel(m.y, m.m, locale, { long: true })}
                    />
                    <span
                      className={cn(
                        "text-end tabular-nums",
                        lv === "over" && "font-semibold text-danger-ink",
                      )}
                    >
                      {pct(x, locale)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {measure === "load"
                ? rt("rm.capacity.totalsLoad", {
                    a: num(view.pb.T.load, locale),
                    c: num(view.pb.T.wh, locale),
                  })
                : rt("rm.panel.totals", {
                    pj: num(view.pb.T.pj, locale),
                    cap: num(view.pb.T.cap, locale),
                    over: view.pb.T.over,
                  })}
            </p>
          </DetailSection>
          <DetailSection title={rt("rm.panel.projects", { n: projects.length })}>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{rt("rm.panel.noProjects")}</p>
            ) : (
              <ul className="grid gap-1">
                {projects.map((p) => (
                  <li key={p.row.id}>
                    <button
                      type="button"
                      onClick={() => openProject(p.row.id)}
                      className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-1 text-start text-sm hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <ColorDot color={p.row.color} />
                      <span className="w-11 shrink-0 text-xs font-semibold text-foreground/70">
                        {p.row.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{p.row.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {rt("rm.panel.hoursDays", { h: num(p.h, locale), d: p.d })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      )}
    </RmDetailFrame>
  )
}
