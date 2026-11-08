import { monthLabel, num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { periodCapacity } from "@/lib/rm/overviewDetails"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Meter } from "../common/bits"
import { DetailSection, PanelStats } from "../common/RmDetailFrame"
import { INK, METER, ROW } from "./metricUi"

const TONE = { over: "danger", high: "warn" }

/**
 * Proje kapasitesi göstergesinin ayrıntısı: dönemin kapasitesi, atanan, boş saat ve doluluk; ay ay
 * doluluk; ekiplerde boş ya da eksik adam-gün (en çok boşu olan önce). Ekibe basınca ekip paneli.
 */
export function CapacityMetric({ ov, onTeam }) {
  const { rt, locale } = useRmText()
  const c = periodCapacity(ov.months)
  const teams = [...ov.teams].sort((a, b) => b.open - a.open)
  return (
    <>
      <PanelStats
        items={[
          { key: "cap", label: rt("rm.detail.trend.cap"), value: num(c.cap, locale) },
          { key: "pj", label: rt("rm.detail.trend.pj"), value: num(c.pj, locale) },
          { key: "free", label: rt("rm.metric.free"), value: num(c.free, locale) },
          {
            key: "x",
            label: rt("rm.metric.fill"),
            value: pct(c.x, locale),
            tone: TONE[level(c.x)],
          },
        ]}
      />
      <DetailSection title={rt("rm.metric.months")}>
        <ul className="grid gap-2">
          {ov.months.map((m) => {
            const label = monthLabel(m.y, m.m, locale, { long: true })
            return (
              <li
                key={m.key}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="text-muted-foreground">{label}</span>
                <Meter value={Math.min(1, m.x || 0)} tone={METER[level(m.x)]} label={label} />
                <span className={cn("text-end tabular-nums", INK[level(m.x)])}>
                  {rt("rm.metric.capRow", { pj: num(m.pj, locale), cap: num(m.cap, locale) })}
                </span>
              </li>
            )
          })}
        </ul>
      </DetailSection>
      <DetailSection title={rt("rm.metric.capTeams")}>
        <ul className="grid gap-0.5">
          {teams.map((t) => (
            <li key={t.team}>
              <button type="button" onClick={() => onTeam(t.team)} className={ROW}>
                <span className="w-28 shrink-0 truncate text-sm font-medium">{t.team}</span>
                <span className="flex-1">
                  <Meter value={Math.min(1, t.x || 0)} tone={METER[level(t.x)]} label={t.team} />
                </span>
                <span
                  className={cn(
                    "w-24 shrink-0 text-end text-xs tabular-nums",
                    t.open >= 0 ? "text-muted-foreground" : "text-danger-ink",
                  )}
                >
                  {rt(t.open >= 0 ? "rm.team.card.free" : "rm.team.card.short", {
                    n: num(Math.abs(t.open), locale),
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DetailSection>
    </>
  )
}
