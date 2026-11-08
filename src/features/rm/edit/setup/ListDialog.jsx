import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lkRewrite } from "@/features/rm/lib/edit/setup"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { BTN, CELL } from "../ui"
import { ExtraFields, ListRow } from "./ListRow"
import { applyListDraft, useListDraft } from "./useListDraft"

const BLANK = {
  teams: { name: "", grp: "cons", color: "#9CC3E6" },
  titles: { name: "", lvl: "L2" },
  prios: { name: "" },
  statuses: { name: "" },
  countries: { code: "", name: "", en: "", tz: "" },
}
const ZONES = [
  "Europe/Istanbul",
  "Europe/Amsterdam",
  "Europe/Bucharest",
  "Asia/Damascus",
  "Asia/Baghdad",
  "Asia/Dubai",
  "Asia/Almaty",
  "Asia/Shanghai",
  "America/Chicago",
  "America/New_York",
  "America/Regina",
  "America/Caracas",
  "Africa/Accra",
  "Africa/Lagos",
]

/**
 * Kurulum listesi (şartname "Kurulum tabloları"): taslakta ad değiştir, ekle, sırala, sil; tek
 * kayıtta yazılır. Ad değişikliği kullanıldığı her kayda yansır; kullanılan değer silinirken
 * kayıtlar seçilen değere taşınır. Sistem kayıtları (Yönetici, Müdür, Tamamlandı, TR) kilitli.
 */
export default function ListDialog({ kind, onClose }) {
  const { rt } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const d = useListDraft(data.raw, kind)
  const [fresh, setFresh] = useState(BLANK[kind])
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const bad = Object.keys(d.errors).length > 0
  const keyOf = (x) => (kind === "countries" ? x.code : x.name)

  function addRow() {
    const key = String(keyOf(fresh) || "").trim()
    if (!key) return
    d.add({
      ...fresh,
      name: String(fresh.name || "").trim(),
      ...(kind === "countries" ? { code: key.toUpperCase() } : {}),
    })
    setFresh(BLANK[kind])
  }

  async function onSave() {
    if (bad) {
      setShown(true)
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await commit(
        (S) => applyListDraft(S, kind, d.rows, d.gone, lkRewrite),
        rt("rm.setup.saved", { t: rt(`rm.setup.kind.${kind}`) }),
      )
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  const s = d.summary
  const effect = [
    s.renamed ? rt("rm.setup.effRenamed", { n: s.renamed }) : null,
    s.moved ? rt("rm.setup.effMoved", { n: s.moved }) : null,
    s.added ? rt("rm.setup.effAdded", { n: s.added }) : null,
    s.deleted ? rt("rm.setup.effDeleted", { n: s.deleted }) : null,
  ].filter(Boolean)

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt(`rm.setup.kind.${kind}`)}
      description={rt("rm.setup.hint")}
      size={kind === "teams" || kind === "countries" ? "xl" : "md"}
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <p
            role={err || (shown && bad) ? "alert" : undefined}
            className={
              err || (shown && bad)
                ? "min-w-0 flex-1 text-[0.8125rem] text-danger-ink"
                : "min-w-0 flex-1 text-xs text-muted-foreground"
            }
          >
            {err || (shown && bad ? rt("rm.setup.fix") : effect.join(" · ") || rt("rm.setup.hint"))}
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
      <div className="grid gap-5">
        <datalist id="rm-setup-tz">
          {ZONES.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
        <ul className="grid gap-1">
          {d.rows.map((x, i) => (
            <ListRow
              key={x.k}
              kind={kind}
              x={x}
              d={d}
              first={i === 0}
              last={i === d.rows.length - 1}
              used={x.orig != null ? d.use.get(x.orig) || 0 : 0}
              locked={d.locked(x)}
              error={shown ? d.errors[x.k] : null}
            />
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border/80 p-3">
          {kind === "countries" ? (
            <Input
              value={fresh.code}
              maxLength={2}
              onChange={(e) => setFresh((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="PK"
              aria-label={rt("rm.setup.code")}
              className={`${CELL} w-16 uppercase`}
            />
          ) : null}
          <Input
            value={fresh.name}
            onChange={(e) => setFresh((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addRow()}
            placeholder={rt("rm.setup.newName")}
            aria-label={rt("rm.setup.newName")}
            className={`${CELL} min-w-40 flex-1`}
          />
          <ExtraFields
            kind={kind}
            x={fresh}
            label={rt("rm.setup.newName")}
            onSet={(f, v) => setFresh((o) => ({ ...o, [f]: v }))}
          />
          <Button variant="outline" className={BTN} onClick={addRow}>
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
            {rt("rm.todo.add")}
          </Button>
        </div>
        {d.gone.length > 0 && (
          <section aria-labelledby="rm-setup-gone" className="grid gap-2">
            <h3 id="rm-setup-gone" className="text-sm font-semibold">
              {rt("rm.setup.gone")}
            </h3>
            <ul className="grid gap-2">
              {d.gone.map((g) => {
                const used = d.use.get(g.orig) || 0
                return (
                  <li
                    key={g.k}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-danger/[0.05] px-3 py-2 text-[0.8125rem]"
                  >
                    <span className="font-medium line-through">{keyOf(g)}</span>
                    {used ? (
                      <label className="flex flex-wrap items-center gap-2">
                        {rt("rm.setup.moveTo", { n: used })}
                        <select
                          value={g.to}
                          onChange={(e) => d.setTo(g.k, e.target.value)}
                          aria-invalid={shown && d.errors[g.k] ? true : undefined}
                          className="h-9 rounded-md border border-input bg-input/20 px-2 text-sm aria-invalid:border-destructive dark:bg-input/30 pointer-coarse:h-11"
                        >
                          <option value="">{rt("rm.setup.pick")}</option>
                          {d.rows.map((x) => (
                            <option key={x.k} value={x.k}>
                              {keyOf(x)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <span className="text-foreground/65">{rt("rm.setup.unused")}</span>
                    )}
                    <Button
                      variant="ghost"
                      className={`${BTN} ms-auto`}
                      onClick={() => d.restore(g.k)}
                    >
                      {rt("rm.setup.keep")}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </EditWindow>
  )
}
