import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { Input } from "@/components/ui/input"
import { groupRows } from "@/features/rm/lib/edit/assign"
import { resCap } from "@/lib/rm/engine/capacity"
import { num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { Avatar } from "../../common/bits"
import { useRm } from "../../shell/RmContext"
import { DayChips } from "../DayChips"

// Tek DOM, iki düzen: dar pencerede kart (alanlar alt alta), genişte tablo satırı.
const GRID = cn(
  "grid items-center gap-x-3 gap-y-2 grid-cols-6",
  "[grid-template-areas:'who_who_who_who_star_del'_'from_from_from_to_to_to'_'days_days_days_days_hrs_hrs'_'tot_tot_st_st_st_st']",
  "@[60rem]/edit:grid-cols-[minmax(10rem,1.3fr)_2.75rem_9.5rem_9.5rem_auto_4.75rem_4.5rem_minmax(8.5rem,1fr)_2.75rem]",
  "@[60rem]/edit:[grid-template-areas:'who_star_from_to_days_hrs_tot_st_del']",
)
// Dokunmatikte 44 px; masaüstünde Input'un sm:h-7'si yerine 36 px.
const FIELD = "h-9 sm:h-9 tabular-nums pointer-coarse:h-11 sm:pointer-coarse:h-11"
const SMALL_LABEL = "mb-1 block text-[0.6875rem] text-muted-foreground @[60rem]/edit:hidden"

function LoadChip({ load, onSuggest }) {
  const { rt, locale } = useRmText()
  if (load.kind === "none") return null
  if (load.kind === "suggest") {
    return (
      <button
        type="button"
        onClick={onSuggest}
        className="h-8 rounded-lg border border-border/80 px-2.5 text-xs font-medium hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
      >
        {rt("rm.assign.suggest", { h: load.h })}
      </button>
    )
  }
  const tone = {
    ok: "bg-success/12 text-success-ink",
    ot: "bg-danger/10 text-danger-ink",
    manual: "bg-brand-soft text-brand-on-soft",
  }[load.kind]
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2 text-[0.6875rem] font-medium",
        tone,
      )}
    >
      {load.kind !== "manual" && (
        <HugeiconsIcon
          icon={load.kind === "ok" ? CheckmarkCircle02Icon : Alert02Icon}
          className="size-3.5 shrink-0"
          strokeWidth={2}
        />
      )}
      <span className="truncate">
        {load.kind === "ok"
          ? rt("rm.assign.fits")
          : load.kind === "ot"
            ? rt("rm.assign.overtime", { h: num(load.ot, locale) })
            : rt("rm.assign.manual")}
      </span>
    </span>
  )
}

function Row({ a, x, first }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const r = a.kit.rById.get(x.rid)
  const name = fullName(dir, r.name)
  const tot = a.rowTotal(x)
  const bad = a.bad?.k === x.k
  const mgr = a.mg.has(x.rid)
  const field = (label) => `${name}: ${label}`
  return (
    <li
      data-row={x.k}
      className={cn(
        GRID,
        "rounded-xl px-2.5 py-2.5",
        bad ? "bg-danger/[0.06] ring-1 ring-inset ring-danger/30" : "hover:bg-foreground/[0.02]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 [grid-area:who]">
        <Avatar name={r.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[0.8125rem] font-semibold">{name}</div>
          <div className="truncate text-[0.6875rem] text-muted-foreground">
            {[r.role, rt("rm.assign.capLine", { h: num(resCap(data.st, data.plan, r), locale) })]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>
      <div className="justify-self-center [grid-area:star]">
        {first ? (
          <button
            type="button"
            aria-pressed={mgr}
            aria-label={rt("rm.assign.mgrOf", { name })}
            title={rt("rm.panel.manager")}
            onClick={() => a.toggleMgr(x.rid)}
            className="grid size-9 place-items-center rounded-lg hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
          >
            <HugeiconsIcon
              icon={StarIcon}
              strokeWidth={1.8}
              className={cn(
                "size-5",
                mgr ? "text-warning [&_path]:fill-current" : "text-muted-foreground/50",
              )}
            />
          </button>
        ) : null}
      </div>
      <label className="min-w-0 [grid-area:from]">
        <span className={SMALL_LABEL}>{rt("rm.assign.from")}</span>
        <Input
          type="date"
          value={x.from}
          min={a.PS}
          max={a.PE}
          aria-label={field(rt("rm.assign.from"))}
          aria-invalid={bad && ["date", "order", "range"].includes(a.bad.code)}
          onChange={(e) => a.update(x.k, { from: e.target.value })}
          className={FIELD}
        />
      </label>
      <label className="min-w-0 [grid-area:to]">
        <span className={SMALL_LABEL}>{rt("rm.assign.to")}</span>
        <Input
          type="date"
          value={x.to}
          min={a.PS}
          max={a.PE}
          aria-label={field(rt("rm.assign.to"))}
          aria-invalid={bad && ["date", "order", "range"].includes(a.bad.code)}
          onChange={(e) => a.update(x.k, { to: e.target.value })}
          className={FIELD}
        />
      </label>
      <div className="min-w-0 [grid-area:days]">
        <span aria-hidden="true" className={SMALL_LABEL}>
          {rt("rm.assign.days")}
        </span>
        <DayChips
          value={x.days}
          onChange={(days) => a.update(x.k, { days })}
          label={field(rt("rm.assign.days"))}
          invalid={bad && a.bad.code === "days"}
        />
      </div>
      <label className="min-w-0 [grid-area:hrs]">
        <span className={SMALL_LABEL}>{rt("rm.assign.perDay")}</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={24}
          value={x.h}
          placeholder="—"
          aria-label={field(rt("rm.assign.perDay"))}
          aria-invalid={bad && a.bad.code === "hours"}
          onChange={(e) => a.update(x.k, { h: e.target.value.trim() })}
          className={FIELD}
        />
      </label>
      <div className="text-[0.8125rem] font-medium tabular-nums [grid-area:tot] @[60rem]/edit:text-end">
        {tot ? rt("rm.unit.hours", { n: num(tot, locale) }) : ""}
      </div>
      <div className="min-w-0 [grid-area:st]">
        <LoadChip
          load={a.rowLoad(x)}
          onSuggest={() => a.update(x.k, { h: String(a.rowLoad(x).h) })}
        />
      </div>
      <div className="justify-self-end [grid-area:del]">
        <button
          type="button"
          aria-label={rt("rm.assign.removeOf", { name })}
          title={rt("rm.assign.remove")}
          onClick={() => a.remove(x.k)}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-[1.125rem]" strokeWidth={1.8} />
        </button>
      </div>
    </li>
  )
}

/** Projenin ekibi, ekip ekip: tarih aralığı, çalışma günleri, günlük saat, toplam, kapasite. */
export function AssignRows({ a }) {
  const { rt, locale } = useRmText()
  const groups = groupRows(a.rows, a.teamOf, a.order)
  const heads = [
    ["who", rt("rm.assign.person")],
    // Dar sütunda kelime kesilmesin: başlık yıldız (satırdaki düğmenin adı ayrıca okunur).
    ["star", "★"],
    ["from", rt("rm.assign.from")],
    ["to", rt("rm.assign.to")],
    ["days", rt("rm.assign.days")],
    ["hrs", rt("rm.assign.perDay")],
    ["tot", rt("rm.x.total")],
    ["st", rt("rm.assign.capacity")],
  ]
  return (
    <div className="grid gap-1">
      <div
        aria-hidden="true"
        className={cn(
          GRID,
          "hidden px-2.5 pb-1 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground @[60rem]/edit:grid",
        )}
      >
        {heads.map(([area, label]) => (
          <span
            key={area}
            style={{ gridArea: area }}
            className={cn(
              "truncate",
              area === "tot" && "text-end",
              area === "star" && "text-center",
            )}
          >
            {label}
          </span>
        ))}
      </div>
      {groups.map((g) => {
        const hours = g.rows.reduce((s, x) => s + a.rowTotal(x), 0)
        const n = new Set(g.rows.map((x) => x.rid)).size
        return (
          <section key={g.tm} aria-label={g.tm} className="grid gap-0.5">
            <h4 className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-foreground/[0.04] px-2.5 py-1.5 text-xs font-semibold dark:bg-white/[0.05]">
              <span>{g.tm}</span>
              <span className="font-normal text-foreground/65">
                {rt("rm.assign.groupLine", {
                  n,
                  h: num(hours, locale),
                  d: num(hours / a.dh, locale, 1),
                })}
              </span>
            </h4>
            <ul className="grid gap-0.5">
              {g.rows.map((x) => (
                <Row key={x.k} a={a} x={x} first={a.rows.find((y) => y.rid === x.rid) === x} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
