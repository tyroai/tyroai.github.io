import { HugeiconsIcon } from "@hugeicons/react"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { minutesText } from "@/components/common/event-detail/eventFormat"
import { useLocale } from "@/hooks/useLocale"
import { openTarget } from "@/features/calendar/lib/holidayBlocks"
import { clock, srKind, timeRange, whenText } from "./format"
import { useIsActive } from "./activeItem"
import { ITEM_ICONS } from "./icons"

/** Bu yükseklikte (saat) ve altındaki blok tek satır: başlık ve saat yan yana (45 dk dahil). */
const SHORT_HOURS = 0.8
// Bu kadar ya da daha uzun blokta ayrıntı bloğa değil basılan noktaya bağlanır (aşağıda).
const TALL_HOURS = 4

/**
 * Ayrıntının bağlanacağı yer. Uzun blok (tatil mesai kadar) pencereden taşar: popover onun kenarına
 * bağlanırsa sığacak yer bulamaz, sıkışıp düğmeleri kesilir. Fareyle basılınca basılan nokta, klavyeyle
 * (`detail` 0) blokun kendisi; kapanınca odak yine bloğa döner.
 */
function anchorOf(e, hours) {
  const el = e.currentTarget
  if (hours < TALL_HOURS || e.detail === 0) return el
  const { clientX: x, clientY: y } = e
  return {
    getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
    get isConnected() {
      return el.isConnected
    },
    focus: (options) => el.focus(options),
  }
}

/**
 * Saat ızgarasındaki etkinlik kartı: yumuşak zemin, aynı tonun koyusu yazı. Üst satır soluk saat ·
 * süre ve sağda türün rozeti (Toplantı, Görev, İzin…; rozet tonun koyusunda), altında kalın başlık,
 * yer varsa konum ve katılımcı sayısı, sonra durum. Kartın yüksekliği ve genişliği azaldıkça önce
 * ek satırlar, sonra rozet, sonra üst satır düşer (kap sorgusu, `calendarEvent.css`); kısa blokta
 * (45 dk altı) yalnız başlık ve saat. Konum ve boyut CSS değişkenleriyle (`--top` `--h` saat; `--x`
 * `--w` sütun payı). Üst satır görseldir (`aria-hidden`): tür ve zaman ekran okuyucuya görünmez ön
 * ve son ekle gider. Resmî tatil de bu blokla çizilir (türev kopya): basınca ayrıntı asıl tatil
 * öğesiyle açılır (`openTarget`).
 */
export function EventBlock({ row, band = false, detail = false, onOpen }) {
  const { locale, t } = useLocale()
  const { item, from, to, lane, lanes, span } = row
  const hours = (to - from) / 60
  const Icon = ITEM_ICONS[item.icon]
  const guests = item.source?.attendees?.length ?? 0
  // Tatil zemininde saat yazılmaz (mesai kadar çizilir, gerçek bir saat değil).
  const timed = !item.allDay && item.kind !== "holiday"
  const minutes = Math.round((item.end - item.start) / 60000)
  const active = useIsActive(openTarget(item).id)
  return (
    <button
      type="button"
      className="cal-ev"
      data-tone={item.kind}
      data-state={item.state ?? undefined}
      data-short={hours < SHORT_HOURS || undefined}
      data-band={band || undefined}
      data-detail={detail || undefined}
      data-active={active || undefined}
      title={[item.title, item.tail, timeRange(item, locale)].filter(Boolean).join(" · ")}
      style={{
        "--top": from / 60,
        "--h": hours,
        "--x": lane / lanes,
        "--w": span / lanes,
        // Paylaşılan takvimde kişinin rengi (`data-tone="shared"` bu tondan renk türetir).
        "--hue": item.hue,
      }}
      onClick={(e) => onOpen(openTarget(item), anchorOf(e, hours))}
    >
      <span className="cal-ev-top" aria-hidden="true">
        {timed && <span className="cal-ev-time">{clock(item.start, locale)}</span>}
        {timed && <span className="cal-ev-dur">{minutesText(minutes, t)}</span>}
        <span className="cal-ev-badge">{t(`calendar.page.badge.${item.kind}`)}</span>
      </span>
      <span data-private="" className="cal-ev-title">
        <span className="cal-sr">{srKind(item, t)}</span>
        {Icon && (
          <HugeiconsIcon icon={Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
        )}
        {/* Alçak kartta üst satır düşer: saat başlığın önüne geçer (kap sorgusu). */}
        {timed && (
          <span className="cal-ev-tin" aria-hidden="true">
            {clock(item.start, locale)}
          </span>
        )}
        {item.title}
      </span>
      {(item.where || guests > 0) && (
        <span className="cal-ev-line">
          {item.where && (
            <span className="cal-ev-meta">
              <HugeiconsIcon
                icon={Location01Icon}
                className="cal-ic"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span data-private="">{item.where}</span>
            </span>
          )}
          {guests > 0 && (
            <span className="cal-ev-meta">
              <HugeiconsIcon
                icon={UserGroupIcon}
                className="cal-ic"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span aria-hidden="true">{guests}</span>
              <span className="cal-sr">{t("calendar.attendees", { count: guests })}</span>
            </span>
          )}
        </span>
      )}
      {item.sub && (
        <span data-private="" className="cal-ev-sub">
          {item.sub}
        </span>
      )}
      <span className="cal-sr">, {whenText(item, locale, t)}</span>
    </button>
  )
}
