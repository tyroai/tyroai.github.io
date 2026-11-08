import { monthLabel, num, pct } from "@/features/rm/lib/format"
import { kindOf, level, openManDays, ratio } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar } from "../common/bits"
import { CellTip, GroupToggle, TeamMark, TreeLine } from "../common/tree"
import { useCellTip } from "../common/useTree"
import { useRm } from "../shell/RmContext"

const TONE = {
  over: "bg-danger/12 text-danger-ink font-semibold",
  high: "bg-warning/14 text-warning-ink",
  ok: "text-foreground/80",
  none: "text-muted-foreground/60",
}
const BAND = "bg-muted dark:bg-[color-mix(in_oklab,var(--card),white_6%)]"

function signed(n, locale) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), locale)}`
}

/**
 * Kapasite ağacı: her ekip bir bant (aç/kapa, ekip işareti, ekip toplamı), altında girintili
 * üyeler (avatar, ağaç çizgisi). Hücre üstüne gelince ayrıntı balonu; ad ekibi ya da kişiyi açar.
 * `groups`: useCapacity'nin grupları (sayfada aranmış/süzülmüş), `index`: ekibin sabit tonu.
 */
export function CapacityTree({
  groups,
  months,
  measure,
  dayHours,
  collapse,
  corner,
  onPerson,
  onTeam,
}) {
  const { rt, locale } = useRmText()
  const { people, data } = useRm()
  const { tip, bind } = useCellTip()
  const cols = months.length + 2
  const tipOf = (name, m, b, x) => ({
    "data-tip": `${name} · ${monthLabel(m.y, m.m, locale, { long: true })}`,
    "data-tip-sub": rt(measure === "load" ? "rm.tree.tipLoad" : "rm.tree.tipProject", {
      pct: pct(x, locale),
      a: num(measure === "load" ? b.load : b.pj, locale),
      c: num(measure === "load" ? b.wh : b.cap, locale),
    }),
  })
  const cell = (x) => (x == null ? "—" : Number.isFinite(x) ? pct(x, locale) : "∞")

  return (
    <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]" {...bind}>
      <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{rt("rm.capacity.caption")}</caption>
        <thead>
          <tr className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <th
              scope="col"
              className="sticky start-0 z-[2] w-[34%] bg-card pb-2 text-start font-medium"
            >
              <span className="sr-only">{rt("rm.capacity.person")}</span>
              {corner}
            </th>
            {months.map((m) => (
              <th key={m.key} scope="col" className="pb-2 text-center font-medium">
                {monthLabel(m.y, m.m, locale)}
              </th>
            ))}
            <th
              scope="col"
              className="w-16 pb-2 pe-3 text-end font-medium normal-case tracking-normal"
            >
              {rt("rm.capacity.open")}
            </th>
          </tr>
        </thead>
        {groups.map((g) => {
          const open = !collapse.closed.has(g.name)
          const id = `rm-cap-g-${g.index}`
          const kind = g.members[0] ? kindOf(data.plan, g.members[0].r) : null
          const gOpen = openManDays(g.total, dayHours, measure)
          return (
            <tbody key={g.name} id={id}>
              <tr>
                <th
                  scope="rowgroup"
                  className={cn(
                    "sticky start-0 z-[1] rounded-s-2xl py-2 ps-2 pe-3 text-start font-normal",
                    BAND,
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GroupToggle
                      open={open}
                      onClick={() => collapse.toggle(g.name)}
                      controls={id}
                      label={rt(open ? "rm.tree.collapse" : "rm.tree.expand", { team: g.name })}
                    />
                    <TeamMark name={g.name} index={g.index} />
                    <button
                      type="button"
                      onClick={() => onTeam(g.name)}
                      className="min-w-0 rounded-md text-start pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <span className="block truncate font-semibold">{g.name}</span>
                      <span className="block truncate text-xs text-foreground/65">
                        {[
                          rt("rm.heat.people", { n: g.members.length }),
                          kind && rt(`rm.set.grp.${kind}`),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  </span>
                </th>
                {g.cells.map((c, i) => (
                  <td key={c.key} className={cn("px-0.5 py-2", BAND)}>
                    <span
                      {...tipOf(g.name, months[i], c.b, c.x)}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg text-[0.8125rem] font-semibold tabular-nums",
                        TONE[level(c.x)],
                      )}
                    >
                      {cell(c.x)}
                    </span>
                  </td>
                ))}
                <td
                  className={cn(
                    "rounded-e-2xl pe-3 text-end text-xs font-semibold tabular-nums",
                    BAND,
                    gOpen < 0 ? "text-danger-ink" : "text-success-ink",
                  )}
                >
                  {signed(gOpen, locale)}
                </td>
              </tr>
              {open &&
                g.members.map(({ r, pb }, k) => {
                  const pOpen = openManDays(pb.T, dayHours, measure)
                  const name = fullName(people, r.name)
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onPerson(r.id)}
                      className="group/row cursor-pointer"
                    >
                      <th
                        scope="row"
                        className="sticky start-0 z-[1] bg-card ps-[1.375rem] pe-3 text-start font-normal transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--card),var(--foreground)_3%)]"
                      >
                        <span className="flex min-h-11 min-w-0 items-center gap-2.5">
                          <TreeLine last={k === g.members.length - 1} />
                          <Avatar name={r.name} over={level(ratio(pb.T, measure)) === "over"} />
                          <span className="min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onPerson(r.id)
                              }}
                              className="block max-w-full truncate rounded text-start font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            >
                              {name}
                            </button>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[r.role, r.closing ? rt("rm.capacity.closing") : null]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </span>
                          </span>
                        </span>
                      </th>
                      {months.map((m) => {
                        const b = pb.M[m.key]
                        const x = ratio(b, measure)
                        return (
                          <td key={m.key} className="px-0.5 py-1">
                            <span
                              {...tipOf(name, m, b, x)}
                              className={cn(
                                "flex h-8 items-center justify-center rounded-lg text-[0.8125rem] tabular-nums transition-colors group-hover/row:ring-1 group-hover/row:ring-border",
                                TONE[level(x)],
                              )}
                            >
                              {cell(x)}
                            </span>
                          </td>
                        )
                      })}
                      <td
                        className={cn(
                          "pe-3 text-end text-xs tabular-nums",
                          pOpen < 0 ? "text-danger-ink" : "text-muted-foreground",
                        )}
                      >
                        {signed(pOpen, locale)}
                      </td>
                    </tr>
                  )
                })}
              <tr aria-hidden="true">
                <td colSpan={cols} className="h-3" />
              </tr>
            </tbody>
          )
        })}
      </table>
      <CellTip tip={tip} />
    </div>
  )
}
