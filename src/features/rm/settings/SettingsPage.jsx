import { useRmText } from "../data/useRmText"
import { settingsInsights } from "../shell/insights"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { HistoryCard } from "./HistoryCard"
import { ImportCard } from "./ImportCard"
import { PlanCard } from "./PlanCard"
import { AssumptionsView } from "./AssumptionsView"
import { HolidaysView } from "./HolidaysView"
import { ProjectNamesCard } from "./ProjectNamesCard"
import { NamesCard } from "./NamesCard"
import { SetupView } from "./SetupView"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { cn } from "@/lib/utils"

const TABS = ["data", "assumptions", "holidays", "setup"]

/** Ayarlar › Veri (yalnız düzenleyen): şu anki plan, içe aktar, plan geçmişi, dışa aktar. */
export default function SettingsPage() {
  const { rt } = useRmText()
  const { data, edit, params, phone } = useRm()
  if (!edit) return null
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "data"
  const st = data.st
  const src = data.doc?.source
  return (
    <>
      <RmHead
        group={rt("rm.group.system")}
        title={rt("rm.nav.settings")}
        insights={settingsInsights(st, src, rt)}
      />
      <div className={cn(phone && "sticky -top-4 z-20 -mx-4 bg-background px-4")}>
        <TextTabs
          kind="tabs"
          rail
          size={phone ? "md" : "lg"}
          label={rt("rm.nav.settings")}
          idPrefix="rm-set-tab"
          controls="rm-set-panel"
          options={TABS.map((t) => ({ value: t, label: rt(`rm.set.tab.${t}`) }))}
          value={tab}
          onChange={(t) => params.update({ tab: t === "data" ? null : t })}
        />
      </div>
      <div
        id="rm-set-panel"
        role="tabpanel"
        aria-labelledby={`rm-set-tab-${tab}`}
        className="flex min-w-0 flex-col gap-6"
      >
        {tab === "assumptions" && st && <AssumptionsView />}
        {tab === "holidays" && st && <HolidaysView />}
        {tab === "setup" && st && <SetupView />}
        {tab === "data" && st && <PlanCard />}
        {tab === "data" && st && <NamesCard />}
        {tab === "data" && st && <ProjectNamesCard />}
        {tab === "data" && <ImportCard />}
        {tab === "data" && data.meta && data.meta.id !== "dev" && <HistoryCard />}
        {tab !== "data" && !st && (
          <p className="text-sm text-muted-foreground">{rt("rm.empty.title")}</p>
        )}
      </div>
    </>
  )
}
