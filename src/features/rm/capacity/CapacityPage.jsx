import { HugeiconsIcon } from "@hugeicons/react"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { yearMonth } from "@/lib/rm/engine/dates"
import { monthLabel, pct } from "@/features/rm/lib/format"
import { isOver, periodRange } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmText } from "../data/useRmText"
import { ExpandAll, SearchField, TogglePill } from "../common/TreeTools"
import { useCollapse } from "../common/useTree"
import { RmKpiStrip } from "../common/RmKpiStrip"
import { capacityInsights } from "../shell/insights"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { PersonPanel } from "./PersonPanel"
import { SimulationPanel } from "./SimulationPanel"
import { CapacityTree } from "./CapacityTree"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { cn } from "@/lib/utils"
import { capacityStats } from "./capacityStats"
import { MEASURES, PERIODS, useCapacity } from "./useCapacity"

const ALL = "__all"
const norm = (s) => String(s || "").toLocaleLowerCase("tr-TR")

/** Kapasite: kim ne zaman dolu? Satır kişi, sütun ay; renk yalnız dikkatte. */
export function CapacityPage() {
  const { rt, locale } = useRmText()
  const { data, params, today, phone, people } = useRm()
  const { st, plan } = data
  const period = PERIODS.includes(params.get("period")) ? params.get("period") : "6"
  const measure = MEASURES.includes(params.get("measure")) ? params.get("measure") : "project"
  const teamNames = [...new Set(st.resources.map((r) => r.team))]
  const team = teamNames.includes(params.get("team")) ? params.get("team") : ""
  const cap = useCapacity(st, plan, today, { period, measure, team })
  const S = st.settings
  const personId = params.get("person")
  const person = st.resources.find((r) => r.id === personId) ?? null
  const sim = params.get("tab") === "sim"
  const collapse = useCollapse()

  const stats = capacityStats(cap, measure, { rt, locale, S, people })
  const net = Math.max(0, S.dayHours - S.support - S.dev)
  const month = (n) => {
    const [y, m] = yearMonth(n)
    return monthLabel(y, m, locale, { long: true })
  }
  // Seçeneklerin ipucu: dönemin ay aralığı, ölçünün hesabı (ayarlardaki saatlerle).
  const periodTip = (p) => {
    const { from, to } = periodRange(st, plan, p, today)
    const key = p === "all" ? "rm.capacity.tip.periodAll" : "rm.capacity.tip.periodN"
    return { body: rt(key, { n: p, from: month(from), to: month(to) }) }
  }
  const measureTip = (m) => ({
    title: rt(`rm.capacity.measure.${m}`),
    body: rt(`rm.capacity.tip.${m}`, { net, dh: S.dayHours }),
  })

  // Ağaç: arama ve "yalnız aşımdakiler" üyeleri filtreler; boş kalan ekip gizlenir. Ton sırası sabit.
  const order = teamNames
  const q = norm(params.get("q"))
  const overOnly = params.get("over") === "1"
  const groups = cap.groups
    .map((g) => ({
      ...g,
      index: Math.max(0, order.indexOf(g.name)),
      members: g.members.filter(
        ({ r, pb }) =>
          (!q || norm(`${r.name} ${fullName(people, r.name)} ${r.role} ${r.team}`).includes(q)) &&
          (!overOnly || cap.months.some((m) => isOver(pb.M[m.key], measure))),
      ),
    }))
    .filter((g) => g.members.length || (!q && !overOnly))
  const keys = groups.map((g) => g.name)
  const allClosed = keys.length > 0 && keys.every((k) => collapse.closed.has(k))

  return (
    <>
      <RmHead
        group={rt("rm.group.team")}
        title={rt("rm.nav.capacity")}
        answer={sim ? rt("rm.sim.answer") : null}
        insights={sim ? null : capacityInsights(cap, rt, locale, S.dayHours, measure)}
      />
      <div className={cn(phone && "sticky -top-4 z-20 -mx-4 bg-background px-4")}>
        <TextTabs
          kind="tabs"
          rail
          size={phone ? "md" : "lg"}
          label={rt("rm.nav.capacity")}
          idPrefix="rm-cap-tab"
          controls="rm-cap-panel"
          options={[
            { value: "load", label: rt("rm.capacity.tab.load") },
            { value: "sim", label: rt("rm.capacity.tab.sim") },
          ]}
          value={sim ? "sim" : "load"}
          onChange={(v) => params.update({ tab: v === "sim" ? "sim" : null })}
        />
      </div>
      {sim ? (
        <div id="rm-cap-panel" role="tabpanel" aria-labelledby="rm-cap-tab-sim">
          <SimulationPanel />
        </div>
      ) : (
        <div
          id="rm-cap-panel"
          role="tabpanel"
          aria-labelledby="rm-cap-tab-load"
          className="flex min-w-0 flex-col gap-6"
        >
          <RmKpiStrip stats={stats} phone={phone} label={rt("rm.capacity.kpi.label")} />
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label={rt("rm.capacity.period")}
              value={period}
              onChange={(v) => params.update({ period: v === "6" ? null : v })}
              options={PERIODS.map((p) => ({
                value: p,
                label: rt(`rm.capacity.period.${p}`),
                tip: periodTip(p),
              }))}
            />
            <SegmentedControl
              label={rt("rm.capacity.measure")}
              value={measure}
              onChange={(v) => params.update({ measure: v === "project" ? null : v })}
              options={MEASURES.map((m) => ({
                value: m,
                label: rt(`rm.capacity.measure.${m}`),
                tip: measureTip(m),
              }))}
            />
            <Popover>
              <PopoverTrigger className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 pointer-coarse:h-11 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-4" strokeWidth={1.8} />
                {rt("rm.capacity.how")}
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="mb-2 font-medium">{rt("rm.capacity.howTitle")}</p>
                <ul className="grid gap-1.5 text-muted-foreground">
                  <li>
                    {rt("rm.capacity.rule.cons", {
                      dh: S.dayHours,
                      sup: S.support,
                      dev: S.dev,
                      net: Math.max(0, S.dayHours - S.support - S.dev),
                    })}
                  </li>
                  <li>{rt("rm.capacity.rule.full", { dh: S.dayHours })}</li>
                  <li>{rt("rm.capacity.rule.closing", { n: S.closingDays })}</li>
                  <li>{rt("rm.capacity.rule.holiday")}</li>
                  <li>{rt(`rm.capacity.rule.${measure}`)}</li>
                </ul>
              </PopoverContent>
            </Popover>
            <SearchField
              value={params.get("q")}
              onChange={(v) => params.update({ q: v })}
              label={rt("rm.tree.search")}
            />
            <TogglePill
              on={overOnly}
              onClick={() => params.update({ over: overOnly ? null : "1" })}
              icon={UserWarning01Icon}
              label={rt("rm.tree.overOnly")}
              tip={rt(
                measure === "load" ? "rm.capacity.hint.overLoad" : "rm.capacity.hint.overProject",
              )}
            />
            <Select
              value={team || ALL}
              onValueChange={(v) => params.update({ team: v === ALL ? null : v })}
            >
              <SelectTrigger
                className="ms-auto w-auto min-w-[9rem] rounded-full data-[size=default]:h-9 pointer-coarse:data-[size=default]:h-11"
                aria-label={rt("rm.capacity.team")}
              >
                {/* Düğmede yalnız ekibin adı; sayılar listede. */}
                <SelectValue>{team || rt("rm.capacity.teamAll")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{rt("rm.capacity.teamAll")}</SelectItem>
                {teamNames.map((t) => {
                  const ts = cap.teamStats.get(t)
                  return (
                    <SelectItem key={t} value={t} className="pe-8 *:[span]:last:flex-1">
                      <span className="flex w-full min-w-0 items-center justify-between gap-4">
                        <span className="truncate">{t}</span>
                        {ts && (
                          <span className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">
                            {rt("rm.capacity.teamStat", { n: ts.n, pct: pct(ts.x, locale) })}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <section className="min-w-0 rounded-3xl border border-border/60 bg-card p-3 shadow-xs sm:p-4">
            {groups.length ? (
              <CapacityTree
                groups={groups}
                months={cap.months}
                measure={measure}
                dayHours={cap.dayHours}
                collapse={collapse}
                corner={
                  <ExpandAll
                    allClosed={allClosed}
                    onClick={() => collapse.setAll(keys, !allClosed)}
                  />
                }
                onPerson={(id) => params.update({ person: id })}
                onTeam={(t) => params.update({ team: t === team ? null : t })}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {rt("rm.tree.empty")}
              </p>
            )}
            <p className="mt-3 px-1 text-xs text-muted-foreground">
              {rt(measure === "load" ? "rm.capacity.legendLoad" : "rm.capacity.legend")}
            </p>
          </section>
        </div>
      )}
      <PersonPanel
        person={person}
        period={period}
        measure={measure}
        onClose={() => params.update({ person: null })}
      />
    </>
  )
}
