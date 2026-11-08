import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon"
import PieChart01Icon from "@hugeicons/core-free-icons/PieChart01Icon"
import { useState } from "react"
import { day, monthLabel, num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { CardEmpty, RmCard } from "../common/RmCard"
import { MixDonut } from "./MixDonut"
import { useRm } from "../shell/RmContext"

const BAR = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-foreground/20" }

/** Aylık kapasite: gri kapasite, renkli atanan saat; yüzde her sütunda yazılı. Sütun paneli açar. */
export function MonthlyCapacityCard({ ov, onPick }) {
  const { rt, locale } = useRmText()
  const { params } = useRm()
  const months = ov.months
  const p = ov.filter.period
  const max = Math.max(1, ...months.map((m) => Math.max(m.cap, m.pj)))
  const dense = months.length > 6
  const sum = months.reduce((a, m) => ({ cap: a.cap + m.cap, pj: a.pj + m.pj }), { cap: 0, pj: 0 })
  return (
    <RmCard
      bare
      icon={Analytics01Icon}
      tone="brand"
      title={rt("rm.detail.trend.title")}
      sub={rt("rm.detail.trend.subP", { period: rt(`rm.capacity.period.${p}`) })}
      action={{ label: rt("rm.nav.capacity"), onClick: () => params.go("kapasite", { period: p }) }}
    >
      <ul
        className={cn("grid min-h-44 flex-1 items-end", dense ? "gap-1" : "gap-2")}
        style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
        aria-label={rt("rm.detail.trend.title")}
      >
        {months.map((m) => (
          <li key={m.key} className="flex h-full min-w-0">
            <button
              type="button"
              onClick={() => onPick("util")}
              aria-haspopup="dialog"
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span
                className={cn(
                  "tabular-nums",
                  dense ? "text-[0.625rem]" : "text-[0.6875rem]",
                  level(m.x) === "over" ? "font-semibold text-danger-ink" : "text-muted-foreground",
                )}
              >
                {pct(m.x, locale)}
              </span>
              <span className="relative w-full max-w-10 flex-1">
                <span
                  className="absolute inset-x-0 bottom-0 rounded-lg bg-foreground/[0.07] transition-colors group-hover:bg-foreground/[0.11]"
                  style={{ height: `${(m.cap / max) * 100}%` }}
                />
                <span
                  className={cn(
                    "absolute bottom-0 rounded-md",
                    dense ? "inset-x-1" : "inset-x-1.5",
                    BAR[level(m.x)],
                  )}
                  style={{ height: `${(m.pj / max) * 100}%` }}
                />
              </span>
              <span
                className={cn(
                  "uppercase tracking-[0.06em] text-muted-foreground",
                  dense ? "text-[0.5625rem]" : "text-[0.6875rem]",
                )}
              >
                {monthLabel(m.y, m.m, locale)}
              </span>
              {/* Ad görünen yazıyla (yüzde, ay) başlar; saatler yalnız ekran okuyucuya. */}
              <span className="sr-only">
                {" — "}
                {rt("rm.detail.trend.bar", {
                  month: monthLabel(m.y, m.m, locale, { long: true }),
                  pj: num(m.pj, locale),
                  cap: num(m.cap, locale),
                })}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-xs">
        {[
          ["cap", rt("rm.detail.trend.cap"), num(sum.cap, locale)],
          ["pj", rt("rm.detail.trend.pj"), num(sum.pj, locale)],
          ["x", rt("rm.detail.trend.x"), pct(sum.cap ? sum.pj / sum.cap : null, locale)],
        ].map(([k, label, value]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-foreground/60">{label}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </RmCard>
  )
}

/**
 * Proje saat dağılımı: önümüzdeki aylarda saat hangi projelerde? Halka + yüzde listesi; ikisi
 * birbirini sürer (dilimin ya da satırın üstüne gelince ikisi de vurgulanır).
 */
export function HoursMixCard({ ov, onProject, className }) {
  const { rt, locale } = useRmText()
  const [active, setActive] = useState(null)
  const mix = ov.mix
  const segs = [
    ...mix.segs,
    ...(mix.rest
      ? [
          {
            id: null,
            code: rt("rm.detail.mix.other"),
            name: rt("rm.detail.mix.otherLong"),
            color: "var(--muted-foreground)",
            h: mix.rest,
          },
        ]
      : []),
  ]
  return (
    <RmCard
      bare
      className={className}
      icon={PieChart01Icon}
      tone="violet"
      title={rt("rm.detail.mix.title")}
      sub={rt("rm.detail.mix.sub", { date: day(mix.to, locale, { year: true }) })}
    >
      {!mix.total ? (
        <CardEmpty>{rt("rm.detail.mix.empty")}</CardEmpty>
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <MixDonut
            segs={segs}
            total={mix.total}
            active={active}
            onActive={setActive}
            onProject={onProject}
          />
          <ul className="grid min-w-[12rem] flex-1 gap-x-6 gap-y-0.5 text-sm @[60rem]/rm:grid-cols-2">
            {segs.map((s) => {
              const cls = cn(
                "flex min-h-8 w-full items-center gap-2 rounded-lg px-1.5 text-start transition-colors pointer-coarse:min-h-11",
                active === s.code && "bg-foreground/[0.05]",
              )
              const body = (
                <>
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: s.color || "var(--color-brand)" }}
                  />
                  <span className="w-10 shrink-0 truncate text-xs font-semibold text-foreground/75">
                    {s.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground/80">{s.name}</span>
                  <span className="hidden text-xs tabular-nums text-muted-foreground @[60rem]/rm:inline">
                    {rt("rm.unit.hours", { n: num(s.h, locale) })}
                  </span>
                  <span className="w-10 text-end font-medium tabular-nums">
                    {pct(s.h / mix.total, locale)}
                  </span>
                </>
              )
              const hover = {
                onPointerEnter: () => setActive(s.code),
                onPointerLeave: () => setActive(null),
              }
              return (
                <li key={s.code}>
                  {/* "Diğer" bir proje değil: tıklanmaz, yine de halkayı vurgular. */}
                  {s.id ? (
                    <button
                      type="button"
                      onClick={() => onProject(s.id)}
                      onFocus={() => setActive(s.code)}
                      onBlur={() => setActive(null)}
                      aria-haspopup="dialog"
                      {...hover}
                      className={cn(
                        cls,
                        "hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                      )}
                    >
                      {body}
                    </button>
                  ) : (
                    <div {...hover} className={cls}>
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
            <li className="mt-1 text-xs text-muted-foreground">
              {rt("rm.detail.mix.total", { h: num(mix.total, locale) })}
            </li>
          </ul>
        </div>
      )}
    </RmCard>
  )
}
