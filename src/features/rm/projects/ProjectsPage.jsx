import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ActionButton } from "@/components/common/ActionButton"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { SearchField } from "../common/TreeTools"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  filterProjects,
  PROJECT_TABS,
  sortProjects,
  tabMatch,
} from "@/features/rm/lib/projectFilters"
import { catLabel } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { projectInsights } from "../shell/insights"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { ProjectList } from "./ProjectList"
import { ProjectPanel } from "./ProjectPanel"
import { Count } from "../overview/ScheduleRisk"

const SIGS = ["risk", "unstaffed", "endingSoon", "startingSoon"]
const ALL = "__all"

/** Projeler: tek araç satırı, sayılı sekmeler, kartsız liste; ayrıntı sağ kenarda. */
export function ProjectsPage() {
  const { rt } = useRmText()
  const { derived, params, data, phone, edit, openEditor } = useRm()
  const st = data.st
  const nameOf = useMemo(() => {
    const m = new Map(st.resources.map((r) => [r.id, r.name]))
    return (rid) => m.get(rid) ?? rid
  }, [st])
  const f = {
    tab: PROJECT_TABS.includes(params.get("tab")) ? params.get("tab") : "open",
    sig: SIGS.includes(params.get("sig")) ? params.get("sig") : "",
    cat: params.get("cat"),
    q: params.get("q"),
  }
  const rows = useMemo(
    () => sortProjects(filterProjects(derived.rows, f, nameOf)),
    // f alanları adresten; nesnenin kendisi her çizimde yeni.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [derived.rows, f.tab, f.sig, f.cat, f.q, nameOf],
  )
  const counts = Object.fromEntries(
    PROJECT_TABS.map((t) => [t, derived.rows.filter((r) => tabMatch(r, t)).length]),
  )
  const open = derived.rows.filter((r) => r.phase !== "done")
  const risk = open.filter((r) => r.signals.some((s) => ["overdue", "late"].includes(s))).length
  const unstaffed = open.filter((r) => r.signals.includes("unstaffed")).length
  const selected = derived.rows.find((r) => r.id === params.get("p")) ?? null
  const cats = (st.pcats || []).map((c) => c.name)

  return (
    <>
      <RmHead
        group={rt("rm.group.portfolio")}
        title={rt("rm.nav.projects")}
        insights={projectInsights({ open: open.length, risk, unstaffed }, rt, (sig) =>
          params.update({ sig, tab: null }),
        )}
        actions={
          edit && (
            <ActionButton
              tone="prominent"
              size="toolbar"
              onClick={() => openEditor({ kind: "project", pid: null })}
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              {rt("rm.pform.newTitle")}
            </ActionButton>
          )
        }
      />
      <div className={cn(phone && "sticky -top-4 z-20 -mx-4 bg-background px-4")}>
        <TextTabs
          kind="tabs"
          rail
          size={phone ? "md" : "lg"}
          label={rt("rm.nav.projects")}
          idPrefix="rm-proj-tab"
          controls="rm-proj-panel"
          options={PROJECT_TABS.map((t) => ({
            value: t,
            label: rt(`rm.projects.tab.${t}`),
            count: <Count n={counts[t]} />,
          }))}
          value={f.tab}
          onChange={(tab) => params.update({ tab: tab === "open" ? null : tab })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={f.q}
          onChange={(q) => params.update({ q })}
          label={rt("rm.projects.search")}
          className="min-w-[12rem] @[48rem]/rm:max-w-sm"
        />
        <Select
          value={f.cat || ALL}
          onValueChange={(v) => params.update({ cat: v === ALL ? null : v })}
        >
          <SelectTrigger
            className="h-control w-auto min-w-[9rem] rounded-full"
            aria-label={rt("rm.projects.category")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.projects.categoryAll")}</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c} value={c}>
                {catLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={f.sig || ALL}
          onValueChange={(v) => params.update({ sig: v === ALL ? null : v })}
        >
          <SelectTrigger
            className="h-control w-auto min-w-[9rem] rounded-full"
            aria-label={rt("rm.projects.attention")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{rt("rm.projects.attentionAll")}</SelectItem>
            {SIGS.map((s) => (
              <SelectItem key={s} value={s}>
                {rt(`rm.projects.sig.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(f.q || f.cat || f.sig) && (
          <button
            type="button"
            onClick={() => params.update({ q: null, cat: null, sig: null })}
            className="inline-flex h-control items-center gap-1 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
            {rt("rm.projects.clear")}
          </button>
        )}
        <span className="ms-auto text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {rt("rm.projects.count", { n: rows.length })}
        </span>
      </div>
      <div
        id="rm-proj-panel"
        role="tabpanel"
        aria-labelledby={`rm-proj-tab-${f.tab}`}
        className="min-w-0"
      >
        <ProjectList
          rows={rows}
          nameOf={nameOf}
          selectedId={selected?.id}
          onOpen={(id) => params.update({ p: id })}
        />
      </div>
      <ProjectPanel row={selected} nameOf={nameOf} onClose={() => params.update({ p: null })} />
    </>
  )
}
