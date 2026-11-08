import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ActionButton } from "@/components/common/ActionButton"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import UserTime01Icon from "@hugeicons/core-free-icons/UserTime01Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resCap } from "@/lib/rm/engine/capacity"
import { monthEnd, monthStart } from "@/lib/rm/engine/dates"
import { kindOf, level, monthsBetween, personBuckets, ratio } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmText } from "../data/useRmText"
import { ExpandAll, SearchField, TogglePill } from "../common/TreeTools"
import { useCollapse } from "../common/useTree"
import { RmKpiStrip } from "../common/RmKpiStrip"
import { resourceInsights } from "../shell/insights"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { PersonPanel } from "../capacity/PersonPanel"
import { ResourceTable } from "./ResourceTable"

const ALL = "__all"
const norm = (s) => String(s || "").toLocaleLowerCase("tr-TR")
/** Kaynaklar: ekip ekip kişiler, kapasite kuralı ve bu ay / gelecek ay doluluğu; düzenleyici kişi ekler. */
export function ResourcesPage() {
  const { rt } = useRmText()
  const { data, params, today, phone, people, edit, openEditor } = useRm()
  const { st, plan } = data
  const team = params.get("team")
  const q = params.get("q")
  const kind = ["cons", "dev", "pmo"].includes(params.get("kind")) ? params.get("kind") : ALL
  const overOnly = params.get("over") === "1"
  const collapse = useCollapse()
  const months = useMemo(
    () => monthsBetween(monthStart(today), monthEnd(monthEnd(today) + 1)),
    [today],
  )
  const horizon = useMemo(
    () => monthsBetween(monthStart(today), monthEnd(monthStart(today) + 62)),
    [today],
  )
  const rows = useMemo(
    () =>
      st.resources.map((r) => {
        const pb = personBuckets(st, plan, r, months)
        const hz = personBuckets(st, plan, r, horizon)
        return {
          r,
          pb,
          kind: kindOf(plan, r),
          cap: resCap(st, plan, r),
          projects: Object.keys(hz.T.per).length,
        }
      }),
    [st, plan, months, horizon],
  )
  const order = (plan.teams.list || []).map((t) => t.name)
  const teams = [...new Set(st.resources.map((r) => r.team))].sort(
    (a, b) => ((order.indexOf(a) + 99) % 99) - ((order.indexOf(b) + 99) % 99),
  )
  // Ton sırası kişilerin sırasıyla (Kapasite ile aynı ekip aynı renkte).
  const toneOrder = [...new Set(st.resources.map((r) => r.team))]
  const shown = rows.filter(
    (x) =>
      (!team || x.r.team === team) &&
      (kind === ALL || x.kind === kind) &&
      (!overOnly || months.some((m) => level(ratio(x.pb.M[m.key])) === "over")) &&
      (!q ||
        norm(
          `${x.r.name} ${fullName(people, x.r.name)} ${people.get(x.r.name)?.title ?? ""} ${x.r.role} ${x.r.team}`,
        ).includes(norm(q))),
  )
  const [m0] = months
  const allClosed = teams.length > 0 && teams.every((t) => collapse.closed.has(t))
  const count = (k) => rows.filter((x) => x.kind === k).length
  const stats = [
    {
      key: "people",
      icon: UserGroupIcon,
      tone: "brand",
      label: rt("rm.res.kpi.people"),
      value: rows.length,
      caption: rt("rm.res.kpi.teams", { n: teams.length }),
    },
    {
      key: "cons",
      icon: UserTime01Icon,
      tone: "teal",
      label: rt("rm.res.kpi.cons"),
      value: count("cons"),
      caption: rt("rm.res.kpi.consCap", {
        h: Math.max(0, st.settings.dayHours - st.settings.support - st.settings.dev),
      }),
    },
    {
      key: "full",
      icon: Building03Icon,
      tone: "sky",
      label: rt("rm.res.kpi.full"),
      value: count("dev") + count("pmo"),
      caption: rt("rm.res.kpi.fullCap", { h: st.settings.dayHours }),
    },
    {
      key: "closing",
      icon: Calendar03Icon,
      tone: "violet",
      label: rt("rm.res.kpi.closing"),
      value: rows.filter((x) => x.r.closing && x.kind === "cons").length,
      caption: rt("rm.res.kpi.closingCap", { n: st.settings.closingDays }),
    },
  ]
  const selected = st.resources.find((r) => r.id === params.get("person")) ?? null

  return (
    <>
      <RmHead
        group={rt("rm.group.team")}
        title={rt("rm.nav.resources")}
        insights={resourceInsights(
          {
            people: rows.length,
            teams: teams.length,
            over: rows.filter((x) => (ratio(x.pb.M[m0.key]) ?? 0) > 1.0001).length,
          },
          rt,
          params.go,
        )}
        actions={
          edit && (
            <ActionButton
              tone="prominent"
              size="toolbar"
              onClick={() => openEditor({ kind: "person", rid: null })}
            >
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.8} />
              {rt("rm.people.newTitle")}
            </ActionButton>
          )
        }
      />
      <RmKpiStrip
        stats={stats}
        phone={phone}
        label={rt("rm.res.kpi.label")}
        onPick={(k) => k === "people" && params.update({ team: null })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={q}
          onChange={(v) => params.update({ q: v })}
          label={rt("rm.res.search")}
        />
        <SegmentedControl
          label={rt("rm.res.kind")}
          value={kind}
          onChange={(v) => params.update({ kind: v === ALL ? null : v })}
          options={[ALL, "cons", "dev", "pmo"].map((k) => ({
            value: k,
            label: k === ALL ? rt("rm.res.kindAll") : rt(`rm.set.grp.${k}`),
          }))}
        />
        <TogglePill
          on={overOnly}
          onClick={() => params.update({ over: overOnly ? null : "1" })}
          icon={UserWarning01Icon}
          label={rt("rm.tree.overOnly")}
        />
        <Select
          value={team || ALL}
          onValueChange={(v) => params.update({ team: v === ALL ? null : v })}
        >
          <SelectTrigger
            className="w-auto min-w-[9rem] rounded-full data-[size=default]:h-9 pointer-coarse:data-[size=default]:h-11"
            aria-label={rt("rm.capacity.team")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.capacity.teamAll")}</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ms-auto text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {rt("rm.res.count", { n: shown.length })}
        </span>
      </div>
      {shown.length ? (
        <ResourceTable
          teams={teams.map((name) => ({ name, index: Math.max(0, toneOrder.indexOf(name)) }))}
          rows={shown}
          months={months}
          collapse={collapse}
          corner={
            <ExpandAll allClosed={allClosed} onClick={() => collapse.setAll(teams, !allClosed)} />
          }
          onPerson={(id) => params.update({ person: id })}
        />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">{rt("rm.tree.empty")}</p>
      )}
      <PersonPanel
        person={selected}
        period="6"
        measure="project"
        onClose={() => params.update({ person: null })}
      />
    </>
  )
}
