import { useState } from "react"
import WorkHistoryIcon from "@hugeicons/core-free-icons/WorkHistoryIcon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { notify } from "@/lib/notify"
import { listSnapshots } from "@/features/rm/lib/docStore"
import { stamp } from "@/features/rm/lib/format"
import { causeNote } from "@/lib/causeText"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

/** Plan geçmişi: kayıt öncesi anlık görüntüler; düzenleyen birini geri yükler. */
export function HistoryCard() {
  const { rt, t, locale } = useRmText()
  const { data, edit } = useRm()
  const [list, setList] = useState(null)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  async function load() {
    try {
      setList(await listSnapshots())
    } catch (err) {
      notify.error(rt("rm.history.failed"), { description: causeNote(t, "dataverse", err) })
    }
  }
  async function restore() {
    if (!target || busy) return
    setBusy(true)
    try {
      await data.restoreSnapshot(target.id, rt("rm.history.beforeRestore"))
      notify.success(rt("rm.history.restored"))
      setTarget(null)
      setList(null)
    } catch (err) {
      notify.error(rt("rm.history.restoreFailed"), {
        description: causeNote(t, "dataverse", err),
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <RmCard
      icon={WorkHistoryIcon}
      tone="slate"
      title={rt("rm.history.title")}
      action={!list ? { label: rt("rm.history.show"), onClick: load } : undefined}
    >
      <p className="max-w-[60ch] text-sm text-muted-foreground">{rt("rm.history.body")}</p>
      {list && (
        <ul className="mt-3 divide-y divide-border/60">
          {list.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {rt("rm.history.empty")}
            </li>
          )}
          {list.map((s) => (
            <li key={s.id} className="flex min-h-12 flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm tabular-nums">
                  {stamp(s.modifiedOn, locale)} · {s.modifiedBy || "—"}
                </span>
                {s.note && (
                  <span className="block truncate text-xs text-muted-foreground">{s.note}</span>
                )}
              </span>
              {edit && (
                <Button size="sm" variant="ghost" onClick={() => setTarget(s)}>
                  {rt("rm.history.restore")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(target)} onOpenChange={(o) => !busy && !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rt("rm.history.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {rt("rm.history.confirmBody", { time: stamp(target?.modifiedOn, locale) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={busy} autoFocus>
              {rt("rm.action.cancel")}
            </Button>
            <Button onClick={restore} disabled={busy}>
              {rt("rm.history.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RmCard>
  )
}
