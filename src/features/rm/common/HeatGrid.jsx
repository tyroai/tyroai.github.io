import { level } from "@/lib/rm/metrics"
import { monthLabel, num, pct } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { CellTip, TeamMark } from "./tree"
import { useCellTip } from "./useTree"

/** Isı ölçeği: doluluk arttıkça zemin koyulaşır; %85–100 sarı, aşım kırmızı (çok aşım daha koyu). */
function heat(x) {
  if (x == null || !Number.isFinite(x) || x <= 0) {
    return "bg-foreground/[0.03] text-muted-foreground/80"
  }
  const lv = level(x)
  if (lv === "over") {
    return cn("font-semibold text-danger-ink", x > 1.5 ? "bg-danger/25" : "bg-danger/14")
  }
  if (lv === "high") return "bg-warning/18 font-medium text-warning-ink"
  return x < 0.5 ? "bg-brand/[0.06] text-foreground/80" : "bg-brand/[0.13] text-foreground/85"
}

const LEGEND = [
  { key: "ok", swatch: "bg-brand/[0.13]" },
  { key: "high", swatch: "bg-warning/18" },
  { key: "over", swatch: "bg-danger/14" },
]

/**
 * Satır (ekip) × ay doluluk tablosu. Her hücre ısı ölçeğinde; yüzde hücrede yazılı, yani renk tek
 * taşıyıcı değil. Üstüne gelince atanan / kapasite saati (tek balon, `useCellTip`). İlk sütun
 * içinde bulunulan ay (dönem bugünün ayıyla başlar). Gerçek tablo: ekran okuyucu satır ve sütun
 * başlıklarını okur.
 * @param {{ key: string, label: string, sub?: string, tone?: number, cells: {x: number|null, b?: {cap: number, pj: number}}[] }[]} p.rows
 */
export function HeatGrid({ months, rows, caption, onRow, rowLabel }) {
  const { rt, locale } = useRmText()
  const { tip, bind } = useCellTip()
  return (
    <div className="min-w-0">
      <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]" {...bind}>
        <table className="w-full min-w-[34rem] border-separate border-spacing-1.5 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[11.5rem]">
                <span className="sr-only">{rowLabel}</span>
              </th>
              {months.map((m, i) => (
                <th
                  key={m.key}
                  scope="col"
                  className={cn(
                    "pb-1 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em]",
                    i === 0 ? "text-brand" : "text-foreground/70",
                  )}
                >
                  {monthLabel(m.y, m.m, locale)}
                  {i === 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="mx-auto mt-1 block size-1 rounded-full bg-brand"
                      />
                      <span className="sr-only"> · {rt("rm.heat.now")}</span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                onClick={onRow ? () => onRow(row.key) : undefined}
                className={cn(onRow && "group/row cursor-pointer [&:hover_td]:brightness-[0.96]")}
              >
                <th scope="row" className="max-w-0 pe-2 text-start font-normal">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRow?.(row.key)
                    }}
                    disabled={!onRow}
                    className="relative flex w-full min-w-0 items-center gap-2.5 rounded-lg py-0.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1.5 pointer-coarse:after:inset-x-0"
                  >
                    <TeamMark
                      name={row.label}
                      index={row.tone ?? 0}
                      className="size-7 rounded-lg text-[0.625rem]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold transition-colors group-hover/row:text-brand">
                        {row.label}
                      </span>
                      {row.sub && (
                        <span className="block truncate text-[0.6875rem] text-muted-foreground">
                          {row.sub}
                        </span>
                      )}
                    </span>
                  </button>
                </th>
                {row.cells.map((c, i) => (
                  <td
                    key={months[i].key}
                    data-tip={`${row.label} · ${monthLabel(months[i].y, months[i].m, locale, { long: true })}`}
                    data-tip-sub={
                      c.b
                        ? rt("rm.heat.tip", { pj: num(c.b.pj, locale), cap: num(c.b.cap, locale) })
                        : ""
                    }
                    className={cn(
                      "h-10 rounded-xl text-center text-[0.8125rem] tabular-nums transition-[filter]",
                      heat(c.x),
                    )}
                  >
                    {c.x == null ? "—" : Number.isFinite(c.x) ? pct(c.x, locale) : "∞"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[0.6875rem] text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-[0.25rem]", l.swatch)} />
            {rt(`rm.heat.lg.${l.key}`)}
          </span>
        ))}
      </p>
      <CellTip tip={tip} />
    </div>
  )
}
