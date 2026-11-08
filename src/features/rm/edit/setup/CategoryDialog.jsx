import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uid } from "@/features/rm/lib/edit/ops"
import { applyCatDraft } from "@/features/rm/lib/edit/setup"
import { teamOptions } from "@/features/rm/lib/teamAliases"
import { cn } from "@/lib/utils"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { BTN, CELL } from "../ui"

const ICON =
  "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-30 pointer-coarse:size-11"
const lower = (s) =>
  String(s || "")
    .trim()
    .toLocaleLowerCase("tr-TR")

/**
 * Proje kategorileri (şartname v5.9 + v6.0 kategori ekipleri + v6.6 renkler): ad (projelere
 * yansır), renk (açık tona çevrilir; proje rengi ilk kategoriden), ekipler (Kişi ata ve
 * simülasyon bu ekiplerden önerir), sıra, sil (projelerden düşer). Tek kayıtta yazılır.
 */
export default function CategoryDialog({ onClose }) {
  const { rt } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const raw = data.raw
  // Birleşen ekipler tek hap (AI): ikisi birlikte seçilir.
  const teams = teamOptions((raw.lk?.teams || []).map((t) => t.name))
  const [rows, setRows] = useState(() =>
    (raw.pcats || []).map((c) => ({
      ...c,
      teams: (c.teams || []).slice(),
      k: uid(),
      orig: c.name,
    })),
  )
  const [gone, setGone] = useState([])
  const [fresh, setFresh] = useState({ name: "", color: "#A9C8EC" })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [shown, setShown] = useState(false)
  const use = useMemo(() => {
    const m = new Map()
    for (const c of raw.pcats || [])
      m.set(c.name, raw.projects.filter((p) => (p.cats || []).includes(c.name)).length)
    return m
  }, [raw])
  const errors = useMemo(() => {
    const e = {}
    const seen = new Set()
    for (const x of rows) {
      if (!x.name.trim()) e[x.k] = "required"
      else if (seen.has(lower(x.name))) e[x.k] = "dup"
      seen.add(lower(x.name))
    }
    return e
  }, [rows])
  const set = (k, patch) => setRows((rs) => rs.map((x) => (x.k === k ? { ...x, ...patch } : x)))
  const move = (k, dd) =>
    setRows((rs) => {
      const i = rs.findIndex((x) => x.k === k)
      const j = i + dd
      if (j < 0 || j >= rs.length) return rs
      const a = rs.slice()
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  const removed = gone.reduce((s, g) => s + (use.get(g) || 0), 0)

  async function onSave() {
    if (Object.keys(errors).length) {
      setShown(true)
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await commit(
        (S) => applyCatDraft(S, rows, gone),
        rt("rm.setup.saved", { t: rt("rm.set.cats") }),
      )
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt("rm.set.cats")}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
            {err || (shown && Object.keys(errors).length ? rt("rm.setup.fix") : "")}
            {!err && !shown && removed ? (
              <span className="text-muted-foreground">
                {rt("rm.setup.catRemoved", { n: removed })}
              </span>
            ) : null}
          </p>
          <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
            {rt("rm.action.cancel")}
          </Button>
          <Button className={BTN} onClick={onSave} disabled={busy}>
            {rt("rm.edit.save")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <p className="text-[0.8125rem] text-muted-foreground">{rt("rm.setup.catHint")}</p>
        <ul className="grid gap-2">
          {rows.map((x, i) => (
            <li
              key={x.k}
              className={cn(
                "grid gap-2 rounded-2xl border border-border/60 p-3",
                shown && errors[x.k] && "ring-1 ring-inset ring-danger/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={x.color || "#A9C8EC"}
                  onChange={(e) => set(x.k, { color: e.target.value })}
                  aria-label={`${x.name}: ${rt("rm.setup.color")}`}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 pointer-coarse:h-11"
                />
                <Input
                  value={x.name}
                  maxLength={40}
                  onChange={(e) => set(x.k, { name: e.target.value })}
                  aria-label={rt("rm.setup.name")}
                  aria-invalid={shown && errors[x.k] ? true : undefined}
                  className={`${CELL} min-w-40 flex-1`}
                />
                <span className="text-xs tabular-nums text-foreground/65">
                  {rt("rm.setup.catUsed", { n: x.orig != null ? use.get(x.orig) || 0 : 0 })}
                </span>
                <div className="ms-auto flex items-center">
                  <button
                    type="button"
                    className={ICON}
                    disabled={i === 0}
                    onClick={() => move(x.k, -1)}
                    aria-label={rt("rm.todo.up")}
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className={ICON}
                    disabled={i === rows.length - 1}
                    onClick={() => move(x.k, 1)}
                    aria-label={rt("rm.setup.down")}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className={cn(ICON, "hover:bg-danger/10 hover:text-danger-ink")}
                    onClick={() => {
                      setRows((rs) => rs.filter((y) => y.k !== x.k))
                      if (x.orig != null) setGone((g) => [...g, x.orig])
                    }}
                    aria-label={rt("rm.setup.removeOf", { n: x.name || "—" })}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
              <div
                role="group"
                aria-label={`${x.name}: ${rt("rm.set.teams")}`}
                className="flex flex-wrap gap-1.5"
              >
                {teams.map((t) => {
                  const on = t.names.every((n) => x.teams.includes(n))
                  return (
                    <button
                      key={t.label}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set(x.k, {
                          teams: on
                            ? x.teams.filter((z) => !t.names.includes(z))
                            : [...new Set([...x.teams, ...t.names])],
                        })
                      }
                      className={cn(
                        "h-7 rounded-full px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
                        on
                          ? "bg-foreground/[0.08] font-semibold text-foreground dark:bg-white/[0.12]"
                          : "text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
                {!x.teams.length ? (
                  <span className="self-center text-xs text-foreground/65">
                    {rt("rm.set.allTeams")}
                  </span>
                ) : null}
              </div>
              {shown && errors[x.k] ? (
                <p className="text-xs text-danger-ink">{rt(`rm.setup.err.${errors[x.k]}`)}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border/80 p-3">
          <input
            type="color"
            value={fresh.color}
            onChange={(e) => setFresh((f) => ({ ...f, color: e.target.value }))}
            aria-label={rt("rm.setup.color")}
            className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 pointer-coarse:h-11"
          />
          <Input
            value={fresh.name}
            maxLength={40}
            onChange={(e) => setFresh((f) => ({ ...f, name: e.target.value }))}
            placeholder={rt("rm.setup.newCat")}
            aria-label={rt("rm.setup.newCat")}
            className={`${CELL} min-w-40 flex-1`}
          />
          <Button
            variant="outline"
            className={BTN}
            onClick={() => {
              if (!fresh.name.trim()) return
              setRows((rs) => [
                ...rs,
                { name: fresh.name.trim(), color: fresh.color, teams: [], k: uid(), orig: null },
              ])
              setFresh({ name: "", color: "#A9C8EC" })
            }}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
            {rt("rm.todo.add")}
          </Button>
        </div>
      </div>
    </EditWindow>
  )
}
