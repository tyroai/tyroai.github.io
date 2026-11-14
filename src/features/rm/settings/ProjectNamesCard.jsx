import { useMemo, useState } from "react"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { projectNamePairs, renameProjects } from "@/features/rm/lib/edit/projectNames"
import { useRmEdit } from "../data/useRmEdit"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

/**
 * Proje adları: alt çizgili, eğik çizgili ya da "Uygulama Projesi" ekli adlara kısa öneri
 * (`cleanProjectName`); öneri düzenlenebilir, tek düğme hepsini tek kayıtta yazar (Geri al'lı).
 */
export function ProjectNamesCard() {
  const { rt } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const pairs = useMemo(() => projectNamePairs(data.raw), [data.raw])
  const [edits, setEdits] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const rows = pairs.map((x) => ({ ...x, nv: edits[x.pid] ?? x.nv }))
  const ready = rows.filter((x) => x.nv.trim() && x.nv.trim() !== String(x.old).trim())

  async function apply() {
    setBusy(true)
    setErr(null)
    try {
      await commit((S) => renameProjects(S, ready), rt("rm.pnames.done", { n: ready.length }))
      setEdits({})
    } catch (e) {
      setErr(editError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <RmCard
      icon={Folder01Icon}
      tone="violet"
      title={rt("rm.pnames.title")}
      sub={rt("rm.pnames.sub")}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{rt("rm.pnames.none")}</p>
      ) : (
        <>
          <ul className="grid gap-2">
            {rows.map((x) => (
              <li
                key={x.pid}
                className="grid items-center gap-x-4 gap-y-1 @[48rem]/rm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <span className="text-xs font-semibold text-foreground/70">{x.code}</span>
                <span className="truncate text-sm text-muted-foreground" title={x.old}>
                  {x.old}
                </span>
                <Input
                  value={x.nv}
                  onChange={(e) => setEdits((m) => ({ ...m, [x.pid]: e.target.value }))}
                  aria-label={rt("rm.pnames.input", { code: x.code })}
                  className="h-9 text-sm pointer-coarse:h-11"
                />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={apply}
              disabled={busy || ready.length === 0}
              className="h-9 bg-brand-fill-deep px-3.5 text-[0.8125rem] text-brand-on-brand hover:bg-brand-fill-deep pointer-coarse:h-11"
            >
              {rt("rm.pnames.apply", { n: ready.length })}
            </Button>
            {err && <p className="text-xs text-danger-ink">{err}</p>}
          </div>
        </>
      )}
    </RmCard>
  )
}
