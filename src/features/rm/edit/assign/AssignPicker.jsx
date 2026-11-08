import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { num, pct } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { Avatar } from "../../common/bits"
import { useRm } from "../../shell/RmContext"

// Doluluk çubuğunun rengi (şartname pctCol): aşım · yoğun · boş · uygun.
function barTone(p) {
  if (p > 1.0001) return "bg-danger"
  if (p >= 0.85) return "bg-warning"
  if (p < 0.3) return "bg-foreground/25"
  return "bg-success"
}

/** Ekip sekmeleri ve kişi kartları: dokununca kişi projeye girer ya da çıkar. */
export function AssignPicker({ a }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const st = data.st
  const picked = new Set(a.rows.map((x) => x.rid))
  const list = st.resources
    .filter((r) => r.team === a.tab)
    .sort((x, y) => (a.free.get(y.id)?.avg || 0) - (a.free.get(x.id)?.avg || 0))

  return (
    <section aria-labelledby="rm-assign-pick" className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="rm-assign-pick" className="text-sm font-semibold">
          {rt("rm.assign.pick")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {rt(a.cats.open ? "rm.assign.pickHint" : "rm.assign.pickHintCats")}
        </span>
      </div>
      <div role="group" aria-label={rt("rm.assign.teams")} className="flex flex-wrap gap-1.5">
        {a.allTeams.map((tm) => {
          const n = st.resources.filter((r) => r.team === tm && picked.has(r.id)).length
          const cat = !a.cats.open && a.cats.teams.includes(tm)
          const on = a.tab === tm
          return (
            <button
              key={tm}
              type="button"
              aria-pressed={on}
              title={cat ? rt("rm.assign.catTeam") : undefined}
              onClick={() => a.setTab(tm)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:min-w-11 justify-center",
                on
                  ? "border-transparent bg-foreground text-background"
                  : "border-transparent bg-foreground/[0.05] text-foreground/80 hover:bg-foreground/[0.09]",
                cat && !on && "border-dashed border-brand/50",
              )}
            >
              {tm}
              {n ? (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-[0.6875rem] tabular-nums",
                    on ? "bg-background/20" : "bg-brand-soft text-brand-on-soft",
                  )}
                >
                  {n}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {list.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] gap-2">
          {list.map((r) => {
            const on = picked.has(r.id)
            const f = a.free.get(r.id) || { avg: 0, pct: 0 }
            const name = fullName(dir, r.name)
            const sub = rt("rm.assign.freeLine", {
              h: num(f.avg, locale, 1),
              p: pct(Math.min(f.pct, 9.99), locale),
            })
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${name}, ${sub}`}
                  title={`${name} · ${sub}`}
                  onClick={() => a.toggle(r.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    on
                      ? "border-foreground/30 bg-foreground/[0.05] dark:bg-white/[0.07]"
                      : "border-border/70 bg-background hover:border-foreground/25",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-[1.125rem] shrink-0 place-items-center rounded-[0.375rem] border-2",
                      on ? "border-brand-fill-deep bg-brand-fill-deep text-white" : "border-border",
                    )}
                  >
                    {on ? (
                      <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  <Avatar name={r.name} size="sm" />
                  <span aria-hidden="true" className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold">{name}</span>
                    <span className="block truncate text-[0.6875rem] text-foreground/65">
                      {sub}
                    </span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <span
                        className={cn("block h-full rounded-full", barTone(f.pct))}
                        style={{ width: `${Math.min(100, Math.round(f.pct * 100))}%` }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{rt("rm.assign.emptyTeam")}</p>
      )}
    </section>
  )
}
