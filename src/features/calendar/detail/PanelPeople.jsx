import { useState } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { groupAttendees } from "@/components/common/event-detail/attendeeStatus"
import { useLocale } from "@/hooks/useLocale"

// Panelde ilk bu kadar kişi; devamı "tümünü göster" ile (panel kendisi kayar, iç kaydırıcı yok).
const FIRST = 6

/**
 * Sağ paneldeki katılımcılar: alt alta fotoğraf · ad · yanıt (düzenleyen önce, sonra kabul eden,
 * belki, reddeden, yanıtsız — kartın gruplarıyla aynı sıra). Kişiye basınca panel o kişinin kartına
 * geçer (`onPerson`).
 */
export function PanelPeople({ people, organizerAddress, photoOf, presenceOf, onPerson }) {
  const { t } = useLocale()
  const [all, setAll] = useState(false)
  const rows = groupAttendees(people, organizerAddress).flatMap((g) =>
    g.people.map((a) => ({ ...a, group: g })),
  )
  const shown = all ? rows : rows.slice(0, FIRST)
  return (
    <>
      <ul className="cal-dp-people">
        {shown.map((a) => {
          const presence = presenceOf(a.address)
          return (
            <li key={a.address || a.name}>
              <button
                type="button"
                className="cal-dp-person"
                onClick={() => onPerson({ name: a.name, address: a.address })}
                title={t("person.openCard", { name: a.name })}
              >
                <PersonAvatar
                  name={a.name}
                  photo={photoOf(a.address)}
                  response={a.response}
                  presence={presence}
                  presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
                  className="cal-dp-av"
                />
                <span data-private="" className="cal-dp-name">
                  {a.name}
                </span>
                <span className="cal-dp-reply" data-group={a.group.key}>
                  {t(a.group.label)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {rows.length > FIRST && (
        <button
          type="button"
          className="cal-dp-more"
          aria-expanded={all}
          onClick={() => setAll((v) => !v)}
        >
          {t(all ? "calendar.hideAll" : "calendar.showAll", { count: rows.length })}
        </button>
      )}
    </>
  )
}
