import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LIMITS, readSettings, saveSettings, SETTING_KEYS } from "@/features/rm/lib/edit/settings"
import { num } from "@/features/rm/lib/format"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { FIELD, Labeled } from "../matrix/fields"
import { BTN } from "../ui"

/**
 * Kapasite varsayımları (şartname "Kapasite parametreleri"): plan başlangıcı, günlük saat,
 * danışman destek ve yazılımcıyla çalışma, kapanış günü, plan ufku. Sayılar sınırlara kırpılır.
 */
export default function AssumptionsDialog({ onClose }) {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const S0 = data.raw.settings || {}
  const [f, setF] = useState(() =>
    Object.fromEntries(SETTING_KEYS.map((k) => [k, S0[k] == null ? "" : String(S0[k])])),
  )
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const { values, errors } = readSettings(f)
  const ok = !Object.keys(errors).length
  const net = ok ? Math.max(0, values.dayHours - values.support - values.dev) : null

  async function onSave(e) {
    e.preventDefault()
    if (!ok) {
      setShown(true)
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await commit((S) => saveSettings(S, values), rt("rm.setx.saved"))
      onClose()
    } catch (er) {
      setErr(editError(er))
      setBusy(false)
    }
  }

  const field = (k, type = "number") => (
    <Labeled id={`rm-set-${k}`} label={rt(`rm.setx.f.${k}`)}>
      <Input
        id={`rm-set-${k}`}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        min={LIMITS[k]?.[0]}
        max={LIMITS[k]?.[1]}
        value={f[k]}
        aria-invalid={shown && errors[k] ? true : undefined}
        onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
        className={FIELD}
      />
      {shown && errors[k] ? (
        <p className="text-xs text-danger-ink">{rt(`rm.setx.err.${errors[k]}`)}</p>
      ) : LIMITS[k] ? (
        <p className="text-xs text-muted-foreground">
          {rt("rm.setx.range", { a: LIMITS[k][0], b: LIMITS[k][1] })}
        </p>
      ) : null}
    </Labeled>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt("rm.setx.title")}
      initialFocus="#rm-set-dayHours"
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
            {err}
          </p>
          <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
            {rt("rm.action.cancel")}
          </Button>
          <Button type="submit" form="rm-setx" className={BTN} disabled={busy}>
            {rt("rm.edit.save")}
          </Button>
        </div>
      }
    >
      <form
        id="rm-setx"
        noValidate
        onSubmit={onSave}
        className="grid gap-4 @[36rem]/edit:grid-cols-2"
      >
        {field("planStart", "date")}
        {field("horizonMonths")}
        {field("dayHours")}
        {field("closingDays")}
        {field("support")}
        {field("dev")}
        <p className="rounded-xl bg-foreground/[0.035] px-3.5 py-3 text-[0.8125rem] @[36rem]/edit:col-span-2 dark:bg-white/[0.05]">
          {net == null
            ? rt("rm.setx.netUnknown")
            : rt("rm.setx.net", { h: num(net, locale), d: num(values.dayHours, locale) })}
        </p>
      </form>
    </EditWindow>
  )
}
