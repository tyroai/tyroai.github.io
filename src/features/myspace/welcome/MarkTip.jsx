import { EventDetailCard } from "@/components/common/event-detail/EventDetailCard"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useHoverPopover } from "@/hooks/useHoverPopover"
import { useLocale } from "@/hooks/useLocale"
import { alignFor } from "@/lib/placement"
import { StoryTip } from "../hello/HelloParts"
import { InsightTip } from "../InsightTip"

// Toplantı kartının yaklaşık ölçüsü (px): yön seçimi için (`lib/placement`).
const CARD_SIZE = { width: 344, height: 520 }
const PREFER = ["bottom", "top", "right", "left"]

/** Vurgulu yazı düğme olarak: üstüne gelince ya da basınca ayrıntısı açılır (noktalı alt çizgi). */
function MarkButton({ children, ...rest }) {
  return (
    <button type="button" className="welcome-mark welcome-mark-tip" {...rest}>
      {children}
    </button>
  )
}

/** Tek toplantı: Sıradaki toplantı kartının açtığı ayrıntı kartının aynısı (`EventDetailCard`). */
function EventPeek({ event, live, children }) {
  const { t } = useLocale()
  const isMobile = useIsMobile()
  const peek = useHoverPopover({
    openDelay: 200,
    closeDelay: 150,
    side: "bottom",
    prefer: PREFER,
    size: CARD_SIZE,
  })
  return (
    <Popover open={peek.open} onOpenChange={peek.onOpenChange}>
      <PopoverTrigger asChild>
        <MarkButton {...peek.triggerProps}>{children}</MarkButton>
      </PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : peek.side}
        align={isMobile ? "start" : alignFor(peek.side)}
        sideOffset={10}
        collisionPadding={12}
        {...peek.contentProps}
        aria-label={event.subject || t("calendar.noSubject")}
        className="max-h-[var(--radix-popover-content-available-height)] w-[21.5rem] gap-0 overflow-y-auto overscroll-contain p-0"
      >
        <EventDetailCard event={event} live={live} />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Karşılama kartında vurgulu (beyaz) yazının ayrıntısı — satırın `tip`ine göre (`useHelloChat`):
 * tek toplantı ayrıntı kartı, toplantı listesi, brifingin ipuçları (açık ve gecikmiş işler, posta,
 * davet, Ticket: listeden önizleme, dipte ilgili yer) ya da günün okuması. `tips` · `meetingsTip`:
 * `widgets/useBriefTips`. İpucu yoksa çağıran düz `Mark` çizer.
 */
export function MarkTip({ tip, tips, meetingsTip, story, onChanged, children }) {
  if (tip.kind === "event") {
    return (
      <EventPeek event={tip.event} live={tip.live}>
        {children}
      </EventPeek>
    )
  }
  if (tip.kind === "story") {
    return (
      <StoryTip story={story} onChanged={onChanged}>
        <MarkButton>{children}</MarkButton>
      </StoryTip>
    )
  }
  const props = tip.kind === "meetings" ? meetingsTip(tip.list, tip.title) : tips[tip.id]
  if (!props) return <span className="welcome-mark">{children}</span>
  return (
    <InsightTip {...props}>
      <MarkButton>{children}</MarkButton>
    </InsightTip>
  )
}
