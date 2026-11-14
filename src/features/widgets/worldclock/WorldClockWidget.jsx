import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import { WorldClockButton } from "@/components/worldclock/WorldClockButton"
import { useLocale } from "@/hooks/useLocale"
import { useWorldClock } from "@/hooks/useWorldClock"
import { cn } from "@/lib/utils"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { ClockDial } from "./ClockDial"
import { pickShown, useCityTimes } from "./useCityTimes"

// Gün diliminin noktası — dünya saati penceresinin lejantıyla aynı renkler (mesai krem sarısı,
// sabah erken/akşam açık mavi, hafta sonu ve tatil soluk, gece gri): "orası şu an mesaide mi" bir bakışta.
const DOT = {
  work: "bg-amber-400",
  edge: "bg-sky-400",
  off: "wc-dot-off",
  night: "bg-slate-400 dark:bg-slate-500",
}
// Geniş kartta kadran sütunları şehir sayısına göre (sınıflar sabit yazılır, Tailwind dinamik
// adı üretmez).
const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
}

/** "−2 sa" · "+5 sa · Yarın" — ana şehre göre fark ve gün işareti. */
function shiftText(t, c) {
  const day =
    c.dayShift > 0
      ? t("widgets.worldClock.tomorrow")
      : c.dayShift < 0
        ? t("widgets.worldClock.yesterday")
        : null
  return [t("widgets.worldClock.offset", { offset: c.offset }), day].filter(Boolean).join(" · ")
}

/** Ana şehrin etiketi: tarayıcının saat dilimindeyse "Yerel saat", değilse "Ana şehir". */
const homeLabel = (t, c) => (c.isLocal ? t("widgets.worldClock.local") : t("worldClock.home"))

function CityRow({ c, t }) {
  return (
    <li className="flex min-h-6 items-center gap-2 py-0.5 text-[0.8125rem]">
      <span
        aria-hidden="true"
        title={t(`worldClock.legend.${c.period}`)}
        className={cn("size-2 shrink-0 rounded-full ring-2 ring-background", DOT[c.period])}
      />
      <span lang="tr" className="min-w-0 flex-1 truncate font-medium">
        {c.name}
      </span>
      <span className="sr-only">{t(`worldClock.legend.${c.period}`)}</span>
      <span className="wc-offset shrink-0 text-[0.6875rem] tabular-nums text-muted-foreground">
        {shiftText(t, c)}
      </span>
      <span className="w-[2.75rem] shrink-0 text-end font-semibold tabular-nums">{c.time}</span>
    </li>
  )
}

/** Dar kart: ana şehir büyük, yanında kadranı; altında en çok üç şehir satırı. */
function Compact({ home, others, shown, t }) {
  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col @[20rem]/widget:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground">
            <span lang="tr" className="truncate">
              {home.name}
            </span>
            {/* Mini kartta şehir adı kesilmesin: etiket düşer (saatin yerini ad söyler). */}
            <span aria-hidden="true" className="@max-[16rem]/widget:hidden">
              ·
            </span>
            <span className="shrink-0 @max-[16rem]/widget:hidden">{homeLabel(t, home)}</span>
          </p>
          <p className="wc-time mt-0.5 text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {home.time}
          </p>
          <p className="mt-1.5 truncate text-[0.75rem] text-muted-foreground [&::first-letter]:uppercase">
            <span className="@max-[16rem]/widget:hidden">{home.date}</span>
            <span className="hidden @max-[16rem]/widget:inline">{home.dateShort}</span> · {home.utc}
          </p>
        </div>
        <ClockDial
          h={home.h}
          mi={home.mi}
          night={home.night}
          home
          className="wc-dial size-14 shrink-0"
        />
      </div>
      {others.length > 0 ? (
        <ul className="mt-auto divide-y divide-border/60 border-t border-border/60 pt-0.5">
          {pickShown(others, shown, 3).map((c) => (
            <CityRow key={c.id} c={c} t={t} />
          ))}
        </ul>
      ) : (
        <WorldClockButton
          trigger={
            <button
              type="button"
              className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-[0.8125rem] font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
            >
              {t("widgets.worldClock.addCities")}
            </button>
          }
        />
      )}
    </div>
  )
}

/**
 * Geniş kart: kadran sırası — ana şehir ve 3 şehir; ≥ 40rem kapta 5 şehir. Şehirler kişinin
 * iğneledikleri (dünya saati penceresi), yoksa saat dilimlerine yayılan seçim.
 */
function Dials({ home, others, shown, t }) {
  return (
    <>
      <DialRow
        rows={[home, ...pickShown(others, shown, 3)]}
        t={t}
        className="@[20rem]/widget:grid @[40rem]/widget:hidden"
      />
      <DialRow
        rows={[home, ...pickShown(others, shown, 5)]}
        t={t}
        className="@[40rem]/widget:grid"
      />
    </>
  )
}

function DialRow({ rows, t, className }) {
  return (
    <ul
      className={cn(
        "mt-3 hidden flex-1 content-center items-start gap-x-2 gap-y-3",
        COLS[rows.length],
        className,
      )}
    >
      {rows.map((c) => (
        <li key={c.id} className="flex min-w-0 flex-col items-center text-center">
          <ClockDial h={c.h} mi={c.mi} night={c.night} home={c.isHome} className="size-[4.25rem]" />
          <span lang="tr" className="mt-2 w-full truncate text-[0.8125rem] font-semibold">
            {c.name}
          </span>
          <span className="text-[0.75rem] font-medium tabular-nums">{c.time}</span>
          <span className="w-full truncate text-[0.6875rem] text-muted-foreground">
            {c.isHome ? homeLabel(t, c) : shiftText(t, c)}
          </span>
          <span className="sr-only">{t(`worldClock.legend.${c.period}`)}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Dünya saati — dünya saati penceresinin şehirleri (`useWorldClock`, aynı liste; pencerede
 * eklenen şehir burada da görünür). Dar kartta ana şehir büyük ve şehir satırları (fark, gün,
 * mesai noktası); genişte analog kadranlar. "Planla" pencereyi açar (24 saatlik şerit, en uygun
 * toplantı saati). Saat dakikada bir yürür (`ctx.now`).
 */
export function WorldClockWidget({ ctx, className }) {
  const { t } = useLocale()
  const clock = useWorldClock()
  const rows = useCityTimes({ home: clock.home, cities: clock.cities, now: ctx.now })
  const [home, ...others] = rows
  return (
    <WidgetFrame
      id="world-clock"
      title={t("widgets.worldClock.title")}
      shortTitle={t("widgets.worldClock.titleShort")}
      icon={TimeZoneIcon}
      className={className}
      action={
        <WorldClockButton trigger={<FrameAction>{t("widgets.worldClock.plan")}</FrameAction>} />
      }
    >
      {home && (
        <>
          <Compact home={home} others={others} shown={clock.shown} t={t} />
          <Dials home={home} others={others} shown={clock.shown} t={t} />
        </>
      )}
    </WidgetFrame>
  )
}
