import { useCallback, useMemo } from "react"
import { isoWeek, toDay, toIso } from "@/lib/rm/engine/dates"
import { day } from "@/features/rm/lib/format"
import { anchorFor, columnsFor, shiftAnchor, ZOOMS } from "@/features/rm/lib/matrix"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useCollapse } from "../common/useTree"
import { matrixInsights } from "../shell/insights"
import { RmHead } from "../shell/RmHead"
import { useRm } from "../shell/RmContext"
import { PersonPanel } from "../capacity/PersonPanel"
import { ProjectPanel } from "../projects/ProjectPanel"
import { MatrixGrid } from "./MatrixGrid"
import { MatrixLegend } from "./MatrixLegend"
import { MatrixToolbar } from "./MatrixToolbar"
import { useCellEdit } from "./useCellEdit"
import { useFullscreen } from "./useFullscreen"
import { useMatrixExcel } from "./useMatrixExcel"
import { useMatrixGroups } from "./useMatrixGroups"

const MODES = ["project", "team", "person"]
const HINT = { project: "rm.cell.hint", team: "rm.cell.hintTeam", person: "rm.cell.hint" }

/**
 * Matris: kim hangi projede, hangi gün kaç saat? Proje, ekip ya da kişi bazlı; gün, hafta ya da ay.
 * Düzenleyici gün ve hafta hücresine saat yazar, satırın ⋮ menüsünden zamanlama, taşıma, çıkarma
 * yapar. Tam ekran aynı ağacı yerinde büyütür (kaydırma ve odak korunur); Excel ekrandakini indirir.
 */
export function MatrixPage() {
  const { rt, locale } = useRmText()
  const { data, derived, params, today, people: dir, edit, openEditor } = useRm()
  const { st, plan } = data
  const mode = MODES.includes(params.get("mode")) ? params.get("mode") : "project"
  const zoom = ZOOMS.includes(params.get("zoom")) ? params.get("zoom") : "week"
  const anchor = anchorFor(zoom, toDay(params.get("at")) ?? today)
  const team = params.get("team")
  const q = params.get("q")

  const cols = useMemo(() => columnsFor(plan, zoom, anchor), [plan, zoom, anchor])
  const { groups, over, nameOf } = useMatrixGroups({
    st,
    plan,
    cols,
    rows: derived.rows,
    dir,
    mode,
    team,
    q,
    rt,
    locale,
  })
  const cellEdit = useCellEdit({ data, people: dir, openEditor })
  const colLabel = useCallback(
    (col) =>
      zoom === "week"
        ? rt("rm.cell.week", { w: isoWeek(col.from) })
        : day(col.from, locale, { year: true }),
    [zoom, rt, locale],
  )
  const collapse = useCollapse()
  const fs = useFullscreen()
  const excel = useMatrixExcel({ groups, cols, mode, zoom, today })

  const foldable = groups.filter((g) => g.rows.length > 0).map((g) => g.key)
  const allClosed = foldable.length > 0 && foldable.every((k) => collapse.closed.has(k))
  const from = cols[0]?.from
  const to = cols[cols.length - 1]?.to
  const teams = [...new Set(st.resources.map((r) => r.team))]
  const selectedProject = derived.rows.find((r) => r.id === params.get("p")) ?? null
  const selectedPerson = st.resources.find((r) => r.id === params.get("person")) ?? null
  // Ayrıntı paneli sayfada açılır: tam ekranın altında kalmasın diye önce tam ekrandan çıkılır.
  const openProject = (id) => {
    fs.exit()
    params.update({ p: id, person: null })
  }
  const openPerson = (id) => {
    fs.exit()
    params.update({ person: id, p: null })
  }

  return (
    <>
      <RmHead
        group={rt("rm.group.portfolio")}
        title={rt("rm.nav.matrix")}
        insights={matrixInsights({ from, to, over, byPerson: mode !== "project" }, rt, locale, () =>
          params.update({ mode: "person", team: null }),
        )}
      />
      <section
        aria-label={fs.full ? rt("rm.nav.matrix") : undefined}
        className={cn(
          fs.full
            ? "@container/rm fixed inset-0 z-[45] flex flex-col gap-3 bg-background p-3 sm:p-5 shortest:gap-2 shortest:p-2"
            : "contents",
        )}
      >
        <MatrixToolbar
          lead={
            fs.full ? (
              <p className="me-2 flex items-baseline gap-2 text-base font-semibold">
                {rt("rm.nav.matrix")}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  {rt("rm.matrix.answerWindow", {
                    from: day(from, locale),
                    to: day(to, locale, { year: true }),
                  })}
                </span>
              </p>
            ) : null
          }
          mode={mode}
          zoom={zoom}
          q={q}
          team={team}
          teams={teams}
          fold={foldable.length ? { allClosed } : null}
          busy={excel.busy}
          full={fs.full}
          on={{
            mode: (v) => params.update({ mode: v === "project" ? null : v, team: null }),
            zoom: (v) => params.update({ zoom: v === "week" ? null : v }),
            step: (d) => params.update({ at: toIso(shiftAnchor(zoom, anchor, d)) }),
            today: () => params.update({ at: null }),
            search: (v) => params.update({ q: v }),
            team: (v) => params.update({ team: v }),
            toggleAll: () => collapse.setAll(foldable, !allClosed),
            excel: excel.run,
            full: fs.full ? fs.exit : fs.enter,
          }}
        />
        {groups.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground dark:bg-white/[0.04]">
            {rt("rm.matrix.empty")}
          </p>
        ) : (
          <MatrixGrid
            mode={mode}
            zoom={zoom}
            cols={cols}
            groups={groups}
            caption={rt("rm.nav.matrix")}
            today={today}
            collapse={collapse}
            full={fs.full}
            onProject={openProject}
            onPerson={openPerson}
            onTeam={(t) => params.update({ team: t === team ? null : t })}
            team={team}
            edit={edit ? { cells: zoom !== "month", ...cellEdit, colLabel } : null}
          />
        )}
        <MatrixLegend
          zoom={zoom}
          hint={rt(
            edit ? (zoom === "month" ? "rm.cell.hintMonth" : HINT[mode]) : "rm.matrix.readOnly",
          )}
        />
      </section>
      <ProjectPanel
        row={selectedProject}
        nameOf={nameOf}
        onClose={() => params.update({ p: null })}
      />
      <PersonPanel
        person={selectedPerson}
        period="6"
        measure="project"
        onClose={() => params.update({ person: null })}
      />
    </>
  )
}
