import { useContext } from "react"
import { day } from "@/features/rm/lib/format"
import CalendarRemove01Icon from "@hugeicons/core-free-icons/CalendarRemove01Icon"
import { useRmText } from "../data/useRmText"
import { ColorDot, SignalChip } from "../common/bits"
import { CardEmpty, RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"
import { CardLevel } from "../common/cardLevel"
import { useRowCap } from "../common/useRowCap"

const LIMIT = 4
// "+n proje daha": bölümün göstergesi panelde tam listeyle açılır.
const MORE = {
  overdue: "risk",
  late: "risk",
  unstaffed: "unstaffed",
  ending: "ending",
  starting: "ending",
}

// Sekme sayısı: rozetin soluk zemininde okunur kontrast (Güvenlik sekmeleriyle aynı).
export function Count({ n }) {
  return <span className="text-foreground/75">{n}</span>
}

/** Bölümler sırayla: önce gecikenler, sonra kişisiz, sonra yaklaşan bitiş ve başlangıç. */
const SECTIONS = [
  { key: "overdue", sig: "overdue", date: "end", sort: (a, b) => a.end - b.end },
  { key: "late", sig: "late", date: "end", sort: (a, b) => b.lateH - a.lateH },
  { key: "unstaffed", sig: "unstaffed", date: "end", sort: (a, b) => a.end - b.end },
  { key: "ending", sig: "endingSoon", date: "end", sort: (a, b) => a.end - b.end },
  { key: "starting", sig: "startingSoon", date: "start", sort: (a, b) => a.start - b.start },
]

/** Takvim riski: zamanı geçen, kişisiz, yakında biten ve başlayan projeler tek kartta, sekmesiz. */
export function ScheduleRisk({ ov, onProject, onMore }) {
  const { rt, locale } = useRmText()
  const { params } = useRm()
  // Bölüm başlıkları kartın bir altı (kart bölümde h3 ise h4).
  const H = `h${useContext(CardLevel) + 1}`
  const open = ov.rows.filter((r) => r.phase !== "done")
  const groups = SECTIONS.map((s) => ({
    ...s,
    list: open.filter((r) => r.signals.includes(s.sig)).sort(s.sort),
  })).filter((g) => g.list.length)
  const capRef = useRowCap(5, groups.map((g) => `${g.key}${g.list.length}`).join())
  return (
    <RmCard
      bare
      icon={CalendarRemove01Icon}
      tone="fuchsia"
      title={rt("rm.risk.title")}
      sub={rt("rm.risk.sub")}
      action={{ label: rt("rm.nav.projects"), onClick: () => params.go("projeler") }}
    >
      {groups.length === 0 ? (
        <CardEmpty>{rt("rm.risk.empty.all")}</CardEmpty>
      ) : (
        // İlk beş proje görünür (bölüm başlıkları arada); komşu kart uzunsa doldurur, gerisi kaydırılır.
        <div
          ref={capRef}
          className="flex grow flex-col gap-3 overflow-y-auto pe-1 [scrollbar-width:thin]"
        >
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`rm-risk-${g.key}`}>
              <H
                id={`rm-risk-${g.key}`}
                className="mb-1 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
              >
                {rt(`rm.risk.sec.${g.key}`)}
                <span className="tabular-nums text-foreground/70">{g.list.length}</span>
              </H>
              <ul className="flex flex-col">
                {g.list.slice(0, LIMIT).map((r) => (
                  <li key={r.id} data-row className="border-b border-border/50 last:border-0">
                    <button
                      type="button"
                      onClick={() => onProject(r.id)}
                      aria-haspopup="dialog"
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-1 py-1.5 text-start hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <ColorDot color={r.color} />
                      <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-foreground/70">
                        {r.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                      <SignalChip signal={g.sig} className="hidden @[34rem]/rm:inline-flex" />
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {day(r[g.date], locale)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {g.list.length > LIMIT && (
                <button
                  type="button"
                  onClick={() => onMore(MORE[g.key])}
                  aria-haspopup="dialog"
                  className="mt-1 rounded-md text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {rt("rm.risk.more", { n: g.list.length - LIMIT })}
                </button>
              )}
            </section>
          ))}
        </div>
      )}
    </RmCard>
  )
}
