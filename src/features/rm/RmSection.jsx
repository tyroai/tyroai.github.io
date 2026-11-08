import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { usePhoneLayout } from "@/features/selfservice/layout/phone"
import { PageShell } from "@/components/layout/PageShell"
import { todayDay } from "@/lib/rm/engine/dates"
import { periodRange } from "@/lib/rm/metrics"
import { overview, projectRows, teamGrid } from "@/lib/rm/portfolio"
import { cn } from "@/lib/utils"
import { useRmAccess } from "./data/useRmAccess"
import { useRmData } from "./data/useRmData"
import { useRmPeople } from "./data/useRmPeople"
import { projectClockCities, setRmClockDefaults } from "@/lib/rm/rmClock"
import { useRmText } from "./data/useRmText"
import { RmAccessGate } from "./shell/RmAccessGate"
import { RmContext } from "./shell/RmContext"
import { RmNotices } from "./shell/RmNotices"
import { RmEmpty, RmError, RmLoading } from "./shell/RmStates"
import { useRmParams } from "./shell/useRmParams"
import { rememberView, viewOf } from "./shell/views"
import { OverviewPage } from "./overview/OverviewPage"
import { ProjectsPage } from "./projects/ProjectsPage"
import { CapacityPage } from "./capacity/CapacityPage"

const MatrixPage = lazy(() =>
  import("./matrix/MatrixPage").then((m) => ({ default: m.MatrixPage })),
)
const ResourcesPage = lazy(() =>
  import("./resources/ResourcesPage").then((m) => ({ default: m.ResourcesPage })),
)

const PresentMode = lazy(() => import("./present/PresentMode"))
// Düzenleme pencereleri yalnız düzenleyiciye ve ilk açılışta iner.
const RmEditors = lazy(() => import("./edit/RmEditors"))
const SettingsPage = lazy(() => import("./settings/SettingsPage"))

/**
 * tyroRM bölümü (`/rm?view=…`): aynı kabuk, aynı header ve sohbet; sol menü bölümün sayfalarına
 * döner. Kapı fail-closed: cevap gelene dek hiçbir şey çizilmez, yetkisiz "Erişim iste" görür.
 */
export default function RmSection() {
  const access = useRmAccess()
  if (access.state === "pending") return null
  if (access.state !== "granted")
    return <RmAccessGate state={access.state} detail={access.detail} />
  return <RmWorkspace edit={access.edit} />
}

function RmWorkspace({ edit }) {
  const rootRef = useRef(null)
  const phone = usePhoneLayout(rootRef)
  const params = useRmParams(edit)
  const data = useRmData()
  const { rt } = useRmText()
  const today = todayDay()
  const { st, plan, checkFresh } = data
  const people = useRmPeople(st)
  const [editor, setEditor] = useState(null)

  const derived = useMemo(() => {
    if (!st || !plan) return null
    const rows = projectRows(st, plan, today)
    const { from, to } = periodRange(st, plan, "6", today)
    const grid = teamGrid(st, plan, from, to, "project")
    return { rows, grid, ov: overview(st, plan, today, rows, grid) }
  }, [st, plan, today])
  // Dünya saati tyroRM'de açık projelerin ülkeleriyle açılır (çentikteki pencere okur).
  useEffect(() => {
    if (derived) setRmClockDefaults(projectClockCities(derived.rows, st?.lk?.countries))
  }, [derived, st])

  const view = params.view
  useEffect(() => {
    if (edit) rememberView(view)
  }, [edit, view])
  // Sayfa geçişinde ucuz tazelik sorusu (304); sürekli yoklama yok.
  useEffect(() => {
    checkFresh()
  }, [view, checkFresh])
  const label = rt(viewOf(view, edit)?.label ?? "rm.nav.overview")
  useEffect(() => {
    const prev = document.title
    document.title = `${label} · tyroRM`
    return () => {
      document.title = prev
    }
  }, [label])

  const ctx = useMemo(
    () => ({ edit, params, data, derived, today, phone, rootRef, people, openEditor: setEditor }),
    [edit, params, data, derived, today, phone, people],
  )

  let body
  if (data.status === "loading") body = <RmLoading />
  else if (data.status === "error") body = <RmError error={data.error} onRetry={data.reload} />
  else if (!st && view !== "ayarlar") body = <RmEmpty />
  else if (view === "projeler") body = <ProjectsPage />
  else if (view === "kapasite") body = <CapacityPage />
  else if (view === "matris") body = <MatrixPage />
  else if (view === "kaynaklar") body = <ResourcesPage />
  else if (view === "ayarlar") body = <SettingsPage />
  else body = <OverviewPage />

  return (
    <RmContext.Provider value={ctx}>
      <PageShell
        ref={rootRef}
        className={cn(
          "@container/rm flex h-full flex-col overflow-y-auto overflow-x-hidden pb-12",
          phone ? "gap-4" : "gap-6",
        )}
      >
        <RmNotices />
        <Suspense fallback={<RmLoading />}>{body}</Suspense>
      </PageShell>
      {view === "sunum" && st && derived && (
        <Suspense fallback={null}>
          <PresentMode />
        </Suspense>
      )}
      {edit && editor && st && (
        <Suspense fallback={null}>
          <RmEditors editor={editor} onChange={setEditor} />
        </Suspense>
      )}
    </RmContext.Provider>
  )
}
