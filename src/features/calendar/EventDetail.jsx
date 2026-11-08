import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { EventDetailCard } from "@/components/common/event-detail/EventDetailCard"
import { AnchoredPopover } from "./AnchoredPopover"
import { CelebrationDetail, HolidayDetail, TaskDetail, TeamLeaveDetail } from "./DetailBodies"
import { SharedDetail } from "./SharedDetail"

/** Toplantı, odak bloğu ve seyahat: Outlook'un etkinlik kartı (header ve Anasayfa'yla aynı). */
function MeetingBody({ item, onClose }) {
  // "Şimdi" açılışta bir kez okunur: canlı toplantıda Katıl düğmesi öne çıkar.
  const [now] = useState(() => Date.now())
  const live = now >= item.start.getTime() - 15 * 60_000 && now <= item.end.getTime()
  return <EventDetailCard event={item.source} live={live} onAnswered={onClose} />
}

export function DetailBody({ item, access, board, onClose }) {
  switch (item.kind) {
    case "task":
      return <TaskDetail item={item} board={board} access={access} onClose={onClose} />
    case "teamLeave":
      return <TeamLeaveDetail item={item} />
    case "shared":
      return <SharedDetail item={item} />
    case "celebration":
      return <CelebrationDetail item={item} onClose={onClose} />
    case "holiday":
      return <HolidayDetail item={item} access={access} onClose={onClose} />
    default:
      return <MeetingBody item={item} onClose={onClose} />
  }
}

/**
 * Etkinliğe tıklayınca ayrıntı: masaüstünde bloğa bağlı popover (380 px), telefonda alttan
 * çekmece. İçerik türe göre: toplantı kartı · görev · ekip izni · paylaşılan takvimden kayıt · kişi kartı · tatil. Kendi iznim
 * burada değil: Self Servis'in kayıt ayrıntısı açılır (izin masası, `CalendarScreen`).
 * `target` = `{ item, anchor }` ya da null.
 */
export function EventDetail({ target, access, board, onClose }) {
  const { t } = useLocale()
  if (!target) return null
  const { item, anchor } = target
  return (
    <AnchoredPopover
      key={item.id}
      anchor={anchor}
      onClose={onClose}
      // Çekmecenin başlığı türün adı (kartın kendi başlığı tekrar etmesin); popover'ın adı etkinlik.
      title={t(`calendar.page.kind.${item.kind}`)}
      label={item.title}
      className="cal-pop cal-pop-detail"
    >
      <DetailBody item={item} access={access} board={board} onClose={onClose} />
    </AnchoredPopover>
  )
}
