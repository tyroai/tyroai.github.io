import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"

// Müsaitlik durumu → avatarın canlı durum noktası (Teams renkleri).
const DOT = { free: "available", busy: "busy", oof: "away" }

/**
 * Katılımcı çipi: avatar (durum noktalı), ad, öbür türe taşı (`onMove`; zorunludaysa aşağı ok,
 * isteğe bağlıdaysa yukarı: seçiciler alt alta) ve kaldır. İki düğme de gerçek düğme: klavye ve
 * ekran okuyucu erişir; `data-mv` taşıma sonrası odağı yeni yerindeki düğmeye vermek için.
 * `state`: müsaitlik (`free` · `busy` · `oof`), `optional`: isteğe bağlı çip (kesikli çerçeve).
 */
export function AttendeeChip({ person, optional = false, state, photo, onRemove, onMove }) {
  const { t } = useLocale()
  const dot = DOT[state]
  const moveLabel = t(optional ? "calendar.meet.toRequired" : "calendar.meet.toOptional", {
    name: person.name,
  })
  // Tıklama karoya (arama kutusuna odak) ulaşmasın.
  const press = (fn) => (e) => {
    e.stopPropagation()
    fn(person)
  }
  return (
    <span className="cal-who-chip" data-optional={optional || undefined}>
      <PersonAvatar
        name={person.name}
        photo={photo}
        presence={dot}
        presenceLabel={dot ? t(`calendar.presence.${dot}`) : undefined}
        className="cal-pav"
      />
      <span className="cal-who-name">{person.name}</span>
      {dot && <span className="cal-sr">, {t(`calendar.presence.${dot}`)}</span>}
      {onMove && (
        <button
          type="button"
          className="cal-who-x"
          data-mv={String(person.address).toLowerCase()}
          aria-label={moveLabel}
          title={moveLabel}
          onClick={press(onMove)}
        >
          <HugeiconsIcon
            icon={optional ? ArrowUp01Icon : ArrowDown01Icon}
            className="cal-ic"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </button>
      )}
      <button
        type="button"
        className="cal-who-x"
        aria-label={t("calendar.meet.remove", { name: person.name })}
        onClick={press(onRemove)}
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          className="cal-ic"
          strokeWidth={2.4}
          aria-hidden="true"
        />
      </button>
    </span>
  )
}
