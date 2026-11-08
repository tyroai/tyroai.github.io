import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { Button } from "@/components/ui/button"
import { resCap, workdaysBetween } from "@/lib/rm/engine/capacity"
import { catLabel, day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar, Meter, ProjectBadge, SignalChip } from "../common/bits"
import { DetailSection, PanelStats, RmDetailFrame } from "../common/RmDetailFrame"
import { useRm } from "../shell/RmContext"
import { BTN } from "../edit/ui"
import { StatusPill } from "./ProjectList"
import { ProjectTodo } from "./ProjectTodo"

/** Proje ayrıntısı: süre, işler, ekip ve sinyallerin nedeni. Okuyana salt okunur. */
export function ProjectPanel({ row, nameOf, onClose, onPerson }) {
  const { rt, locale } = useRmText()
  const { data, today, params, people: dir, edit, openEditor } = useRm()
  const st = data.st
  const plan = data.plan
  const total =
    row && row.start != null && row.end != null
      ? workdaysBetween(plan, row.start - 1, row.end)
      : null
  const done =
    row && row.start != null
      ? Math.max(0, workdaysBetween(plan, row.start - 1, Math.min(today, row.end ?? today)))
      : 0
  const people = row
    ? row.members.map((m) => {
        const r = st.resources.find((x) => x.id === m.rid)
        const days = Object.values(plan.PA[row.id]?.[m.rid] || {}).filter(Boolean).length
        return {
          ...m,
          r,
          avg: days ? m.hours / days : 0,
          cap: r ? resCap(st, plan, r) : 0,
          over: row.over.includes(m.rid),
        }
      })
    : []
  const mgrs = row ? row.mgrs.map(nameOf) : []
  const openPerson = onPerson ?? ((rid) => params.go("kapasite", { person: rid }))
  const elapsed = total ? Math.round((done / total) * 100) : 0

  return (
    <RmDetailFrame
      open={Boolean(row)}
      id={row?.id}
      label={rt("rm.panel.project")}
      onClose={onClose}
      lead={row && <ProjectBadge code={row.code} color={row.color} />}
      title={row?.name ?? ""}
      sub={
        row
          ? [
              row.country,
              row.cats.map(catLabel).join(", "),
              row.pm && rt("rm.panel.pm", { name: fullName(dir, row.pm) }),
            ]
              .filter(Boolean)
              .join(" · ")
          : ""
      }
      badges={
        row && (
          <>
            <span className="inline-flex h-6 items-center rounded-full bg-foreground/[0.07] px-2 text-xs font-semibold">
              {row.code}
            </span>
            <StatusPill status={row.status} />
            {row.prio && (
              <span className="text-xs font-medium text-muted-foreground">{row.prio}</span>
            )}
          </>
        )
      }
    >
      {row && (
        <>
          {edit && (
            <div className="flex flex-wrap gap-2 border-b border-border/50 px-4 py-3 @[30rem]/detail:px-5">
              <Button
                variant="outline"
                className={BTN}
                onClick={() => openEditor({ kind: "assign", pid: row.id })}
              >
                <HugeiconsIcon icon={UserGroupIcon} className="size-4" strokeWidth={1.8} />
                {rt("rm.assign.title")}
              </Button>
              <Button
                variant="outline"
                className={BTN}
                onClick={() => openEditor({ kind: "dates", pid: row.id })}
              >
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={1.8} />
                {rt("rm.dates.title")}
              </Button>
              <Button
                variant="outline"
                className={BTN}
                onClick={() => openEditor({ kind: "project", pid: row.id })}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.8} />
                {rt("rm.pform.edit")}
              </Button>
            </div>
          )}
          <PanelStats
            items={[
              {
                key: "time",
                label: rt("rm.panel.elapsed"),
                value: `${elapsed}%`,
                sub: total != null ? rt("rm.projects.workdays", { n: total }) : null,
              },
              {
                key: "hours",
                label: rt("rm.panel.statHours"),
                value: num(row.hours, locale),
                sub: rt("rm.panel.statAhead", { n: num(row.future, locale) }),
              },
              {
                key: "team",
                label: rt("rm.panel.statTeam"),
                value: people.length,
                sub: row.over.length ? rt("rm.panel.statOver", { n: row.over.length }) : null,
                tone: row.over.length ? "danger" : people.length ? undefined : "warn",
              },
            ]}
          />
          <DetailSection title={rt("rm.panel.schedule")}>
            <p className="mb-2 text-sm tabular-nums">
              {day(row.start, locale, { year: true })} – {day(row.end, locale, { year: true })}
              {total != null && (
                <span className="text-muted-foreground">
                  {" "}
                  · {rt("rm.projects.workdays", { n: total })}
                </span>
              )}
            </p>
            <div className="grid gap-2.5">
              <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-xs">
                <span className="text-muted-foreground">{rt("rm.panel.elapsed")}</span>
                <Meter value={total ? done / total : 0} label={rt("rm.panel.elapsed")} />
                <span className="text-end tabular-nums">
                  {total ? Math.round((done / total) * 100) : 0}%
                </span>
              </div>
              {row.todo.total > 0 && (
                <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{rt("rm.panel.tasks")}</span>
                  <Meter
                    value={row.todo.done / row.todo.total}
                    tone="ok"
                    label={rt("rm.panel.tasks")}
                  />
                  <span className="text-end tabular-nums">
                    {row.todo.done}/{row.todo.total}
                  </span>
                </div>
              )}
            </div>
          </DetailSection>
          {row.signals.length > 0 && (
            <DetailSection title={rt("rm.panel.attention")}>
              <ul className="grid gap-2">
                {row.signals.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <SignalChip signal={s} />
                    <span className="text-muted-foreground">
                      {rt(`rm.signal.why.${s}`, {
                        hours: num(row.lateH, locale),
                        date: day(row.lateLast ?? row.end, locale),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
          <DetailSection
            title={rt("rm.panel.team", { n: people.length })}
            aside={
              <span className="text-xs tabular-nums text-muted-foreground">
                {rt("rm.panel.hours", { n: num(row.hours, locale) })}
              </span>
            }
          >
            {people.length === 0 ? (
              <p className="text-sm text-warning-ink">{rt("rm.signal.why.unstaffed")}</p>
            ) : (
              <ul className="grid gap-1">
                {people.map((p) => (
                  <li key={p.rid}>
                    <button
                      type="button"
                      onClick={() => openPerson(p.rid)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-1 text-start hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <Avatar name={fullName(dir, nameOf(p.rid))} over={p.over} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {fullName(dir, nameOf(p.rid))}
                          {mgrs.includes(nameOf(p.rid)) && (
                            <span className="ms-1 text-brand" aria-label={rt("rm.panel.manager")}>
                              ★
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[p.r?.team, rt("rm.panel.perDay", { n: num(p.avg, locale, 1) })]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          p.over ? "font-semibold text-danger-ink" : "text-muted-foreground",
                        )}
                      >
                        {p.over ? rt("rm.panel.over") : num(p.hours, locale)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
          {(row.desc || row.sponsor) && (
            <DetailSection title={rt("rm.panel.about")}>
              {row.sponsor && (
                <p className="mb-1 text-sm">
                  <span className="text-muted-foreground">{rt("rm.panel.sponsor")}: </span>
                  {row.sponsor}
                </p>
              )}
              {row.desc && (
                <p className="whitespace-pre-line text-sm text-foreground/85">{row.desc}</p>
              )}
            </DetailSection>
          )}
          {row.scope && (
            <DetailSection title={rt("rm.panel.scope")}>
              <p dir="auto" className="whitespace-pre-line text-sm text-foreground/85">
                {row.scope}
              </p>
            </DetailSection>
          )}
          {row.milestone && (
            <DetailSection title={rt("rm.panel.milestone")}>
              <p dir="auto" className="whitespace-pre-line text-sm tabular-nums text-foreground/85">
                {row.milestone}
              </p>
            </DetailSection>
          )}
          <ProjectTodo row={row} />
        </>
      )}
    </RmDetailFrame>
  )
}
