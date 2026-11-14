import { HugeiconsIcon } from "@hugeicons/react"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import IdCardIcon from "@hugeicons/core-free-icons/IdCardIcon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { teamsChat } from "@/lib/celebrate"
import { cn } from "@/lib/utils"

const PILL =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.75rem] font-semibold text-foreground/85 transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"

const cardPerson = (p) => ({ name: p.name, address: p.address, title: p.title })

/**
 * Ağacın bir düğümü: basınca ağaç o kişiye taşınır; sağdaki kart düğmesi kişi kartını açar
 * (iki KARDEŞ düğme, iç içe değil). `line`: zincirde bir alttaki düğüme inen çizgi.
 */
export function OrgNode({ person, photo, onFocus, line = false }) {
  const { t } = useLocale()
  const sub = [person.title, person.department].filter(Boolean).join(" · ")
  return (
    <li className="relative flex min-w-0 items-center gap-1 rounded-2xl transition hover:bg-accent/45">
      {line && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute start-[1.8125rem] top-[calc(50%+1.25rem)] -bottom-2 w-px bg-border"
        />
      )}
      <button
        type="button"
        onClick={() => onFocus(person.id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2.5 py-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-14"
      >
        <PersonAvatar
          name={person.name}
          photo={photo}
          className="size-10 text-[0.75rem] [&>span:first-of-type]:text-[0.75rem]"
        />
        <span className="min-w-0 flex-1">
          <span lang="tr" className="block truncate text-[0.875rem] font-semibold leading-snug">
            {person.name}
          </span>
          {sub && (
            <span
              lang="tr"
              className="block truncate text-[0.75rem] leading-snug text-muted-foreground"
            >
              {sub}
            </span>
          )}
        </span>
      </button>
      <PersonPopover person={cardPerson(person)}>
        {(trigger) => (
          <button
            {...trigger}
            aria-label={t("person.openCard", { name: person.name })}
            title={t("person.card")}
            className="me-1.5 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-brand/[0.09] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"
          >
            <HugeiconsIcon
              icon={IdCardIcon}
              className="size-4"
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </button>
        )}
      </PersonPopover>
    </li>
  )
}

/** Ağacın odağındaki kişi: zincirin sonunda, marka yıkamalı kart; kart · sohbet · e-posta. */
export function OrgFocus({ person, photo, presence }) {
  const { t } = useLocale()
  const where = [person.department, person.office].filter(Boolean).join(" · ")
  return (
    <li
      aria-current="true"
      className="rounded-2xl bg-brand/[0.07] p-3 ring-1 ring-inset ring-brand/20"
    >
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar
          name={person.name}
          photo={photo}
          presence={presence}
          presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
          className="size-12 text-[0.875rem] [&>span:first-of-type]:text-[0.875rem]"
        />
        <div className="min-w-0 flex-1">
          <p lang="tr" className="truncate text-[0.9375rem] font-semibold leading-snug">
            {person.name}
          </p>
          {person.title && (
            <p lang="tr" className="truncate text-[0.75rem] leading-snug text-foreground/75">
              {person.title}
            </p>
          )}
          {where && (
            <p lang="tr" className="truncate text-[0.75rem] leading-snug text-foreground/70">
              {where}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <PersonPopover person={cardPerson(person)}>
          {(trigger) => (
            <button {...trigger} className={PILL}>
              <HugeiconsIcon
                icon={IdCardIcon}
                className="size-3.5 text-brand"
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {t("person.card")}
            </button>
          )}
        </PersonPopover>
        <a
          href={teamsChat(person.upn || person.address)}
          target="_blank"
          rel="noopener noreferrer"
          className={PILL}
        >
          <HugeiconsIcon
            icon={BubbleChatIcon}
            className="size-3.5 text-brand"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          {t("person.chat")}
        </a>
        <a
          href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(person.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(PILL)}
        >
          <HugeiconsIcon
            icon={Mail01Icon}
            className="size-3.5 text-brand"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          {t("person.mail")}
        </a>
      </div>
    </li>
  )
}
