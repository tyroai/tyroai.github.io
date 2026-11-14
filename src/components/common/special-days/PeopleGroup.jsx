import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import PartyIcon from "@hugeicons/core-free-icons/PartyIcon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { BellSection } from "../bell/BellSection"

const LABEL = {
  birthday: "special.group.birthdays",
  anniversary: "special.group.anniversaries",
  joiner: "special.group.joiners",
}

/**
 * Kutlanan kişinin satırı; basınca kişi kartı açılır (Keşfet'in rayıyla aynı kart, günün
 * bağlamıyla). Ekibinden ya da departmanından biri (`circle`) halkalı fotoğraf ve "Ekibin" /
 * "Departmanın" etiketiyle öne çıkar. Tür bölümün başlığında; sağda yalnız ayırt eden bilgi
 * kalır (kaçıncı yıl, "Senin günün"). Ad `lang="tr"`: Türkçe adlar.
 */
function PersonRow({ person, photo, dayText, isToday, t }) {
  const years = t("feed.cel.years", { count: person.years })
  const meta = person.self ? t("person.selfDay") : person.kind === "anniversary" ? years : null
  const contextText =
    person.kind === "birthday"
      ? dayText
      : person.kind === "joiner"
        ? t(isToday ? "feed.cel.joinedToday" : "special.joinerDay")
        : years

  return (
    <li>
      <PersonPopover
        person={{ name: person.name, address: person.mail, title: person.title }}
        side="left"
        context={{ kind: person.kind, text: contextText, years: person.years }}
      >
        {(trigger) => (
          <button {...trigger} className="bn-row">
            <span className="bn-lead" data-circle={person.circle ? "" : undefined}>
              <PersonAvatar name={person.name} photo={photo} className="bn-avatar" />
            </span>
            <span className="bn-text">
              <span className="bn-name-line">
                <span lang="tr" className="bn-name">
                  {person.name}
                </span>
                {person.circle && (
                  <span className="bn-pill">{t(`special.circle.${person.circle}`)}</span>
                )}
              </span>
              {person.title && (
                <span lang="tr" className="bn-sub">
                  {person.title}
                </span>
              )}
            </span>
            {meta && (
              <span className="bn-meta">
                {person.self && (
                  <HugeiconsIcon icon={PartyIcon} strokeWidth={2} aria-hidden="true" />
                )}
                {meta}
              </span>
            )}
          </button>
        )}
      </PersonPopover>
    </li>
  )
}

/**
 * Bir tür (doğum günü · yıl dönümü · katılan) için başlık + kişiler. `limit`: kalabalık günde
 * ilk bu kadarı görünür, kalanı "N kişi daha" ile açılır (tek kişi için düğme çizilmez); açılınca
 * odak yeni gelen ilk satıra geçer.
 */
export function PeopleGroup({ kind, people, photoOf, dayText, isToday, t, limit }) {
  const [all, setAll] = useState(false)
  const list = useRef(null)
  const capped = Boolean(limit) && !all && people.length > limit + 1
  const visible = capped ? people.slice(0, limit) : people

  useEffect(() => {
    if (all && limit) list.current?.children[limit]?.querySelector("button")?.focus()
  }, [all, limit])

  if (!people.length) return null
  return (
    <BellSection label={t(LABEL[kind])} count={people.length}>
      <ul ref={list} className="bn-list">
        {visible.map((person) => (
          <PersonRow
            key={`${person.kind}:${person.key}`}
            person={person}
            photo={photoOf(person.mail)}
            dayText={dayText}
            isToday={isToday}
            t={t}
          />
        ))}
      </ul>
      {capped && (
        <button type="button" className="bn-more" onClick={() => setAll(true)}>
          {t("bell.more", { n: people.length - limit })}
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </BellSection>
  )
}
