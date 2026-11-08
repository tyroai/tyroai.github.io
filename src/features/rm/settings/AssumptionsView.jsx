import SlidersHorizontalIcon from "@hugeicons/core-free-icons/SlidersHorizontalIcon"
import UserTime01Icon from "@hugeicons/core-free-icons/UserTime01Icon"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar } from "../common/bits"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"

const DAY_PARTS = [
  ["support", "bg-sky-500/70"],
  ["dev", "bg-violet-500/70"],
  ["net", "bg-brand"],
]

/** Danışman günü: çalışma saatinin destek, yazılımcıyla çalışma ve proje payları (tek şerit). */
function ConsultantDay({ S }) {
  const { rt, locale } = useRmText()
  const v = {
    support: +S.support || 0,
    dev: +S.dev || 0,
    net: Math.max(0, S.dayHours - S.support - S.dev),
  }
  const total = Math.max(1, +S.dayHours || 0)
  return (
    <div className="rounded-2xl bg-foreground/[0.035] p-4 dark:bg-white/[0.05]">
      <p className="text-xs font-medium text-foreground/70">
        {rt("rm.set.dayTitle", { h: num(S.dayHours, locale) })}
      </p>
      <div className="mt-2.5 flex h-3 gap-0.5 overflow-hidden rounded-full">
        {DAY_PARTS.map(([k, c]) => (
          <span key={k} className={c} style={{ width: `${(v[k] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
        {DAY_PARTS.map(([k, c]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2 rounded-full", c)} />
            {rt(`rm.set.day.${k}`)}
            <b className="font-semibold tabular-nums">
              {num(v[k], locale)} {rt("rm.set.u.h")}
            </b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Varsayımlar: planın hesap kuralları ve kişiye özel saatler; düzenleyici değiştirir. */
export function AssumptionsView() {
  const { rt, locale } = useRmText()
  const { data, edit, openEditor, people } = useRm()
  const { st, plan } = data
  const S = st.settings
  const items = [
    ["planStart", day(toDay(S.planStart), locale, { year: true })],
    ["dayHours", num(S.dayHours, locale), "h"],
    ["closingDays", num(S.closingDays, locale), "d"],
    ["horizon", num(S.horizonMonths, locale), "m"],
    ["workdays", num(plan.days.filter((n) => plan.DT[n] !== "Tatil").length, locale), "d"],
    [
      "range",
      `${day(plan.days[0], locale, { year: true })} – ${day(plan.dispEnd, locale, { year: true })}`,
    ],
  ]
  const custom = st.resources.filter((r) => r.dh != null || r.sup != null || r.dev != null)
  return (
    <div className="grid gap-4 @[64rem]/rm:grid-cols-2">
      <RmCard
        icon={SlidersHorizontalIcon}
        tone="brand"
        title={rt("rm.set.assumptions")}
        sub={edit ? undefined : rt("rm.set.readOnly")}
        action={
          edit
            ? { label: rt("rm.pform.edit"), onClick: () => openEditor({ kind: "settings" }) }
            : null
        }
      >
        <ConsultantDay S={S} />
        <dl className="mt-3 grid grid-cols-2 gap-2 @[40rem]/rm:grid-cols-3">
          {items.map(([k, v, unit]) => (
            <div
              key={k}
              className={cn(
                "min-w-0 rounded-xl border border-border/60 px-3 py-2.5",
                k === "range" && "col-span-2 @[40rem]/rm:col-span-1",
              )}
            >
              <dt className="truncate text-xs text-foreground/65">{rt(`rm.set.a.${k}`)}</dt>
              <dd className="mt-0.5 text-[0.9375rem] font-semibold tabular-nums">
                {v}
                {unit ? (
                  <span className="ms-1 text-xs font-normal text-muted-foreground">
                    {rt(`rm.set.u.${unit}`)}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </RmCard>
      <RmCard
        icon={UserTime01Icon}
        tone="teal"
        title={rt("rm.set.custom")}
        sub={rt("rm.set.customSub")}
      >
        {custom.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {rt("rm.set.customNone")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{rt("rm.set.custom")}</caption>
            <thead>
              <tr className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <th scope="col" className="pb-2 text-start font-medium">
                  {rt("rm.capacity.person")}
                </th>
                {["dh", "sup", "dev"].map((k) => (
                  <th key={k} scope="col" className="w-20 pb-2 text-center font-medium">
                    {rt(`rm.set.c.${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custom.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <th scope="row" className="py-2 text-start font-normal">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={r.name} />
                      <span className="min-w-0">
                        {edit ? (
                          <button
                            type="button"
                            onClick={() => openEditor({ kind: "person", rid: r.id })}
                            className="block max-w-full truncate rounded text-start font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            {fullName(people, r.name)}
                          </button>
                        ) : (
                          <span className="block truncate font-medium">
                            {fullName(people, r.name)}
                          </span>
                        )}
                        <span className="block truncate text-xs text-muted-foreground">
                          {[r.team, r.role].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </span>
                  </th>
                  {[r.dh, r.sup, r.dev].map((v, i) => (
                    <td key={i} className="text-center">
                      {v == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex h-6 min-w-9 items-center justify-center rounded-full bg-teal-500/[0.12] px-2 text-xs font-semibold tabular-nums text-teal-700 dark:bg-teal-400/[0.16] dark:text-teal-300">
                          {num(v, locale)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RmCard>
    </div>
  )
}
