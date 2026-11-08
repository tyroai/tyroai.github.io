import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { monthLabel, num, pct } from "@/features/rm/lib/format"
import { level, openManDays, ratio } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar, ColorDot, Meter } from "../common/bits"
import { DetailSection, PanelStats, RmDetailFrame } from "../common/RmDetailFrame"
import { useRm } from "../shell/RmContext"

const ROW =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-1 text-start transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

const toneOf = (x) => (level(x) === "over" ? "danger" : level(x) === "high" ? "warn" : undefined)

/** Ekibin dönemdeki projeleri: üyelerin saatleri toplanır, en çok saat önce. */
function teamProjects(row, rows) {
  const h = new Map()
  for (const { pb } of row.people) {
    for (const [pid, o] of Object.entries(pb.T.per)) h.set(pid, (h.get(pid) || 0) + o.h)
  }
  return [...h]
    .map(([pid, hours]) => ({ row: rows.find((r) => r.id === pid), hours }))
    .filter((x) => x.row)
    .sort((a, b) => b.hours - a.hours)
}

/** Ekip ayrıntısı: dönemin doluluğu, ay ay doluluk, üyeler (bu ay) ve ekibin projeleri. */
export function TeamPanel({ ov, team, onClose, onPerson, onProject }) {
  const { rt, locale } = useRmText()
  const { data, derived, people } = useRm()
  const row = team ? (ov.grid.rows.find((r) => r.team === team) ?? null) : null
  const m0 = ov.grid.months[0]
  const p = ov.filter.period
  const members = row
    ? row.people
        .map(({ r, pb }) => ({ r, x: m0 ? ratio(pb.M[m0.key]) : null }))
        .sort((a, b) => (b.x ?? -1) - (a.x ?? -1))
    : []
  const projects = row ? teamProjects(row, derived.rows) : []
  const xT = row ? ratio(row.total) : null
  const free = row ? openManDays(row.total, +data.st.settings.dayHours || 8) : 0

  return (
    <RmDetailFrame
      open={Boolean(row)}
      id={team}
      label={rt("rm.team.panel")}
      onClose={onClose}
      lead={<IconTile icon={Building03Icon} tone="sky" />}
      title={team ?? ""}
      sub={
        row
          ? rt("rm.team.panelSub", {
              n: row.people.length,
              period: rt(`rm.capacity.period.${p}`),
            })
          : ""
      }
    >
      {row && (
        <>
          <PanelStats
            items={[
              { key: "x", label: rt("rm.team.statUtil"), value: pct(xT, locale), tone: toneOf(xT) },
              {
                key: "h",
                label: rt("rm.team.statHours"),
                value: num(row.total.pj, locale),
                sub: rt("rm.team.statCap", { n: num(row.total.cap, locale) }),
              },
              {
                key: "free",
                label: rt(free >= 0 ? "rm.panel.statFree" : "rm.panel.statShort"),
                value: num(Math.abs(free), locale),
                tone: free < 0 ? "danger" : "ok",
              },
            ]}
          />
          <DetailSection title={rt("rm.team.months")}>
            <ul className="grid gap-2">
              {ov.grid.months.map((m, i) => {
                const x = row.cells[i]?.x ?? null
                const name = monthLabel(m.y, m.m, locale, { long: true })
                return (
                  <li
                    key={m.key}
                    className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">{name}</span>
                    <Meter
                      value={x == null ? 0 : Math.min(x, 1)}
                      tone={toneOf(x) ?? "brand"}
                      label={name}
                    />
                    <span
                      className={cn(
                        "text-end tabular-nums",
                        level(x) === "over" && "font-semibold text-danger-ink",
                      )}
                    >
                      {pct(x, locale)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </DetailSection>
          <DetailSection title={rt("rm.team.members", { n: members.length })}>
            <ul className="grid gap-0.5">
              {members.map(({ r, x }) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onPerson(r.id)} className={ROW}>
                    <Avatar name={r.name} over={level(x) === "over"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {fullName(people, r.name)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[r.role, r.closing ? rt("rm.capacity.closing") : null]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        level(x) === "over"
                          ? "font-semibold text-danger-ink"
                          : level(x) === "high"
                            ? "text-warning-ink"
                            : "text-muted-foreground",
                      )}
                    >
                      {rt("rm.team.thisMonth", { pct: pct(x, locale) })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </DetailSection>
          <DetailSection title={rt("rm.team.projects", { n: projects.length })}>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{rt("rm.team.noProjects")}</p>
            ) : (
              <ul className="grid gap-0.5">
                {projects.slice(0, 12).map(({ row: pr, hours }) => (
                  <li key={pr.id}>
                    <button type="button" onClick={() => onProject(pr.id)} className={ROW}>
                      <ColorDot color={pr.color} />
                      <span className="w-11 shrink-0 text-xs font-semibold text-foreground/70">
                        {pr.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{pr.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {rt("rm.unit.hours", { n: num(hours, locale) })}
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
