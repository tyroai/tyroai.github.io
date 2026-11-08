import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import FileImportIcon from "@hugeicons/core-free-icons/FileImportIcon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { notify } from "@/lib/notify"
import { day, num } from "@/features/rm/lib/format"
import { applyFixes, inspectPlan, readPlanText, wrapPlan } from "@/features/rm/lib/importPlan"
import { causeNote } from "@/lib/causeText"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

function Diff({ diff, rt, locale }) {
  const line = (key, list) =>
    list.length > 0 && (
      <li>
        {rt(key, { n: list.length })}:{" "}
        <span className="text-muted-foreground">
          {list.slice(0, 8).join(", ")}
          {list.length > 8 ? " …" : ""}
        </span>
      </li>
    )
  return (
    <ul className="grid gap-1 text-sm">
      {line("rm.import.diff.addedProjects", diff.addedProjects)}
      {line("rm.import.diff.removedProjects", diff.removedProjects)}
      {line("rm.import.diff.changedDates", diff.changedDates)}
      {line("rm.import.diff.addedPeople", diff.addedPeople)}
      {line("rm.import.diff.removedPeople", diff.removedPeople)}
      <li>
        {rt("rm.import.diff.rules", { a: diff.rules[0], b: diff.rules[1] })} ·{" "}
        {rt("rm.import.diff.hours", {
          a: num(diff.hours[0], locale),
          b: num(diff.hours[1], locale),
        })}
      </li>
    </ul>
  )
}

/**
 * İçe aktar (köprü): dosya seçilir, önce kuru çalıştırma raporu görünür (sayılar, veri uyarıları,
 * düzeltmeler, mevcut plana göre fark); "Planın yerine koy" önce anlık görüntü alır.
 */
export function ImportCard() {
  const { rt, t, locale } = useRmText()
  const { data, params } = useRm()
  const inputRef = useRef(null)
  const [pick, setPick] = useState(null)
  const [fixOff, setFixOff] = useState([])
  const [olderOk, setOlderOk] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const text = await file.text()
    const parsed = readPlanText(text)
    if (!parsed.ok) {
      setPick({ file, error: parsed.error })
      return
    }
    const report = inspectPlan(parsed.plan, {
      current: data.raw,
      currentSource: data.doc?.source,
      fileModified: file.lastModified,
    })
    setFixOff([])
    setOlderOk(false)
    setPick({ file, plan: parsed.plan, report })
  }

  async function apply() {
    if (!pick?.plan || busy) return
    setBusy(true)
    try {
      const fixes = pick.report.fixes.map((f) => f.id).filter((id) => !fixOff.includes(id))
      const plan = applyFixes(pick.plan, fixes)
      const source = {
        name: pick.file.name,
        modified: new Date(pick.file.lastModified).toISOString(),
        importedAt: new Date().toISOString(),
        fixes,
      }
      await data.replacePlan(wrapPlan(plan, source), rt("rm.import.snapshotNote"))
      notify.success(rt("rm.import.done"))
      setPick(null)
      setConfirm(false)
      params.go("genel")
    } catch (err) {
      notify.error(rt(err?.code === "conflict" ? "rm.import.conflict" : "rm.import.failed"), {
        description: err?.code === "conflict" ? undefined : causeNote(t, "dataverse", err),
      })
      setConfirm(false)
    } finally {
      setBusy(false)
    }
  }

  const rep = pick?.report
  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-xs sm:p-5"
      aria-labelledby="rm-import-title"
    >
      <div className="flex flex-wrap items-start gap-3">
        <IconTile icon={FileImportIcon} tone="sky" />
        <div className="min-w-0 flex-1">
          <h2
            id="rm-import-title"
            className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em]"
          >
            {rt("rm.import.title")}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">{rt("rm.import.body")}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={onFile}
          aria-label={rt("rm.import.pick")}
          tabIndex={-1}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="h-9 gap-1.5 pointer-coarse:h-11"
        >
          <HugeiconsIcon icon={FileImportIcon} className="size-4" strokeWidth={1.8} />
          {rt("rm.import.pick")}
        </Button>
      </div>

      {pick?.error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          {rt(`rm.import.error.${pick.error}`, { name: pick.file.name })}
        </p>
      )}

      {rep && (
        <div className="mt-4 grid gap-4">
          <p className="text-sm">
            <span className="font-medium">{pick.file.name}</span>{" "}
            <span className="text-muted-foreground">
              · {day(Math.floor(pick.file.lastModified / 864e5), locale, { year: true })}
            </span>
          </p>
          <dl className="grid grid-cols-3 gap-2 @[40rem]/rm:grid-cols-7">
            {["projects", "people", "rules", "holidays", "actions", "risks", "hours"].map((k) => (
              <div key={k} className="rounded-2xl bg-foreground/[0.03] px-3 py-2.5">
                <dt className="text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {rt(`rm.import.count.${k}`)}
                </dt>
                <dd className="text-lg font-semibold tabular-nums">{num(rep.counts[k], locale)}</dd>
              </div>
            ))}
          </dl>
          {rep.warnings.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {rt("rm.import.warnings")}
              </h3>
              <ul className="grid gap-1.5">
                {rep.warnings.map((w) => (
                  <li key={w.key} className="flex items-start gap-2 text-sm">
                    <HugeiconsIcon
                      icon={Alert02Icon}
                      className="mt-0.5 size-4 shrink-0 text-warning-ink"
                      strokeWidth={1.8}
                    />
                    <span>
                      {rt(`rm.import.warn.${w.key}`, {
                        n: w.n,
                        list: (w.names || w.codes || []).join(", "),
                        date: w.day != null ? day(w.day, locale, { year: true }) : "—",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rep.fixes.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {rt("rm.import.fixes")}
              </h3>
              {rep.fixes.map((f) => (
                <label key={f.id} className="flex min-h-10 items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={!fixOff.includes(f.id)}
                    onCheckedChange={(v) =>
                      setFixOff((cur) => (v ? cur.filter((x) => x !== f.id) : [...cur, f.id]))
                    }
                  />
                  {rt(`rm.import.fix.${f.id}`, { teams: f.teams.join(", ") })}
                </label>
              ))}
            </div>
          )}
          {rep.diff && (
            <div>
              <h3 className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {rt("rm.import.diff")}
              </h3>
              <Diff diff={rep.diff} rt={rt} locale={locale} />
            </div>
          )}
          {rep.older && (
            <label className="flex min-h-10 items-center gap-2.5 rounded-2xl bg-warning/10 px-3 py-2 text-sm text-warning-ink">
              <Checkbox checked={olderOk} onCheckedChange={(v) => setOlderOk(Boolean(v))} />
              {rt("rm.import.older")}
            </label>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPick(null)}>
              {rt("rm.action.cancel")}
            </Button>
            <Button
              onClick={() => setConfirm(true)}
              disabled={rep.older && !olderOk}
              className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110"
            >
              {rt("rm.import.apply")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirm} onOpenChange={(o) => !busy && setConfirm(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rt("rm.import.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {rt(data.meta ? "rm.import.confirmBody" : "rm.import.confirmFirst")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)} disabled={busy} autoFocus>
              {rt("rm.action.cancel")}
            </Button>
            <Button
              onClick={apply}
              disabled={busy}
              className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110"
            >
              {rt(busy ? "rm.import.applying" : "rm.import.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
