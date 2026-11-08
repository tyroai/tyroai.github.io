import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { leaveLine, occasionLine, peopleText } from "./teamText"
import { cols, ROW } from "./columns"
import { covered } from "./timelineLayout"
import { Bar, Marker } from "./timelineParts"

/** Kişinin kendi satırında "Sen" — marka tonunda küçük etiket. */
export function SelfTag({ label, className }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md bg-brand/[0.1] px-1.5 py-px text-[0.6875rem] font-semibold text-brand-ink",
        className,
      )}
    >
      {label}
    </span>
  )
}
const DAY = 86400000

/**
 * Bölüm satırı (iki bölüm varken): "Bana bağlı olanlar" · "Ekip arkadaşlarım". Boyu sabit (h-8):
 * yükleme iskeleti bölüm satırlarını da bu boyla sayar (`TeamView`).
 */
export function GroupRow({ id, count }) {
  const { t, locale } = useLocale()
  return (
    <div role="row" className={cn(ROW, "h-8 border-b border-border/40")}>
      <span
        role="rowheader"
        className="truncate px-3 pb-1 pt-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground @[60rem]/ss:px-4"
      >
        {t(`selfService.team.group.${id}`)}
      </span>
      <span role="cell" className="min-w-0">
        <span className="sr-only">{peopleText(count, t, locale)}</span>
      </span>
    </div>
  )
}

/** Pencere içindeki doğum günü ve yıl dönümleri → sütunu ve o gün izin çubuğu var mı. */
function marksOf(occasions, segments, first, last) {
  return (occasions ?? [])
    .filter((o) => o.date >= first && o.date <= last)
    .map((o) => {
      const col = Math.round((o.date - first) / DAY)
      return { occasion: o, col, stacked: segments.some((s) => s.from <= col && col <= s.to) }
    })
}

export function Row({ row, occasions, segments, n, first, last, photo, presence, onOpen }) {
  const { t, locale } = useLocale()
  const p = row.person
  const open = () => onOpen(row.key)
  const marks = marksOf(occasions, segments, first, last)
  const lines = [
    ...segments.map((s) => leaveLine(s.record, t, locale)),
    ...marks.map((m) => occasionLine(m.occasion, t, locale)),
  ]
  // Dar kişi sütununda etiket adı keserdi: yönetici bölümün başında, "Yöneticim" okunur adında.
  const self = row.relation === "self"
  const tag =
    row.relation === "manager"
      ? t("selfService.team.managerTag")
      : self
        ? t("selfService.team.you")
        : null
  return (
    <div role="row" className={cn(ROW, "border-b border-border/40 last:border-b-0")}>
      <span role="rowheader" className="min-w-0">
        <button
          type="button"
          data-team-row
          onClick={open}
          aria-label={t("selfService.team.open", { name: tag ? `${p.name} (${tag})` : p.name })}
          className="flex h-10 w-full min-w-0 items-center gap-2 px-3 text-start transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:h-11 @[60rem]/ss:px-4"
        >
          <PersonAvatar
            name={p.name}
            photo={photo}
            presence={presence}
            className="size-6 [&>span:first-of-type]:text-[0.5625rem]"
          />
          <span lang="tr" className="min-w-0 truncate text-[0.8125rem] font-medium">
            {p.name}
          </span>
          {/* Kişi kendini çizelgede hemen bulsun (yönetici etiketi dar sütunda keserdi). */}
          {self && <SelfTag label={tag} />}
        </button>
      </span>
      <span role="cell" className="min-w-0">
        <span className="sr-only">
          {lines.length ? lines.join("; ") : t("selfService.team.timeline.none")}
        </span>
        <span aria-hidden="true" className="grid h-full items-center" style={cols(n)}>
          {segments.map((s) => (
            <Bar
              key={`${s.record.id}-${s.from}`}
              segment={s}
              first={first}
              last={last}
              label={!covered(s, segments)}
              onOpen={open}
            />
          ))}
          {marks.map((m) => (
            <Marker key={m.occasion.kind} {...m} dense={n > 42} onOpen={open} />
          ))}
        </span>
      </span>
    </div>
  )
}
