import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { personLayer, shortNames } from "@/lib/calendar/people"
import { personHue } from "@/lib/personTone"

// Düğmede en çok bu kadar avatar üst üste (yazılıyken iki: düğme "Kişi ekle"den geniş olmasın, başlık
// sıkışmasın; yalnız simgeyken üç). Fazlası "N kişi" yazısında.
const STACK = 3
const STACK_LABELLED = 2

/**
 * Başlıktaki "Kişi ekle": paylaşılan takvimi eklenmiş kişiler düğmenin ÜSTÜNDE (sahibin isteği; katman
 * satırında çip yok). Tek kişi: avatar + kısa ad; birden çok: üst üste küçük avatarlar + "N kişi".
 * Avatar halkası kişinin rengi (ızgaradaki kayıtlarıyla aynı); gizlenmiş kişi soluk. `compact`
 * (telefon, dar kap) yalnız simge ya da avatarlar. Basınca aynı düzenleyici açılır (liste, ✕, ekleme).
 * `people`: `[{ person, state }]` (`features/calendar/lib/status › peopleStatus`).
 */
export function PeopleButton({ people, layers, compact, onClick, onPrefetch }) {
  const { t } = useLocale()
  const persons = useMemo(() => people.map((r) => r.person), [people])
  const photos = usePeoplePhotos(persons.map((p) => p.address))
  const names = useMemo(() => shortNames(persons), [persons])
  const base = t("calendar.sharedAddMore")
  const key = (p) => p.address.toLowerCase()
  const label =
    persons.length === 1
      ? names.get(key(persons[0]))
      : t("calendar.page.people.count", { n: persons.length })
  const who =
    persons.length > 0 && persons.length <= STACK
      ? persons.map((p) => names.get(key(p))).join(", ")
      : label
  const empty = persons.length === 0
  return (
    <ActionButton
      tone={compact && empty ? "plain" : "soft"}
      size="toolbar"
      className="cal-people-btn"
      iconOnly={compact && empty}
      data-compact={(compact && !empty) || undefined}
      data-people={!empty || undefined}
      aria-haspopup="dialog"
      aria-label={empty && compact ? base : undefined}
      onClick={(e) => onClick(e.currentTarget)}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      {empty ? (
        <HugeiconsIcon icon={UserAdd01Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
      ) : (
        <span className="cal-stack" aria-hidden="true">
          {persons.slice(0, compact ? STACK : STACK_LABELLED).map((p) => (
            <span
              key={key(p)}
              className="cal-stack-av"
              data-tone="shared"
              data-off={layers[personLayer(p.address)] === false || undefined}
              style={{ "--hue": personHue(p.name) }}
            >
              <PersonAvatar name={p.name} photo={photos.get(key(p))} className="cal-bav" />
            </span>
          ))}
        </span>
      )}
      {/* Ad içerikten: "Kişi ekle — Elif seçili" ekran okuyucuya; görünen kısa ad onun parçası. Ayrı
          `aria-label` olsaydı avatarlardaki baş harfler görünen metinle adı uyuşmaz kılıyordu. */}
      {!empty && (
        <span className="cal-sr">
          {t("calendar.page.people.selected", { label: base, names: who })}
        </span>
      )}
      {!compact && (
        <span className="cal-people-label" aria-hidden={!empty || undefined}>
          {empty ? base : label}
        </span>
      )}
    </ActionButton>
  )
}
