import { HugeiconsIcon } from "@hugeicons/react"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { accentColor, FEED_SOURCES } from "@/lib/feedPolicy"
import { cn } from "@/lib/utils"
import { MARK_LOOK } from "./rail/markLook"
import { MARK_KINDS, RAIL_SECTIONS, railKey } from "./rail/railModel"
import { hiddenCount } from "./useFeedHidden"

/**
 * POPÜLER'İ ÖZELLEŞTİR — arama ile Yenile arasındaki "Özelleştir" düğmesi (ikon + yazı). İki grup:
 * akışta görünen öğeler (üç Outlook işareti ayrı ayrı: bayraklı · önemli · sabitlenmiş; her kanal)
 * ve sağ rayın bölümleri (gönderenler · sabitlenenler · kanallar). İşareti kalkan öğe gizlenir
 * (`useFeedHidden`, bu tarayıcıda). Kaç öğe gizliyse düğmede yazar; "Hepsini göster" sıfırlar.
 * Yalnız Popüler sekmesinde çizilir.
 */
export function FeedCustomize({ hidden, onToggle, onReset }) {
  const { t } = useLocale()
  const off = hiddenCount(hidden)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            // Araç çubuğu standardı: ikincil eylem gri kapsül (Yenile'yle aynı), çerçevesiz.
            "inline-flex h-control shrink-0 items-center gap-1.5 rounded-full bg-muted px-3.5 text-callout text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-accent",
            off > 0 && "text-brand-ink",
          )}
        >
          <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.9} />
          {t("feed.customize.button")}
          {/* Kaç öğenin gizlendiği yazının yanında (eskiden ikonun köşesinde). */}
          {off > 0 && (
            <span className="grid min-w-4 place-items-center rounded-full bg-brand-solid px-1 text-[0.625rem] font-semibold leading-4 text-brand-on-brand">
              {off}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label={t("feed.customize.button")}
        className="block max-h-[min(34rem,var(--radix-popover-content-available-height))] w-72 overflow-y-auto p-1.5"
      >
        <CustomizeList hidden={hidden} onToggle={onToggle} onReset={onReset} />
      </PopoverContent>
    </Popover>
  )
}

/** Akıştaki öğeler: üç işaret (ikon rozetiyle) ve kanallar. */
const feedItems = (t) => [
  ...MARK_KINDS.map((id) => ({
    id,
    label: t(`feed.rail.kind.${id}`),
    look: MARK_LOOK[id],
  })),
  ...FEED_SOURCES.map((s) => ({
    id: s.tag,
    label: t(`feed.tag.${s.tag}`),
    dot: accentColor(s.accent),
  })),
]

const railItems = (t) =>
  RAIL_SECTIONS.map((id) => ({ id: railKey(id), label: t(`feed.rail.section.${id}`) }))

function Row({ item, hidden, onToggle }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.8125rem] transition hover:bg-foreground/[0.05] [@media(pointer:coarse)]:min-h-11">
      <Checkbox checked={!hidden.has(item.id)} onCheckedChange={() => onToggle(item.id)} />
      {item.look && (
        <span
          className={cn("grid size-5 shrink-0 place-items-center rounded-md", item.look.tone)}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={item.look.icon} className="size-3" strokeWidth={2.2} />
        </span>
      )}
      {/* Kanalın noktası, işaret rozetiyle aynı sütunda: etiketler hizalı. */}
      {item.dot && (
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
          <span className="size-1.5 rounded-full" style={{ background: item.dot }} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </label>
  )
}

/**
 * Öğelerin listesi — masaüstünde açılır kutuda, telefonda alttan açılan pencerede. Sağ ray
 * telefonda yok: orada `rail={false}` ve yalnız akış öğeleri.
 */
export function CustomizeList({ hidden, onToggle, onReset, showTitle = true, rail = true }) {
  const { t, locale } = useLocale()
  const off = hiddenCount(hidden, { rail })
  return (
    <>
      {(showTitle || off > 0) && (
        <p className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
          <span className="text-[0.75rem] font-semibold text-foreground">
            {showTitle ? t("feed.customize.title") : ""}
          </span>
          {off > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-[0.6875rem] font-medium text-muted-foreground transition hover:text-foreground"
            >
              {t("feed.customize.reset")}
            </button>
          )}
        </p>
      )}
      {feedItems(t).map((item) => (
        <Row key={item.id} item={item} hidden={hidden} onToggle={onToggle} />
      ))}
      {rail && (
        <>
          <p
            lang={locale}
            className="mt-1.5 border-t border-border/60 px-2 pb-1 pt-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
          >
            {t("feed.rail.group")}
          </p>
          {railItems(t).map((item) => (
            <Row key={item.id} item={item} hidden={hidden} onToggle={onToggle} />
          ))}
        </>
      )}
    </>
  )
}
