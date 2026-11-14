import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import PartyIcon from "@hugeicons/core-free-icons/PartyIcon"
import { CelebrateMenu } from "@/components/common/CelebrateMenu"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { useMyIdentity } from "@/hooks/useMyCelebration"
import { firstName } from "@/lib/celebrate"
import { isMine } from "@/lib/myCelebration"

const LINK =
  "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-foreground/80 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

/**
 * Hikâyenin alt eylemleri: Kutla (Teams · Outlook · WhatsApp, `CelebrateMenu`; kendi gününde
 * "Senin günün"), varsa "Bildirimi aç" ve kişi kartı. Kısa ekranda (yatay telefon) tek satır.
 */
export function StoryActions({ story: s, context, onOpenPost }) {
  const { t } = useLocale()
  const ids = useMyIdentity()
  return (
    <div className="relative z-10 flex flex-col gap-2 px-5 pb-5 shortest:flex-row shortest:items-center shortest:pb-3">
      {s.mail && isMine(ids, s.mail) ? (
        <p className="text-center text-xs font-medium text-muted-foreground shortest:flex-1">
          {t("person.selfDay")}
        </p>
      ) : (
        s.mail && (
          <CelebrateMenu
            person={{ name: s.name, address: s.mail, givenName: firstName(s.name) }}
            kind={s.kind}
            years={s.years}
            align="center"
          >
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-fill-deep px-3 text-[0.8125rem] font-semibold text-brand-on-brand ring-1 ring-foreground/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 pointer-coarse:h-11 shortest:flex-1"
            >
              <HugeiconsIcon
                icon={PartyIcon}
                className="size-4"
                strokeWidth={2}
                aria-hidden="true"
              />
              {t(`person.celebrate.${s.kind}`)}
            </button>
          </CelebrateMenu>
        )
      )}
      <div className="flex items-center justify-center gap-1">
        {s.postId && (
          <button type="button" onClick={onOpenPost} className={LINK}>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              className="size-3.5"
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("person.openPost")}
          </button>
        )}
        <PersonPopover
          person={{ name: s.name, address: s.mail, title: s.title }}
          context={context}
          side="top"
        >
          {(trigger) => (
            <button {...trigger} className={LINK}>
              {t("person.card")}
            </button>
          )}
        </PersonPopover>
      </div>
    </div>
  )
}
