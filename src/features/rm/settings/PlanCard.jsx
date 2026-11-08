import { HugeiconsIcon } from "@hugeicons/react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon"
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import Task01Icon from "@hugeicons/core-free-icons/Task01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { Button } from "@/components/ui/button"
import { num, stamp } from "@/features/rm/lib/format"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

function downloadPlan(st, name) {
  const blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Şu anki plan: kaynağı, beş sayısı, son kayıt; JSON olarak indirilir (ham plan). */
export function PlanCard() {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const st = data.st
  const src = data.doc?.source
  const stats = [
    ["projects", st.projects.length, Folder01Icon],
    ["people", st.resources.length, UserGroupIcon],
    ["teams", new Set(st.resources.map((r) => r.team)).size, Building03Icon],
    ["rules", (st.asg || []).length, Task01Icon],
    ["holidays", (st.holidays || []).length, Calendar03Icon],
  ]
  return (
    <RmCard
      icon={DatabaseIcon}
      tone="brand"
      title={rt("rm.settings.current")}
      sub={src?.name || undefined}
    >
      <dl className="grid grid-cols-2 gap-2 @[36rem]/rm:grid-cols-3 @[60rem]/rm:grid-cols-5">
        {stats.map(([k, v, icon]) => (
          <div key={k} className="min-w-0 rounded-xl border border-border/60 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 truncate text-xs text-foreground/65">
              <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" strokeWidth={1.8} />
              {rt(`rm.settings.stat.${k}`)}
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-tight tabular-nums">
              {num(v, locale)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-3">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5 shrink-0" strokeWidth={1.8} />
          {rt("rm.settings.saved", {
            time: stamp(data.meta?.modifiedOn, locale),
            who: data.meta?.modifiedBy || "—",
          })}
        </p>
        <Button
          variant="outline"
          onClick={() =>
            downloadPlan(data.raw, `TyroRM_${new Date().toISOString().slice(0, 10)}.json`)
          }
          className="h-9 gap-1.5 pointer-coarse:h-11"
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={1.8} />
          {rt("rm.settings.export")}
        </Button>
      </div>
    </RmCard>
  )
}
