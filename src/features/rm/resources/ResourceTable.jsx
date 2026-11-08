import { monthLabel, pct } from "@/features/rm/lib/format"
import { level, ratio, sumBuckets } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar } from "../common/bits"
import { GroupToggle, TeamMark, TreeLine } from "../common/tree"
import { useRm } from "../shell/RmContext"

const TONE = {
  over: "bg-danger/10 font-semibold text-danger-ink",
  high: "bg-warning/14 text-warning-ink",
  ok: "text-foreground/80",
  none: "text-muted-foreground",
}
const BAND = "bg-muted dark:bg-[color-mix(in_oklab,var(--card),white_6%)]"
const RULE = "hidden @[52rem]/rm:table-cell"
const PROJ = "hidden @[44rem]/rm:table-cell"

function Pct({ x, strong }) {
  const { locale } = useRmText()
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-12 items-center justify-center rounded-full px-2 text-xs tabular-nums",
        TONE[level(x)],
        strong && "font-semibold",
      )}
    >
      {pct(x, locale)}
    </span>
  )
}

/**
 * Kaynaklar tablosu: her ekip bir bant (aç/kapa, ekip işareti, kişi sayısı ve türü, ekibin bu ay
 * ve gelecek ay doluluğu); altında girintili üyeler. Satıra basınca kişi paneli.
 */
export function ResourceTable({ teams, rows, months, collapse, corner, onPerson }) {
  const { rt, locale } = useRmText()
  const { people } = useRm()
  const [m0, m1] = months
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
      <caption className="sr-only">{rt("rm.nav.resources")}</caption>
      <thead>
        <tr className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          <th scope="col" className="pb-2 text-start font-medium">
            <span className="sr-only">{rt("rm.capacity.person")}</span>
            {corner}
          </th>
          <th scope="col" className={cn("w-44 pb-2 text-start font-medium", RULE)}>
            {rt("rm.res.col.rule")}
          </th>
          <th scope="col" className="w-20 pb-2 text-center font-medium">
            {monthLabel(m0.y, m0.m, locale)}
          </th>
          {m1 && (
            <th scope="col" className="w-20 pb-2 text-center font-medium">
              {monthLabel(m1.y, m1.m, locale)}
            </th>
          )}
          <th scope="col" className={cn("w-24 pb-2 pe-3 text-end font-medium", PROJ)}>
            {rt("rm.res.col.projects")}
          </th>
          {/* Bandın sağ köşesi: görünür son sütun genişliğe göre değiştiği için ayrı, dar sütun. */}
          <th aria-hidden="true" className="w-3 p-0" />
        </tr>
      </thead>
      {teams.map((t, index) => {
        const list = rows.filter((x) => x.r.team === t.name)
        if (!list.length) return null
        const open = !collapse.closed.has(t.name)
        const id = `rm-res-g-${index}`
        const tx0 = ratio(sumBuckets(list.map((x) => x.pb.M[m0.key])))
        const tx1 = m1 ? ratio(sumBuckets(list.map((x) => x.pb.M[m1.key]))) : null
        const kinds = [...new Set(list.map((x) => x.kind))]
        return (
          <tbody key={t.name} id={id}>
            <tr>
              <th
                scope="rowgroup"
                className={cn("rounded-s-2xl py-2 ps-2 pe-3 text-start font-normal", BAND)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GroupToggle
                    open={open}
                    onClick={() => collapse.toggle(t.name)}
                    controls={id}
                    label={rt(open ? "rm.tree.collapse" : "rm.tree.expand", { team: t.name })}
                  />
                  <TeamMark name={t.name} index={t.index} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{t.name}</span>
                    <span className="block truncate text-xs text-foreground/65">
                      {[
                        rt("rm.heat.people", { n: list.length }),
                        ...kinds.map((k) => rt(`rm.set.grp.${k}`)),
                      ].join(" · ")}
                    </span>
                  </span>
                </span>
              </th>
              <td className={cn(RULE, BAND)} />
              <td className={cn("text-center", BAND)}>
                <Pct x={tx0} strong />
              </td>
              {m1 && (
                <td className={cn("text-center", BAND)}>
                  <Pct x={tx1} strong />
                </td>
              )}
              <td className={cn(PROJ, BAND)} />
              <td aria-hidden="true" className={cn("rounded-e-2xl p-0", BAND)} />
            </tr>
            {open &&
              list.map((x, k) => (
                <tr
                  key={x.r.id}
                  onClick={() => onPerson(x.r.id)}
                  className="group/row cursor-pointer"
                >
                  <td className="ps-[1.375rem] pe-2 transition-colors group-hover/row:bg-foreground/[0.025]">
                    <span className="flex min-h-12 min-w-0 items-center gap-2.5">
                      <TreeLine last={k === list.length - 1} />
                      <Avatar name={x.r.name} over={level(ratio(x.pb.M[m0.key])) === "over"} />
                      <span className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPerson(x.r.id)
                          }}
                          className="block max-w-full truncate rounded text-start font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          {fullName(people, x.r.name)}
                        </button>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[
                            x.r.role,
                            people.get(x.r.name)?.title,
                            x.r.closing && x.kind === "cons" ? rt("rm.capacity.closing") : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td
                    className={cn(
                      "text-xs text-muted-foreground transition-colors group-hover/row:bg-foreground/[0.025]",
                      RULE,
                    )}
                  >
                    {rt(x.kind === "cons" ? "rm.res.ruleCons" : "rm.res.ruleFull", { h: x.cap })}
                  </td>
                  <td className="text-center transition-colors group-hover/row:bg-foreground/[0.025]">
                    <Pct x={ratio(x.pb.M[m0.key])} />
                  </td>
                  {m1 && (
                    <td className="text-center transition-colors group-hover/row:bg-foreground/[0.025]">
                      <Pct x={ratio(x.pb.M[m1.key])} />
                    </td>
                  )}
                  <td
                    className={cn(
                      "pe-3 text-end text-xs tabular-nums transition-colors group-hover/row:bg-foreground/[0.025]",
                      PROJ,
                    )}
                  >
                    {x.projects}
                  </td>
                  <td aria-hidden="true" className="p-0" />
                </tr>
              ))}
            <tr aria-hidden="true">
              <td colSpan={6} className="h-3" />
            </tr>
          </tbody>
        )
      })}
    </table>
  )
}
