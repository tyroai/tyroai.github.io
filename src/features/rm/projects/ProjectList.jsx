import { day, num } from "@/features/rm/lib/format"
import { workdaysBetween } from "@/lib/rm/engine/capacity"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { AvatarStack, ColorDot, SignalChip } from "../common/bits"
import { useRm } from "../shell/RmContext"

const STATUS_TONE = {
  "Devam ediyor": "bg-success/12 text-success-ink",
  Takipte: "bg-brand-soft text-brand-on-soft",
  Beklemede: "bg-warning/14 text-warning-ink",
  Tamamlandı: "bg-foreground/[0.06] text-foreground/60",
}

export function StatusPill({ status }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center truncate rounded-full px-2 text-[0.6875rem] font-medium",
        STATUS_TONE[status] ?? "bg-foreground/[0.06] text-foreground/70",
      )}
    >
      {status || "—"}
    </span>
  )
}

/** Proje listesi: geniş ekranda kartsız 48 px satırlı tablo, telefonda iki satırlık kart. */
export function ProjectList({ rows, nameOf, selectedId, onOpen }) {
  const { rt, locale } = useRmText()
  const { phone, data, people, today } = useRm()
  const plan = data.plan

  if (!rows.length) {
    return (
      <p className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground dark:bg-white/[0.04]">
        {rt("rm.projects.empty")}
      </p>
    )
  }

  if (phone) {
    return (
      <ul className="flex flex-col divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onOpen(r.id)}
              className="flex min-h-14 w-full flex-col gap-1 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="flex w-full items-center gap-2">
                <ColorDot color={r.color} />
                <span className="text-xs font-semibold text-foreground/70">{r.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</span>
              </span>
              <span className="flex w-full items-center gap-2 ps-4.5 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {day(r.start, locale)} – {day(r.end, locale)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{r.status}</span>
                <span className="ms-auto flex gap-1">
                  {r.signals.slice(0, 1).map((s) => (
                    <SignalChip key={s} signal={s} />
                  ))}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <table className="w-full table-fixed text-sm">
      <caption className="sr-only">{rt("rm.nav.projects")}</caption>
      <thead>
        <tr className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          <th scope="col" className="w-20 pb-2 text-start font-medium">
            {rt("rm.col.code")}
          </th>
          <th scope="col" className="pb-2 text-start font-medium">
            {rt("rm.col.project")}
          </th>
          <th scope="col" className="w-14 pb-2 text-start font-medium">
            {rt("rm.col.prio")}
          </th>
          <th
            scope="col"
            className="hidden w-36 pb-2 text-start font-medium @[60rem]/rm:table-cell"
          >
            {rt("rm.col.status")}
          </th>
          <th scope="col" className="w-44 pb-2 text-start font-medium">
            {rt("rm.col.schedule")}
          </th>
          <th
            scope="col"
            className="hidden w-32 pb-2 text-start font-medium @[52rem]/rm:table-cell"
          >
            {rt("rm.col.team")}
          </th>
          <th scope="col" className="w-16 pb-2 text-end font-medium">
            {rt("rm.col.hours")}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const wd =
            r.start != null && r.end != null ? workdaysBetween(plan, r.start - 1, r.end) : null
          // Geçen süre (iş günüyle): sırada 0, biten 1; satırda ince şerit.
          const gone =
            r.phase === "done"
              ? 1
              : wd && r.start <= today
                ? Math.min(1, workdaysBetween(plan, r.start - 1, Math.min(today, r.end)) / wd)
                : 0
          const team = r.members.map((m) => nameOf(m.rid))
          const overNames = new Set(r.over.map((rid) => nameOf(rid)))
          return (
            <tr
              key={r.id}
              onClick={() => onOpen(r.id)}
              className={cn(
                "h-14 cursor-pointer border-t border-border/50 hover:bg-foreground/[0.025]",
                selectedId === r.id &&
                  "bg-foreground/[0.05] hover:bg-foreground/[0.05] dark:bg-white/[0.07]",
              )}
            >
              <td className="pe-2">
                <span className="flex items-center gap-2">
                  <ColorDot color={r.color} />
                  <span className="truncate text-xs font-semibold tabular-nums text-foreground/75">
                    {r.code}
                  </span>
                </span>
              </td>
              <td className="min-w-0 pe-3">
                <span className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpen(r.id)
                    }}
                    aria-current={selectedId === r.id ? "true" : undefined}
                    className="min-w-0 truncate rounded text-start font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {r.name}
                  </button>
                  {r.signals.slice(0, 1).map((s) => (
                    <SignalChip key={s} signal={s} className="hidden @[44rem]/rm:inline-flex" />
                  ))}
                </span>
                {r.pm && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {rt("rm.panel.pm", { name: fullName(people, r.pm) })}
                  </span>
                )}
              </td>
              <td className="text-xs text-foreground/75">{r.prio || "—"}</td>
              <td className="hidden pe-2 @[60rem]/rm:table-cell">
                <StatusPill status={r.status} />
              </td>
              <td className="pe-2 text-xs tabular-nums">
                <span className={cn(r.signals.includes("overdue") && "text-danger-ink")}>
                  {day(r.start, locale)} – {day(r.end, locale)}
                </span>
                {wd != null && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {rt("rm.projects.workdays", { n: wd })}
                  </span>
                )}
                {wd != null && (
                  <span
                    role="img"
                    aria-label={rt("rm.projects.elapsed", { pct: Math.round(gone * 100) })}
                    className="mt-1 block h-1 w-full max-w-40 overflow-hidden rounded-full bg-foreground/[0.07]"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        r.signals.includes("overdue") ? "bg-danger" : "bg-brand/70",
                      )}
                      style={{ width: `${gone * 100}%` }}
                    />
                  </span>
                )}
              </td>
              <td className="hidden @[52rem]/rm:table-cell">
                {team.length ? (
                  <AvatarStack names={team} overSet={overNames} />
                ) : (
                  <span className="text-xs text-warning-ink">{rt("rm.signal.unstaffed")}</span>
                )}
              </td>
              <td className="text-end text-xs tabular-nums">{num(r.hours, locale)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
