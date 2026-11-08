import CalendarCheckOut01Icon from "@hugeicons/core-free-icons/CalendarCheckOut01Icon"
import BatteryMedium01Icon from "@hugeicons/core-free-icons/BatteryMedium01Icon"
import DashboardSpeed01Icon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { num, pct } from "@/features/rm/lib/format"
import { level } from "@/lib/rm/metrics"
import { periodCapacity } from "@/lib/rm/overviewDetails"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { AvatarStack } from "../common/bits"
import { ICON_INK } from "../common/iconInk"
import { RmKpiStrip } from "../common/RmKpiStrip"
import { useRm } from "../shell/RmContext"
import "./KpiTiles.css"

const FILL = { over: "bg-danger", high: "bg-warning", ok: "bg-brand", none: "bg-foreground/20" }

/** İki dilimli ince şerit (ör. süren · sırada). */
function Split({ a, b, label }) {
  const t = a + b
  return (
    <span
      role="img"
      aria-label={label}
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]"
    >
      <span className="h-full bg-brand" style={{ width: `${t ? (a / t) * 100 : 0}%` }} />
      <span className="h-full bg-brand/35" style={{ width: `${t ? (b / t) * 100 : 0}%` }} />
    </span>
  )
}

function Fill({ x, label }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="block h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]"
    >
      <span
        className={cn("block h-full rounded-full", FILL[level(x)])}
        style={{ width: `${Math.min(1, x || 0) * 100}%` }}
      />
    </span>
  )
}

/** Göstergenin verisi: kutu ve telefondaki özet aynı listeden. */
function useKpis(ov) {
  const { rt, locale } = useRmText()
  const { people } = useRm()
  const o = ov.ov
  const names = o.overPeople.map((r) => fullName(people, r.name))
  // Aylık kapasite kartının alt satırıyla aynı toplam (dönemin ayları).
  const cap = periodCapacity(ov.months)
  return [
    {
      key: "open",
      icon: Folder01Icon,
      tone: "brand",
      label: rt("rm.kpi.open"),
      hint: rt("rm.kpi.hint.open"),
      value: o.active + o.upcoming,
      caption: rt("rm.kpi.openCap", { a: o.active, u: o.upcoming }),
      foot: (
        <Split
          a={o.active}
          b={o.upcoming}
          label={rt("rm.kpi.openCap", { a: o.active, u: o.upcoming })}
        />
      ),
    },
    {
      key: "util",
      icon: DashboardSpeed01Icon,
      tone: "violet",
      label: rt("rm.kpi.util"),
      hint: rt("rm.kpi.hint.util"),
      value: pct(o.utilNow, locale),
      caption: rt("rm.kpi.utilCap", { pct: pct(o.utilNext, locale) }),
      warn: o.utilNow > 1,
      foot: <Fill x={o.utilNow} label={rt("rm.kpi.util")} />,
    },
    {
      key: "over",
      icon: UserWarning01Icon,
      tone: "pink",
      label: rt("rm.kpi.over"),
      hint: rt("rm.kpi.hint.over"),
      value: names.length,
      caption: names.length
        ? names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "")
        : rt("rm.kpi.overNone"),
      warn: names.length > 0,
      foot: names.length ? <AvatarStack names={o.overPeople.map((r) => r.name)} max={5} /> : null,
    },
    {
      key: "cap",
      icon: BatteryMedium01Icon,
      tone: "blue",
      label: rt("rm.kpi.cap"),
      hint: rt("rm.kpi.hint.cap"),
      value: rt("rm.unit.hours", { n: num(cap.cap, locale) }),
      caption: rt("rm.kpi.capCap", {
        pct: pct(cap.x, locale),
        h: rt("rm.unit.hours", { n: num(cap.free, locale) }),
      }),
      foot: <Fill x={cap.x} label={rt("rm.kpi.cap")} />,
    },
    {
      key: "ending",
      icon: CalendarCheckOut01Icon,
      tone: "teal",
      label: rt("rm.kpi.ending"),
      hint: rt("rm.kpi.hint.ending"),
      value: o.endingSoon,
      caption: rt("rm.kpi.endingCap", { n: o.startingSoon }),
    },
  ]
}

function Tile({ s, onPick }) {
  const { locale } = useRmText()
  const tile = (
    <button
      type="button"
      onClick={() => onPick(s.key)}
      aria-haspopup="dialog"
      className="group relative flex min-w-0 flex-col px-5 py-4 text-start transition-colors hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
    >
      <span className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon
          icon={s.icon}
          aria-hidden="true"
          strokeWidth={1.8}
          className={cn("size-4 shrink-0", ICON_INK[s.tone])}
        />
        <span
          lang={locale}
          className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/70"
        >
          {s.label}
        </span>
      </span>
      <span
        className={cn(
          "mt-2.5 block truncate text-[1.75rem] font-semibold leading-tight tabular-nums tracking-[-0.025em]",
          s.warn && (s.key === "over" || s.key === "util" ? "text-danger-ink" : "text-warning-ink"),
        )}
      >
        {typeof s.value === "number" ? (
          <AnimatedCounter
            value={s.value}
            locale={locale}
            fallback={new Intl.NumberFormat(locale).format(s.value)}
          />
        ) : (
          s.value
        )}
      </span>
      <span className="mt-1 block min-h-[1.125rem] truncate text-xs text-foreground/65">
        {s.caption}
      </span>
      <span className="mt-auto flex min-h-6 items-end pt-3">{s.foot}</span>
    </button>
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-[17rem] flex-col items-start gap-0 px-3 py-2.5"
      >
        <p className="text-[0.8125rem] font-semibold text-background">{s.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-background/80">{s.hint}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Genel Bakış'ın beş göstergesi (açık proje, bu ay doluluk, aşımdaki kişi, dönemin proje
 * kapasitesi, 30 günde biten) tek kartta, aralarında ince ayraç: renkli ikon, sayaçla dönen
 * değer, tek satır açıklama, altta küçük görsel (dilim, doluluk, avatarlar). Basınca ayrıntı sağdaki panelde açılır; telefonda
 * tek satır özet + çekmece (gövde alanı kartlara kalsın).
 */
export function KpiTiles({ ov, onPick }) {
  const { rt } = useRmText()
  const { phone } = useRm()
  const stats = useKpis(ov)
  if (phone) return <RmKpiStrip stats={stats} onPick={onPick} phone label={rt("rm.kpi.label")} />
  return (
    <div
      role="group"
      aria-label={rt("rm.kpi.label")}
      // shrink-0: sayfa kabı yüksekliği sabit bir esnek sütun; taşma gizli öğe aksi hâlde ezilir.
      className="rm-kpis grid min-w-0 shrink-0 grid-cols-2 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xs @[44rem]/rm:grid-cols-3 @[64rem]/rm:grid-cols-5"
    >
      {stats.map((s) => (
        <Tile key={s.key} s={s} onPick={onPick} />
      ))}
    </div>
  )
}
