import { TicketPeek } from "@/components/tibot/TicketPeek"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { formatRelative } from "@/lib/date"
import { counterpart, isOverdue, statusKey, statusLabel, statusTone } from "@/lib/tibot/tibotModel"

const DAY = 24 * 60 * 60 * 1000

/** Hedefi kaç gün geçti (geciken satırın sağındaki kırmızı rozet). */
function daysLate(row, now) {
  const at = Date.parse(row.nextTargetAt ?? "") || Date.parse(row.resolutionTargetAt ?? "")
  return Number.isNaN(at) ? 0 : Math.max(1, Math.floor((now - at) / DAY))
}

/**
 * Kart satırı: solda durum tonunda ince şerit (gecikende kırmızı), konu tek satır, altında durum
 * · karşı taraf · ne zaman; gecikende sağda "57 g" rozeti. Basınca ayrıntı. `peek`: üzerine
 * gelince kart (açılır listenin içinde kapalı).
 */
export function TibotRow({ row, bucket, onOpen, peek = true }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const key = statusKey(row)
  const late = isOverdue(row)
  const who = counterpart(row, bucket)
  const button = (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="tbw-row"
      data-tone={late ? "danger" : statusTone(key)}
    >
      <span aria-hidden="true" className="tbw-bar" />
      <span className="tbw-text">
        <span className="tbw-subject">{row.subject}</span>
        <span className="tbw-meta">
          {[statusLabel(t, key, bucket === "mine"), who, formatRelative(row.updatedAt, locale)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      {late && (
        <span className="tbw-late">
          <span aria-hidden="true">
            {t("tibot.lateShort", { n: daysLate(row, today.getTime()) })}
          </span>
          <span className="sr-only">{t("tibot.overdue")}</span>
        </span>
      )}
    </button>
  )
  return (
    <li>
      {peek ? (
        <TicketPeek row={row} bucket={bucket}>
          {button}
        </TicketPeek>
      ) : (
        button
      )}
    </li>
  )
}
