import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Fire03Icon from "@hugeicons/core-free-icons/Fire03Icon"
import { num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { HeatGrid } from "../common/HeatGrid"
import { Pager } from "../common/Pager"
import { CardEmpty, RmCard } from "../common/RmCard"
import { usePaged } from "../common/usePaged"
import { useRm } from "../shell/RmContext"

// Kartta üç ekip; gerisi okla sayfalanır (kart aylık kapasiteyle aynı boyda, kısa kalır).
const PAGE = 3
const FILL = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-foreground/20" }
const INK = { over: "text-danger-ink", high: "text-warning-ink", ok: "", none: "" }

/**
 * Ekip kapasitesi: dönemin kapasitesi, atanan saat, doluluk ve boş/eksik adam-gün; en dolu önce.
 * Üçerli sayfa; "Tümü" hepsini gösterge panelinde açar.
 */
export function TeamCapacityCard({ ov, onTeam, onAll }) {
  const { rt, locale } = useRmText()
  const total = ov.teams.length
  const pg = usePaged(ov.teams, PAGE)
  const list = pg.items
  const p = ov.filter.period
  return (
    <RmCard
      bare
      icon={Building03Icon}
      tone="sky"
      title={rt("rm.team.card.title")}
      sub={rt("rm.team.card.sub", { period: rt(`rm.capacity.period.${p}`) })}
      info={rt("rm.team.card.info")}
      action={
        total > PAGE ? { label: rt("rm.team.card.all", { n: total }), onClick: onAll } : undefined
      }
    >
      {list.length === 0 ? (
        <CardEmpty>{rt("rm.team.card.empty")}</CardEmpty>
      ) : (
        <ul className={cn("flex flex-col", pg.pages > 1 && "min-h-[12.9rem]")}>
          {list.map((t) => {
            const lv = level(t.x)
            return (
              <li key={t.team} className="border-b border-border/50 last:border-0">
                <button
                  type="button"
                  onClick={() => onTeam(t.team)}
                  aria-haspopup="dialog"
                  className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-1 py-2.5 text-start transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.team}</span>
                    <span className="block truncate text-xs text-muted-foreground tabular-nums">
                      {rt("rm.team.card.row", {
                        n: t.n,
                        pj: num(t.pj, locale),
                        cap: num(t.cap, locale),
                      })}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums",
                        t.open >= 0
                          ? "bg-success/12 text-success-ink"
                          : "bg-danger/10 text-danger-ink",
                      )}
                    >
                      {rt(t.open >= 0 ? "rm.team.card.free" : "rm.team.card.short", {
                        n: num(Math.abs(t.open), locale),
                      })}
                    </span>
                    <span
                      className={cn("w-12 text-end text-sm font-semibold tabular-nums", INK[lv])}
                    >
                      {pct(t.x, locale)}
                    </span>
                  </span>
                  <span
                    role="img"
                    aria-label={rt("rm.team.card.bar", { team: t.team, pct: pct(t.x, locale) })}
                    className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]"
                  >
                    <span
                      className={cn("block h-full rounded-full", FILL[lv])}
                      style={{ width: `${Math.min(1, t.x || 0) * 100}%` }}
                    />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {pg.pages > 1 && (
        <Pager
          at={pg.at}
          pages={pg.pages}
          onPage={pg.setPage}
          label={rt("rm.team.card.page", { from: pg.from, to: pg.to, n: total })}
          prev={rt("rm.team.card.prev")}
          next={rt("rm.team.card.next")}
        />
      )}
    </RmCard>
  )
}

/** Ekip × ay doluluk (tam genişlik): satıra basınca ekip paneli. */
export function TeamHeatCard({ ov, onTeam }) {
  const { rt } = useRmText()
  const { data } = useRm()
  const p = ov.filter.period
  // Ekip tonu kişilerin sırasıyla: Kapasite ve Kaynaklar'da aynı ekip aynı renkte.
  const tones = [...new Set(data.st.resources.map((r) => r.team))]
  const rows = ov.grid.rows.map((row) => ({
    key: row.team,
    label: row.team,
    sub: rt("rm.heat.people", { n: row.people.length }),
    tone: Math.max(0, tones.indexOf(row.team)),
    cells: row.cells,
  }))
  return (
    <RmCard
      bare
      className="@[60rem]/rm:col-span-2"
      icon={Fire03Icon}
      tone="indigo"
      title={rt("rm.heat.title")}
      sub={rt("rm.team.heatSub", { period: rt(`rm.capacity.period.${p}`) })}
      info={rt("rm.heat.legend")}
    >
      <HeatGrid
        months={ov.grid.months}
        rows={rows}
        caption={rt("rm.heat.caption")}
        rowLabel={rt("rm.heat.team")}
        onRow={onTeam}
      />
    </RmCard>
  )
}
