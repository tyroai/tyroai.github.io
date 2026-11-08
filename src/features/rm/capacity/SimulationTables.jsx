import { resCap } from "@/lib/rm/engine/capacity"
import CalendarCheckIn01Icon from "@hugeicons/core-free-icons/CalendarCheckIn01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { day, num } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { Avatar } from "../common/bits"
import { useRmText } from "../data/useRmText"
import { Meter } from "../common/bits"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

/** Aday başlangıçlar: her ekipte günde istenen saati ayırabilecek kişi sayısı; satır seçilir. */
export function StartsTable({ R, sel, onSelect }) {
  const { rt, locale } = useRmText()
  const end = (i) => R.windows[i][R.windows[i].length - 1]
  const params = { update: ({ simSel }) => onSelect(simSel) }
  return (
    <RmCard
      icon={CalendarCheckIn01Icon}
      tone="sky"
      title={rt("rm.sim.starts")}
      sub={rt("rm.sim.startsSub", { h: R.h })}
    >
      <div className="max-h-[22rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
              <th scope="col" className="pb-2 text-start font-medium">
                {rt("rm.sim.start")}
              </th>
              <th scope="col" className="pb-2 text-start font-medium">
                {rt("rm.sim.end")}
              </th>
              {R.teams.map((t) => (
                <th key={t} scope="col" className="pb-2 text-center font-medium">
                  {t}
                </th>
              ))}
              <th scope="col" className="pb-2 text-end font-medium">
                {rt("rm.sim.covered")}
              </th>
            </tr>
          </thead>
          <tbody>
            {R.starts.slice(0, 30).map((s, i) => (
              <tr
                key={s}
                onClick={() => params.update({ simSel: i })}
                className={cn(
                  "h-10 cursor-pointer border-t border-border/50 hover:bg-foreground/[0.025]",
                  i === sel && "bg-brand-soft/50",
                )}
              >
                <th scope="row" className="text-start font-normal tabular-nums">
                  <button
                    type="button"
                    onClick={(e) => (e.stopPropagation(), params.update({ simSel: i }))}
                    aria-pressed={i === sel}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {day(s, locale)}
                  </button>
                  {i === R.best && (
                    <span className="ms-2 rounded-full bg-success/12 px-2 py-0.5 text-[0.6875rem] text-success-ink">
                      {rt("rm.sim.recommended")}
                    </span>
                  )}
                </th>
                <td className="tabular-nums text-muted-foreground">{day(end(i), locale)}</td>
                {R.teams.map((t) => (
                  <td key={t} className="text-center">
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                        R.fits[i][t].length
                          ? "bg-success/12 text-success-ink"
                          : "bg-danger/10 text-danger-ink",
                      )}
                    >
                      {R.fits[i][t].length}
                    </span>
                  </td>
                ))}
                <td className="text-end text-xs font-semibold tabular-nums">
                  {R.cov[i]}/{R.teams.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RmCard>
  )
}

/** Seçili başlangıçta ekip ekip kişiler: boş saat, uygunluk, boşa çıkma tarihi. */
export function TeamDetail({ R, sel }) {
  const { rt, locale } = useRmText()
  const { data, people } = useRm()
  const { st, plan } = data
  const end = (i) => R.windows[i][R.windows[i].length - 1]
  return (
    <RmCard
      icon={UserGroupIcon}
      tone="teal"
      title={rt("rm.sim.detail", { date: day(R.starts[sel], locale, { year: true }) })}
      sub={rt("rm.sim.detailSub", { end: day(end(sel), locale, { year: true }) })}
    >
      <div className="grid gap-4 @[56rem]/rm:grid-cols-2 @[80rem]/rm:grid-cols-3">
        {R.teams.map((t) => {
          const list = R.people
            .filter((r) => r.team === t)
            .sort((a, b) => R.free[sel][b.id] - R.free[sel][a.id])
          return (
            <div key={t}>
              <p className="mb-1.5 text-sm font-semibold">
                {t}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {rt("rm.sim.fit", { n: R.fits[sel][t].length })}
                </span>
              </p>
              <ul className="grid gap-2">
                {list.map((r) => {
                  const fr = R.free[sel][r.id]
                  const ok = R.good[sel][r.id]
                  const rel = R.release[r.id]
                  return (
                    <li
                      key={r.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={r.name} size="sm" />
                        <span className="truncate">{fullName(people, r.name)}</span>
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {rt("rm.sim.freePerDay", { n: num(fr, locale, 1) })}
                      </span>
                      <span className="col-span-2">
                        <Meter
                          value={fr / Math.max(1, resCap(st, plan, r))}
                          tone={fr >= R.h ? "ok" : "warn"}
                          label={fullName(people, r.name)}
                        />
                      </span>
                      <span
                        className={cn(
                          "col-span-2 text-xs",
                          ok ? "text-success-ink" : "text-muted-foreground",
                        )}
                      >
                        {ok
                          ? rt("rm.sim.ok")
                          : rel != null
                            ? rt("rm.sim.okFrom", { date: day(R.starts[rel], locale) })
                            : rt("rm.sim.never")}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </RmCard>
  )
}
