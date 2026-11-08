import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useCause } from "@/hooks/useCause"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { withCause } from "@/lib/causeText"
import { personLayer } from "@/lib/calendar/people"
import { personHue } from "@/lib/personTone"

/**
 * "Kişi ekle" düzenleyicisinin listesi — iOS Ayarlar kalıbı (ürün sahibi: "standartlara uymuyor"):
 * satırda avatar · ad · adres ve sağda görünürlük ANAHTARI (satırın tamamı basılır; anlamı
 * belirsiz ✓ yerine). Çıkarmak "Düzenle"de: satırların başında kırmızı eksi, anahtarlar gizli;
 * "Bitti" döner. Takvimi okunamayan kişide uyarı adın altında yazılır (satırı kaydıran ⓘ yok,
 * nedeni yanındaki küçük ipucunda). Avatar halkası kişinin rengi. `people`: `[{ person, state, detail }]`.
 */
function Unreadable({ name, state, detail }) {
  const { t } = useLocale()
  const cause = useCause(detail)
  const base =
    state === "failed" ? t("calendar.page.layer.failed") : t("calendar.sharedUnreachable", { name })
  return (
    <span className="cal-prow-warn">
      {t("calendar.page.people.unreadable")}
      <InfoTip className="cal-info-tip" text={withCause(base, cause)} label={base} />
    </span>
  )
}

export function PeopleList({ people, layers, onToggle, onRemove }) {
  const { t } = useLocale()
  const [editing, setEditing] = useState(false)
  const photos = usePeoplePhotos(people.map((r) => r.person.address))
  if (!people.length) return null
  return (
    <div className="cal-plist" data-editing={editing || undefined}>
      <div className="cal-plist-top">
        <p className="cal-plist-head">{t("calendar.page.people.listHead")}</p>
        <button
          type="button"
          className="cal-plist-edit"
          aria-pressed={editing}
          onClick={() => setEditing((v) => !v)}
        >
          {t(editing ? "calendar.page.people.done" : "calendar.page.people.edit")}
        </button>
      </div>
      <ul>
        {people.map(({ person, state, detail }) => {
          const layer = personLayer(person.address)
          const on = layers[layer] !== false
          const unreadable = state === "unreachable" || state === "failed"
          const body = (
            <>
              <PersonAvatar
                name={person.name}
                photo={photos.get(person.address.toLowerCase())}
                className="cal-bav"
              />
              <span className="cal-prow-text">
                <span className="cal-prow-name">{person.name}</span>
                <span className="cal-prow-mail">{person.address}</span>
              </span>
            </>
          )
          return (
            <li
              key={layer}
              className="cal-prow"
              data-tone="shared"
              data-off={!on || undefined}
              data-loading={state === "loading" || undefined}
              style={{ "--hue": personHue(person.name) }}
            >
              {editing ? (
                <>
                  <button
                    type="button"
                    className="cal-prow-remove"
                    aria-label={t("calendar.page.people.remove", { name: person.name })}
                    onClick={() => onRemove(person)}
                  >
                    <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                  <span className="cal-prow-btn" data-static="">
                    {body}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={t("calendar.page.people.show", { name: person.name })}
                  className="cal-prow-btn"
                  onClick={() => onToggle(layer)}
                >
                  {body}
                  <span aria-hidden="true" className="cal-switch" data-on={on || undefined} />
                </button>
              )}
              {unreadable && (
                <span className="cal-prow-note">
                  <Unreadable name={person.name} state={state} detail={detail} />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
