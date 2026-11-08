import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { diffRows } from "@/features/rm/lib/edit/ops"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"

function Arrow() {
  return (
    <span aria-hidden="true" className="px-1 text-muted-foreground rtl:rotate-180">
      →
    </span>
  )
}

function Delta({ d }) {
  const { rt, locale } = useRmText()
  if (!d) return <span className="text-muted-foreground">{rt("rm.dates.same")}</span>
  return (
    <span className={cn("font-semibold", d > 0 ? "text-danger-ink" : "text-success-ink")}>
      {d > 0 ? "▲ +" : "▼ "}
      {num(d, locale, 1)}
    </span>
  )
}

function Cap({ x }) {
  const { rt, locale } = useRmText()
  const over = x.ov > 0
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[0.6875rem] font-medium whitespace-nowrap",
        over ? "bg-danger/10 text-danger-ink" : "bg-success/12 text-success-ink",
      )}
    >
      <HugeiconsIcon
        icon={over ? Alert02Icon : CheckmarkCircle02Icon}
        className="size-3.5"
        strokeWidth={2}
      />
      {over ? rt("rm.dates.over", { n: x.ov, h: num(x.oh, locale) }) : rt("rm.assign.fits")}
    </span>
  )
}

/** Önce/sonra: kişi kişi günlük saat, çalışma aralığı, toplam saat ve kapasite (v6.1). */
export function ChangeTable({ s0, s1 }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const rows = diffRows(s0, s1)
  if (!rows.length) {
    return <p className="text-[0.8125rem] text-muted-foreground">{rt("rm.dates.noHours")}</p>
  }
  const dh = Math.max(1, +data.st.settings?.dayHours || 8)
  const res = (rid) => data.st.resources.find((r) => r.id === rid)
  const range = (f, l) =>
    f != null ? `${day(f, locale)} – ${day(l, locale, { year: true })}` : "—"
  const T0 = rows.reduce((s, x) => s + x.t0, 0)
  const T1 = rows.reduce((s, x) => s + x.t1, 0)
  const perDay = (h) => rt("rm.assign.perDayN", { n: num(h, locale, 1) })
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border/60 @[44rem]/edit:block">
        <table className="w-full text-[0.8125rem]">
          <thead className="bg-foreground/[0.03] text-[0.6875rem] uppercase tracking-[0.06em] text-foreground/65">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {rt("rm.assign.person")}
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {rt("rm.dates.daily")}
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {rt("rm.dates.range")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {rt("rm.dates.total")}
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {rt("rm.assign.capacity")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const r = res(x.rid)
              return (
                <tr key={x.rid} className="border-t border-border/50">
                  <th scope="row" className="px-3 py-2 text-start font-medium">
                    {fullName(dir, r?.name ?? x.rid)}
                    <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                      {r?.team}
                    </span>
                  </th>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    <span className="text-muted-foreground">{num(x.h0, locale, 1)}</span>
                    <Arrow />
                    <b>{perDay(x.h1)}</b> <Delta d={Math.round((x.h1 - x.h0) * 10) / 10} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    <span className="text-muted-foreground">{range(x.f0, x.l0)}</span>
                    <Arrow />
                    {range(x.f1, x.l1)}
                  </td>
                  <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">
                    {num(x.t0, locale)} <Arrow />
                    <b>{rt("rm.unit.hours", { n: num(x.t1, locale) })}</b>
                  </td>
                  <td className="px-3 py-2">
                    <Cap x={x} />
                  </td>
                </tr>
              )
            })}
            <tr className="border-t border-border/70 bg-foreground/[0.02] font-semibold">
              <th scope="row" className="px-3 py-2 text-start">
                {rt("rm.x.total")}
              </th>
              <td />
              <td />
              <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">
                {num(T0, locale)} <Arrow />
                {rt("rm.unit.hours", { n: num(T1, locale) })}
              </td>
              <td className="px-3 py-2 text-xs font-normal text-muted-foreground">
                {rt("rm.assign.manDays", { n: num(T1 / dh, locale, 1) })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2 @[44rem]/edit:hidden">
        {rows.map((x) => {
          const r = res(x.rid)
          return (
            <li
              key={x.rid}
              className="grid gap-1 rounded-xl border border-border/60 p-3 text-[0.8125rem]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{fullName(dir, r?.name ?? x.rid)}</span>
                <Cap x={x} />
              </div>
              <div className="tabular-nums">
                <span className="text-muted-foreground">{num(x.h0, locale, 1)}</span>
                <Arrow />
                <b>{perDay(x.h1)}</b> <Delta d={Math.round((x.h1 - x.h0) * 10) / 10} />
              </div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {range(x.f1, x.l1)} · {num(x.t0, locale)} →{" "}
                {rt("rm.unit.hours", { n: num(x.t1, locale) })}
              </div>
            </li>
          )
        })}
        <li className="px-1 text-[0.8125rem] font-semibold tabular-nums">
          {rt("rm.x.total")}: {num(T0, locale)} → {rt("rm.unit.hours", { n: num(T1, locale) })} ·{" "}
          <span className="font-normal text-muted-foreground">
            {rt("rm.assign.manDays", { n: num(T1 / dh, locale, 1) })}
          </span>
        </li>
      </ul>
    </>
  )
}
