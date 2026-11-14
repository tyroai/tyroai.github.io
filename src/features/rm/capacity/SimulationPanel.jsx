import { HugeiconsIcon } from "@hugeicons/react"
import TestTube01Icon from "@hugeicons/core-free-icons/TestTube01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import FolderAddIcon from "@hugeicons/core-free-icons/FolderAddIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { autoCode } from "@/features/rm/lib/edit/project"
import { toIso } from "@/lib/rm/engine/dates"
import { catLabel, day } from "@/features/rm/lib/format"
import { nextMonday } from "@/features/rm/lib/simulate"
import { cn } from "@/lib/utils"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"
import { useSimulation } from "./useSimulation"
import { StartsTable, TeamDetail } from "./SimulationTables"

// Adreste olmayan değer "" gelir: sıfır değil, varsayılan.
const clampInt = (v, lo, hi, d) => {
  const n = v === "" || v == null ? NaN : Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}

/**
 * Simülasyon: yeni proje hangi tarihte başlarsa kategorinin ekiplerinde kim boş? Plan değişmez;
 * düzenleyici seçili başlangıçla yeni proje açabilir (ardından Kişi ata önerilen saatle).
 */
export function SimulationPanel() {
  const { rt, locale } = useRmText()
  const { data, params, today, edit, openEditor, people } = useRm()
  const { st, plan } = data
  const catsKey = params.get("simCats") || ""
  const weeks = clampInt(params.get("simW"), 1, 104, 8)
  const hours = clampInt(params.get("simH"), 1, 12, 4)
  const from = params.get("simFrom") || toIso(nextMonday(today))
  const hor = [3, 6, 12].includes(Number(params.get("simHor"))) ? Number(params.get("simHor")) : 6
  const v = { cats: catsKey.split(",").filter(Boolean), weeks, h: hours, from, hor }
  const R = useSimulation(st, plan, today, catsKey, weeks, hours, from, hor)
  const selRaw = params.get("simSel") === "" ? NaN : Number(params.get("simSel"))
  const sel = Number.isInteger(selRaw) && selRaw >= 0 && selRaw < R.starts.length ? selRaw : R.best
  const end = (i) => R.windows[i][R.windows[i].length - 1]
  const full = R.teams.length > 0 && R.cov[R.best] === R.teams.length
  const missing = (i) => R.teams.filter((t) => !R.fits[i][t].length)
  const releaseOf = (t) =>
    R.people
      .filter((r) => r.team === t && R.release[r.id] != null)
      .sort((a, b) => R.release[a.id] - R.release[b.id])
      .slice(0, 2)
      .map((r) => `${fullName(people, r.name)} (${day(R.starts[R.release[r.id]], locale)})`)
      .join(", ") || rt("rm.sim.noRelease")
  // Seçili başlangıçta her ekipten en boş kişi (şartname simgo): yeni proje ve Kişi ata önerisi.
  const pick = R.teams.map((t) => R.fits[sel]?.[t]?.[0]).filter(Boolean)
  const openPlan = () => {
    const name = rt("rm.sim.newName")
    openEditor({
      kind: "project",
      pid: null,
      pre: {
        name,
        code: autoCode(st, v.cats[0] || name),
        start: toIso(R.starts[sel]),
        end: toIso(end(sel)),
        cats: v.cats.slice(),
        team: pick.map((rid) => ({ rid })),
      },
      pend: { rids: pick, h: R.h },
    })
  }
  const toggleCat = (c) => {
    const next = v.cats.includes(c) ? v.cats.filter((x) => x !== c) : [...v.cats, c]
    params.update({ simCats: next.join(",") || null, simSel: null })
  }

  return (
    <div className="grid gap-4">
      <RmCard
        icon={TestTube01Icon}
        tone="brand"
        title={rt("rm.sim.inputs")}
        sub={rt("rm.sim.inputsSub")}
      >
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={rt("rm.sim.cats")}>
          {(st.pcats || []).map((c) => {
            const on = v.cats.includes(c.name)
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCat(c.name)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  on
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-background text-foreground/80 hover:bg-foreground/[0.04]",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: c.color }}
                />
                {catLabel(c.name)}
              </button>
            )
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 @[48rem]/rm:grid-cols-4">
          <label className="grid gap-1 text-xs text-muted-foreground">
            {rt("rm.sim.from")}
            <Input
              type="date"
              value={v.from}
              onChange={(e) => params.update({ simFrom: e.target.value || null, simSel: null })}
              className="h-9"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            {rt("rm.sim.weeks")}
            <Input
              type="number"
              min={1}
              max={104}
              value={v.weeks}
              onChange={(e) => params.update({ simW: e.target.value, simSel: null })}
              className="h-9"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            {rt("rm.sim.hours")}
            <Input
              type="number"
              min={1}
              max={12}
              value={v.h}
              onChange={(e) => params.update({ simH: e.target.value, simSel: null })}
              className="h-9"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            {rt("rm.sim.horizon")}
            <Select
              value={String(v.hor)}
              onValueChange={(x) => params.update({ simHor: x, simSel: null })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 12].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {rt("rm.sim.months", { n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {rt("rm.sim.teams", { list: R.teams.join(", ") || "—" })}
          {R.CT.partial.length > 0 &&
            ` · ${rt("rm.sim.partial", { cats: R.CT.partial.map(catLabel).join(", ") })}`}
        </p>
      </RmCard>

      <div
        role="status"
        className={cn("flex gap-3 rounded-3xl px-5 py-4", full ? "bg-success/10" : "bg-warning/10")}
      >
        <HugeiconsIcon
          icon={full ? CheckmarkCircle02Icon : Alert02Icon}
          className={cn("mt-0.5 size-5 shrink-0", full ? "text-success-ink" : "text-warning-ink")}
          strokeWidth={1.8}
        />
        <div className="min-w-0 text-sm">
          {!R.teams.length ? (
            <p className="font-semibold">{rt("rm.sim.noTeams")}</p>
          ) : full ? (
            <>
              <p className="font-semibold">
                {rt("rm.sim.best", { date: day(R.starts[R.best], locale, { year: true }) })}
              </p>
              <p className="mt-1 text-foreground/80">
                {rt("rm.sim.bestBody", {
                  end: day(end(R.best), locale, { year: true }),
                  n: R.D,
                  teams: R.teams.join(", "),
                  h: R.h,
                })}
              </p>
              {R.best > 0 && (
                <p className="mt-1 text-foreground/80">
                  {rt("rm.sim.firstMissing", {
                    date: day(R.starts[0], locale),
                    list: missing(0).join(", "),
                  })}{" "}
                  {missing(0)
                    .map((t) => `${t}: ${releaseOf(t)}`)
                    .join(" · ")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold">{rt("rm.sim.noFull")}</p>
              <p className="mt-1 text-foreground/80">
                {rt("rm.sim.noFullBody", {
                  date: day(R.starts[R.best], locale),
                  a: R.cov[R.best],
                  b: R.teams.length,
                  list: missing(R.best).join(", "),
                })}{" "}
                {missing(R.best)
                  .map((t) => `${t}: ${releaseOf(t)}`)
                  .join(" · ")}
              </p>
            </>
          )}
        </div>
      </div>

      {edit && R.starts.length > 0 && pick.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={openPlan}
            className="h-9 gap-1.5 bg-brand-fill-deep px-3.5 text-[0.8125rem] text-brand-on-brand hover:bg-brand-fill-deep pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={FolderAddIcon} className="size-4" strokeWidth={1.8} />
            {rt("rm.sim.open")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {rt("rm.sim.openHint", { date: day(R.starts[sel], locale), n: pick.length, h: R.h })}
          </span>
        </div>
      )}
      <StartsTable R={R} sel={sel} onSelect={(i) => params.update({ simSel: i })} />
      <TeamDetail R={R} sel={sel} />
    </div>
  )
}
