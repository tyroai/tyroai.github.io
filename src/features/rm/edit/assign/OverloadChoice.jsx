import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { BTN } from "../ui"

function Option({ n, title, hint, children }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 p-4">
      <div className="text-sm font-semibold">
        <span className="me-1.5 text-muted-foreground tabular-nums">{n}.</span>
        {title}
      </div>
      <p className="text-[0.8125rem] text-muted-foreground">{hint}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">{children}</div>
    </div>
  )
}

/**
 * Kapasite aşımı kararı (şartname v6.2 decide): kişi kişi fazla mesai, sonra üç yol — fazla
 * mesaiyle ata (onay kutusuyla), bitişi ötele (sığacağı gün), kapasiteye sığdır (eksik kalan iş).
 */
export function OverloadChoice({ p, check, accept, onAccept, onPick, busy }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const dh = Math.max(1, +data.st.settings?.dayHours || 8)
  const nameOf = (rid) => {
    const r = data.st.resources.find((x) => x.id === rid)
    return fullName(dir, r?.name ?? rid)
  }
  const ot = check.items.reduce((s, x) => s + x.ot, 0)
  const lost = check.items.reduce((s, x) => s + x.lost, 0)
  return (
    <div className="grid gap-5">
      <p className="text-sm">
        {rt("rm.over.intro", { names: check.items.map((x) => nameOf(x.rid)).join(", ") })}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-[0.8125rem]">
          <thead className="bg-foreground/[0.03] text-[0.6875rem] uppercase tracking-[0.06em] text-foreground/65">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {rt("rm.assign.person")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {rt("rm.over.asked")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {rt("rm.over.overtime")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {rt("rm.over.days")}
              </th>
            </tr>
          </thead>
          <tbody>
            {check.items.map((x) => (
              <tr key={x.rid} className="border-t border-border/50">
                <th scope="row" className="px-3 py-2 text-start font-medium">
                  {nameOf(x.rid)}
                </th>
                <td className="px-3 py-2 text-end tabular-nums">
                  {rt("rm.unit.hours", { n: num(x.tot, locale) })}
                </td>
                <td className="px-3 py-2 text-end font-semibold tabular-nums text-danger-ink">
                  +{rt("rm.unit.hours", { n: num(x.ot, locale) })}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">{x.dd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 @[48rem]/edit:grid-cols-3">
        <Option
          n={1}
          title={rt("rm.over.ot")}
          hint={rt("rm.over.otHint", { h: num(ot, locale), g: num(ot / dh, locale, 1) })}
        >
          <label className="flex min-h-11 items-center gap-2 text-[0.8125rem]">
            <Checkbox checked={accept} onCheckedChange={(v) => onAccept(v === true)} />
            {rt("rm.over.accept")}
          </label>
          <Button
            variant="destructive"
            className={BTN}
            disabled={!accept || busy}
            onClick={() => onPick({ mode: "ot" })}
          >
            {rt("rm.over.ot")}
          </Button>
        </Option>
        <Option
          n={2}
          title={rt("rm.over.ext")}
          hint={
            check.Y
              ? rt("rm.over.extHint", {
                  a: day(toDay(p.end), locale, { year: true }),
                  b: day(check.Y, locale, { year: true }),
                })
              : rt("rm.over.extNone")
          }
        >
          {check.Y ? (
            <Button
              className={BTN}
              disabled={busy}
              onClick={() => onPick({ mode: "ext", Y: check.Y, fits: check.fits })}
            >
              {rt("rm.over.extDo", { d: day(check.Y, locale, { year: true }) })}
            </Button>
          ) : null}
        </Option>
        <Option
          n={3}
          title={rt("rm.over.fit")}
          hint={rt("rm.over.fitHint", { h: num(lost, locale) })}
        >
          <Button
            variant="outline"
            className={BTN}
            disabled={busy}
            onClick={() =>
              onPick({
                mode: "fit",
                fits: Object.fromEntries(check.items.map((x) => [x.rid, x.fit])),
              })
            }
          >
            {rt("rm.over.fit")}
          </Button>
        </Option>
      </div>
    </div>
  )
}
