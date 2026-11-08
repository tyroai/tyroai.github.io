import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addHoliday, deleteHoliday, updateHoliday } from "@/features/rm/lib/edit/settings"
import { toDay, weekday } from "@/lib/rm/engine/dates"
import { day } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { FIELD, Labeled } from "../matrix/fields"
import { BTN } from "../ui"

const SELECT = "w-full text-sm data-[size=default]:h-10 pointer-coarse:data-[size=default]:h-11"

/**
 * Resmî tatil ya da arife ekle/düzenle/sil (şartname "Resmî tatiller ve arifeler"). TR tatili
 * herkesi etkiler; başka ülkeninki yalnız o ülkedeki projelerin kural saatlerini.
 */
export default function HolidayDialog({ id = null, country = "TR", onClose }) {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const h0 = id ? (data.raw.holidays || []).find((x) => x.id === id) : null
  const [f, setF] = useState(() => ({
    date: h0?.date ?? "",
    name: h0?.name ?? "",
    type: h0?.type ?? "Tatil",
    country: h0?.country ?? country,
  }))
  const [confirmDel, setConfirmDel] = useState(false)
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const countries = data.raw.lk?.countries?.length
    ? data.raw.lk.countries
    : [{ code: "TR", name: "Türkiye" }]
  const cName = (c) => (locale === "tr" ? c.name : c.en || c.name) || c.code
  const n = toDay(f.date)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const effect =
    n == null
      ? null
      : weekday(n) > 4
        ? "weekend"
        : f.country !== "TR"
          ? "country"
          : f.type === "Tatil"
            ? "closed"
            : "half"

  async function run(fn, label) {
    setBusy(true)
    setErr(null)
    try {
      await commit(fn, label)
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  function onSave(e) {
    e.preventDefault()
    if (n == null) {
      setShown(true)
      return
    }
    const patch = { ...f, name: f.name.trim() }
    const label = rt("rm.hol.saved", { d: day(n, locale, { year: true }) })
    if (id) run((S) => updateHoliday(S, id, patch), label)
    else run((S) => addHoliday(S, patch), label)
  }

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt(confirmDel ? "rm.hol.deleteTitle" : id ? "rm.hol.editTitle" : "rm.hol.newTitle")}
      initialFocus="#rm-hol-date"
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {id && !confirmDel && (
            <Button
              variant="ghost"
              className={cn(BTN, "text-danger-ink hover:bg-danger/10 hover:text-danger-ink")}
              onClick={() => setConfirmDel(true)}
              disabled={busy}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
              {rt("rm.hol.delete")}
            </Button>
          )}
          <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
            {err}
          </p>
          <Button
            variant="outline"
            className={BTN}
            onClick={confirmDel ? () => setConfirmDel(false) : onClose}
            disabled={busy}
          >
            {rt("rm.action.cancel")}
          </Button>
          {confirmDel ? (
            <Button
              variant="destructive"
              className={BTN}
              disabled={busy}
              onClick={() => run((S) => deleteHoliday(S, id), rt("rm.hol.deleted"))}
            >
              {rt("rm.pform.deleteDo")}
            </Button>
          ) : (
            <Button type="submit" form="rm-hol" className={BTN} disabled={busy}>
              {rt("rm.edit.save")}
            </Button>
          )}
        </div>
      }
    >
      {confirmDel ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">
            {h0?.name || rt("rm.set.h.holiday")}{" "}
            {h0?.date ? `(${day(toDay(h0.date), locale, { year: true })})` : ""}
          </p>
          <p className="text-[0.8125rem] text-muted-foreground">{rt("rm.hol.deleteBody")}</p>
        </div>
      ) : (
        <form
          id="rm-hol"
          noValidate
          onSubmit={onSave}
          className="grid gap-4 @[36rem]/edit:grid-cols-2"
        >
          <Labeled id="rm-hol-date" label={`${rt("rm.set.h.date")} *`}>
            <Input
              id="rm-hol-date"
              type="date"
              value={f.date}
              aria-invalid={shown && n == null ? true : undefined}
              onChange={(e) => set("date", e.target.value)}
              className={FIELD}
            />
            {shown && n == null ? (
              <p className="text-xs text-danger-ink">{rt("rm.hol.err.date")}</p>
            ) : null}
          </Labeled>
          <Labeled id="rm-hol-type" label={rt("rm.set.h.type")}>
            <Select value={f.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger id="rm-hol-type" className={SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tatil">{rt("rm.set.h.holiday")}</SelectItem>
                <SelectItem value="Arife">{rt("rm.set.h.eve")}</SelectItem>
              </SelectContent>
            </Select>
          </Labeled>
          <Labeled id="rm-hol-name" label={rt("rm.set.h.name")}>
            <Input
              id="rm-hol-name"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              className={FIELD}
            />
          </Labeled>
          <Labeled id="rm-hol-country" label={rt("rm.set.country")}>
            <Select value={f.country} onValueChange={(v) => set("country", v)}>
              <SelectTrigger id="rm-hol-country" className={SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {cName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          {effect && (
            <p className="rounded-xl bg-foreground/[0.035] px-3.5 py-3 text-[0.8125rem] @[36rem]/edit:col-span-2 dark:bg-white/[0.05]">
              {rt(`rm.hol.effect.${effect}`)}
            </p>
          )}
        </form>
      )}
    </EditWindow>
  )
}
