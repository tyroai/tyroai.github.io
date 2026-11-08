import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ActionButton } from "@/components/common/ActionButton"
import PresentationBarChart01Icon from "@hugeicons/core-free-icons/PresentationBarChart01Icon"
import { useRmText } from "../data/useRmText"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { ExportButton } from "../common/ExportButton"
import { PersonPanel } from "../capacity/PersonPanel"
import { ProjectPanel } from "../projects/ProjectPanel"
import { HoursMixCard, MonthlyCapacityCard } from "./DetailCards"
import { KpiTiles } from "./KpiTiles"
import { MetricPanel } from "./MetricPanel"
import { OverviewFilters } from "./OverviewFilters"
import { IdleCard, OverloadedCard, TodoCard } from "./PeopleCards"
import { ScheduleRisk } from "./ScheduleRisk"
import { TeamCapacityCard, TeamHeatCard } from "./TeamCards"
import { TeamPanel } from "./TeamPanel"
import { useOverview } from "./useOverview"
import { GreetTitle } from "./Greeting"
import { OverviewSection } from "./OverviewSection"
import { OverviewStory } from "./Story"
import { useMe } from "@/hooks/useMe"
import { greetingKey } from "@/lib/greeting"
import { ovParams } from "@/features/rm/lib/overviewFilter"

/**
 * Genel Bakış: portföy ve ekip bu ay nasıl? Direktörün açılış ekranı. Filtre adreste; kartlara
 * basınca ayrıntı sağdaki panelde açılır (proje, kişi, ekip, gösterge), sayfadan çıkılmaz.
 */
export function OverviewPage() {
  const { rt, t } = useRmText()
  const { params, phone, data } = useRm()
  const me = useMe()
  const ov = useOverview()
  // Karşılama Anasayfa'yla aynı: saate göre selam ve ilk ad.
  const greet = t(greetingKey(new Date().getHours()))
  const nameOf = useMemo(() => {
    const m = new Map(data.st.resources.map((r) => [r.id, r.name]))
    return (rid) => m.get(rid) ?? rid
  }, [data.st])

  const toProject = (id) => ov.open("p", id)
  const toPerson = (id) => ov.open("person", id)
  const toTeam = (team) => ov.open("team", team)
  const toMetric = (key) => ov.open("metric", key)
  const project = ov.rows.find((r) => r.id === params.get("p")) ?? null
  const person = data.st.resources.find((r) => r.id === params.get("person")) ?? null

  return (
    <>
      <RmHead
        group={rt("rm.nav.overview")}
        title={<GreetTitle greet={greet} name={me.name} />}
        stamp={false}
        actions={
          <>
            {/* Telefonda ikinci eylemler yalnız ikon: başlık tek satırda kalsın. */}
            <ExportButton compact={phone} />
            <ActionButton
              tone="prominent"
              size="toolbar"
              iconOnly={phone}
              onClick={() => params.go("sunum", ovParams(ov.filter))}
              aria-label={phone ? rt("rm.present.start") : undefined}
            >
              <HugeiconsIcon icon={PresentationBarChart01Icon} strokeWidth={1.9} />
              {!phone && rt("rm.present.start")}
            </ActionButton>
          </>
        }
      />
      {/* Haplar yerine anlatı: değerler renkli ve kesik çizgili, ayrıntı ipucunda. */}
      <OverviewStory ov={ov} onMetric={toMetric} onTeam={toTeam} />
      <OverviewFilters ov={ov} />
      <KpiTiles ov={ov} onPick={toMetric} />
      {/* Kartlar konularına göre bölümlerde: ekip kapasitesi, kişiler, projeler. */}
      <OverviewSection id="rm-ov-capacity" title={rt("rm.ov.sec.capacity")}>
        <MonthlyCapacityCard ov={ov} onPick={toMetric} />
        <TeamCapacityCard ov={ov} onTeam={toTeam} onAll={() => toMetric("util")} />
        <TeamHeatCard ov={ov} onTeam={toTeam} />
      </OverviewSection>
      <OverviewSection id="rm-ov-people" title={rt("rm.ov.sec.people")}>
        <OverloadedCard ov={ov} onPerson={toPerson} />
        <IdleCard ov={ov} onPerson={toPerson} />
      </OverviewSection>
      <OverviewSection id="rm-ov-projects" title={rt("rm.ov.sec.projects")}>
        <TodoCard ov={ov} onProject={toProject} />
        <ScheduleRisk ov={ov} onProject={toProject} onMore={toMetric} />
        <HoursMixCard ov={ov} onProject={toProject} className="@[60rem]/rm:col-span-2" />
      </OverviewSection>
      <ProjectPanel row={project} nameOf={nameOf} onClose={ov.close} onPerson={toPerson} />
      <PersonPanel
        person={person}
        period={ov.filter.period}
        measure="project"
        onClose={ov.close}
        onProject={toProject}
      />
      <TeamPanel
        ov={ov}
        team={params.get("team") || null}
        onClose={ov.close}
        onPerson={toPerson}
        onProject={toProject}
      />
      <MetricPanel
        ov={ov}
        metric={params.get("metric")}
        onClose={ov.close}
        onProject={toProject}
        onPerson={toPerson}
        onTeam={toTeam}
      />
    </>
  )
}
