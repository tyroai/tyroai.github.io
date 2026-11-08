import { HugeiconsIcon } from "@hugeicons/react"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import HierarchyIcon from "@hugeicons/core-free-icons/HierarchyIcon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import TelephoneIcon from "@hugeicons/core-free-icons/TelephoneIcon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { teamsChat } from "@/lib/celebrate"
import { Highlighted } from "../files/FileRow"
import { useOrgNav } from "./useOrgNav"

// Ad dışında eşleşen alan satırın üçüncü satırında görünür: kişi NEDEN geldi.
const EXTRA = {
  office: { icon: Location01Icon, value: (p) => p.office },
  city: { icon: Location01Icon, value: (p) => p.city },
  company: { icon: Building03Icon, value: (p) => p.company },
  mail: { icon: Mail01Icon, value: (p) => p.address },
}

/**
 * Bul'un kişi satırı: foto (canlı durumla) · ad · unvan · departman; basınca kişi kartı
 * (`PersonPopover` — dört eylem, telefonlar, yönetici). Geniş kapsayıcıda sağda Teams, e-posta
 * ve organizasyon kısayolu; dar ekranda kart yeter (kartta "Organizasyonda gör" var).
 * `tag`: adın yanında küçük etiket (ekipte "Yöneticin" gibi).
 */
export function PersonRow({ person, photo, presence, query = "", field, phone, tag }) {
  const { t } = useLocale()
  const sub = [person.title, person.department].filter(Boolean).join(" · ")
  const extra = field === "phone" ? null : EXTRA[field]
  const extraValue = extra?.value(person)
  const id = person.upn || person.address
  const openOrg = useOrgNav()
  return (
    <li className="group/row flex min-w-0 items-center gap-1 rounded-2xl transition hover:bg-accent/45">
      <PersonPopover person={{ name: person.name, address: person.address, title: person.title }}>
        {(trigger) => (
          <button
            {...trigger}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2.5 py-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-14"
          >
            <PersonAvatar
              name={person.name}
              photo={photo}
              presence={presence}
              presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
              className="size-10 text-[0.75rem] [&>span:first-of-type]:text-[0.75rem]"
            />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <span lang="tr" className="truncate text-[0.875rem] font-semibold leading-snug">
                  <Highlighted text={person.name} query={query} />
                </span>
                {tag && (
                  <span className="shrink-0 rounded-full bg-brand/[0.09] px-1.5 py-px text-[0.625rem] font-semibold text-brand-ink">
                    {tag}
                  </span>
                )}
              </span>
              {sub && (
                <span
                  lang="tr"
                  className="block truncate text-[0.75rem] leading-snug text-muted-foreground [&_mark]:text-foreground"
                >
                  <Highlighted text={sub} query={query} />
                </span>
              )}
              {(phone || extraValue) && (
                <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.71875rem] leading-snug text-foreground/75 [&_mark]:text-foreground">
                  <HugeiconsIcon
                    icon={phone ? TelephoneIcon : extra.icon}
                    className="size-3 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span lang="tr" className="truncate tabular-nums">
                    {phone ?? <Highlighted text={extraValue} query={query} />}
                  </span>
                </span>
              )}
            </span>
          </button>
        )}
      </PersonPopover>
      {id && (
        <div className="hidden shrink-0 items-center gap-0.5 pe-1.5 @[34rem]/files:flex">
          <Quick
            href={teamsChat(id)}
            icon={BubbleChatIcon}
            label={`${t("person.chatTitle")} — ${person.name}`}
          />
          <Quick
            href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(person.address)}`}
            icon={Mail01Icon}
            label={`${t("person.mailTitle")} — ${person.name}`}
          />
          {person.id && (
            <Quick
              onClick={() => openOrg(person.id)}
              icon={HierarchyIcon}
              label={`${t("find.org.open")} — ${person.name}`}
            />
          )}
        </div>
      )}
    </li>
  )
}

const QUICK =
  "grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-brand/[0.09] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/** Kısayol: `href` dış bağlantı (yeni sekme), `onClick` uygulama içi (organizasyon). */
function Quick({ href, onClick, icon, label }) {
  const glyph = (
    <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.9} aria-hidden="true" />
  )
  if (onClick)
    return (
      <button type="button" onClick={onClick} aria-label={label} title={label} className={QUICK}>
        {glyph}
      </button>
    )
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={QUICK}
    >
      {glyph}
    </a>
  )
}
