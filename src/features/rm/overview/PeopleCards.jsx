import TaskDone01Icon from "@hugeicons/core-free-icons/TaskDone01Icon"
import UserCheck01Icon from "@hugeicons/core-free-icons/UserCheck01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { monthLabel, num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { Avatar, ColorDot, Meter } from "../common/bits"
import { Pager } from "../common/Pager"
import { CardEmpty, RmCard } from "../common/RmCard"
import { usePaged } from "../common/usePaged"
import { useRm } from "../shell/RmContext"
import { useRowCap } from "../common/useRowCap"

function MonthChip({ x, label, locale }) {
  const lv = level(x)
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[0.6875rem] tabular-nums",
        lv === "over"
          ? "bg-danger/10 font-semibold text-danger-ink"
          : lv === "high"
            ? "bg-warning/14 text-warning-ink"
            : "bg-foreground/[0.05] text-foreground/70",
      )}
    >
      <span className="uppercase">{label}</span> {pct(x, locale)}
    </span>
  )
}

// Kartta üç kişi; gerisi okla sayfalanır (Ekip kapasitesi kartı gibi). Son sayfa kısa kalsa da
// liste üç satır boyunu korur: altlık yerinden oynamaz.
const PAGE = 3
const LIST = "flex flex-col"
const FULL = "min-h-[9.125rem]"

/** Kişi kartının altlığı: "1–3 / 8 kişi", noktalar, ‹ ›. */
function PeoplePager({ pg, total }) {
  const { rt } = useRmText()
  if (pg.pages < 2) return null
  return (
    <Pager
      at={pg.at}
      pages={pg.pages}
      onPage={pg.setPage}
      label={rt("rm.detail.people.page", { from: pg.from, to: pg.to, n: total })}
      prev={rt("rm.detail.people.prev")}
      next={rt("rm.detail.people.next")}
    />
  )
}

function PersonRow({ o, people, onOpen, children, sub }) {
  return (
    <li className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="flex min-h-12 w-full items-center gap-3 rounded-lg px-1 py-2 text-start hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Avatar name={o.r.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{fullName(people, o.r.name)}</span>
          <span className="block truncate text-xs text-muted-foreground">{sub}</span>
        </span>
        {children}
      </button>
    </li>
  )
}

/** Aşırı yüklenen kişiler: bu ay ya da gelecek ay kapasitesi aşılanlar, en yüksek önce. */
export function OverloadedCard({ ov, onPerson }) {
  const { rt, locale } = useRmText()
  const { params, people } = useRm()
  const load = ov.load
  const [m0, m1] = load.months
  const pg = usePaged(load.over, PAGE)
  return (
    <RmCard
      bare
      icon={UserWarning01Icon}
      tone="pink"
      title={rt("rm.detail.over.title")}
      sub={rt("rm.detail.people.overSub")}
      action={{ label: rt("rm.nav.capacity"), onClick: () => params.go("kapasite") }}
    >
      {load.over.length === 0 ? (
        <CardEmpty>{rt("rm.detail.people.overNone")}</CardEmpty>
      ) : (
        <ul className={cn(LIST, pg.pages > 1 && FULL)}>
          {pg.items.map((o) => (
            <PersonRow
              key={o.r.id}
              o={o}
              people={people}
              onOpen={() => onPerson(o.r.id)}
              sub={[o.r.team, people.get(o.r.name)?.title || o.r.role].filter(Boolean).join(" · ")}
            >
              <span className="flex shrink-0 gap-1">
                <MonthChip x={o.x0} label={monthLabel(m0.y, m0.m, locale)} locale={locale} />
                {m1 && (
                  <MonthChip x={o.x1} label={monthLabel(m1.y, m1.m, locale)} locale={locale} />
                )}
              </span>
            </PersonRow>
          ))}
        </ul>
      )}
      <PeoplePager pg={pg} total={load.over.length} />
    </RmCard>
  )
}

/** Boş kapasitesi olanlar: bu ay yarıdan az dolu, en çok boş günü olan önce. */
export function IdleCard({ ov, onPerson }) {
  const { rt, locale } = useRmText()
  const { params, people } = useRm()
  const load = ov.load
  const [m0, m1] = load.months
  const pg = usePaged(load.idle, PAGE)
  return (
    <RmCard
      bare
      icon={UserCheck01Icon}
      tone="teal"
      title={rt("rm.detail.idle.title")}
      sub={rt("rm.detail.people.idleSub")}
      action={{ label: rt("rm.nav.capacity"), onClick: () => params.go("kapasite") }}
    >
      {load.idle.length === 0 ? (
        <CardEmpty>{rt("rm.detail.people.idleNone")}</CardEmpty>
      ) : (
        <ul className={cn(LIST, pg.pages > 1 && FULL)}>
          {pg.items.map((o) => (
            <PersonRow
              key={o.r.id}
              o={o}
              people={people}
              onOpen={() => onPerson(o.r.id)}
              sub={[
                o.r.team,
                `${monthLabel(m0.y, m0.m, locale)} ${pct(o.x0, locale)}`,
                m1 ? `${monthLabel(m1.y, m1.m, locale)} ${pct(o.x1, locale)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <span className="shrink-0 rounded-full bg-success/12 px-2 py-1 text-[0.6875rem] font-medium tabular-nums text-success-ink">
                {rt("rm.detail.people.free", { n: num(o.free, locale, 1) })}
              </span>
            </PersonRow>
          ))}
        </ul>
      )}
      <PeoplePager pg={pg} total={load.idle.length} />
    </RmCard>
  )
}

/** Yapılacak işler: açık projelerde biten / toplam iş; kalan işi çok olan önce. */
export function TodoCard({ ov, onProject }) {
  const { rt } = useRmText()
  const { params } = useRm()
  const list = ov.todo
  const capRef = useRowCap(5, list.length)
  return (
    <RmCard
      bare
      icon={TaskDone01Icon}
      tone="sky"
      title={rt("rm.detail.todo.title")}
      sub={rt("rm.detail.todo.sub")}
      action={{ label: rt("rm.nav.projects"), onClick: () => params.go("projeler") }}
    >
      {list.length === 0 ? (
        <CardEmpty>{rt("rm.detail.todo.empty")}</CardEmpty>
      ) : (
        // İlk beş iş görünür; komşu kart uzunsa liste onu doldurur, gerisi kaydırılır.
        <ul ref={capRef} className="flex grow flex-col overflow-y-auto [scrollbar-width:thin]">
          {list.slice(0, 10).map((r) => (
            <li key={r.id} data-row className="border-b border-border/50 last:border-0">
              <button
                type="button"
                onClick={() => onProject(r.id)}
                aria-haspopup="dialog"
                className="grid min-h-12 w-full grid-cols-[auto_3rem_minmax(0,1fr)_6rem_2.5rem] items-center gap-2.5 rounded-lg px-1 py-2 text-start hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <ColorDot color={r.color} />
                <span className="truncate text-xs font-semibold text-foreground/70">{r.code}</span>
                <span className="truncate text-sm">{r.name}</span>
                <Meter value={r.todo.done / r.todo.total} tone="ok" label={rt("rm.panel.tasks")} />
                <span className="text-end text-xs tabular-nums text-muted-foreground">
                  {r.todo.done}/{r.todo.total}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </RmCard>
  )
}
