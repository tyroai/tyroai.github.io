import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePresence } from "@/hooks/usePresence"
import { cn } from "@/lib/utils"

// Kartın içinde ikinci bir kart değil, basılabilir bir kişi: ince kenar, sakin zemin; kart
// açıkken marka tonu. Geniş formda sonuna kadar uzamaz (boş bir şerit olurdu).
const TILE =
  "group/approver flex min-h-11 w-full max-w-[22rem] items-center gap-3 rounded-xl border border-black/[0.07] bg-foreground/[0.02] py-2 ps-2 pe-2.5 text-start transition-[background-color,border-color] hover:border-black/[0.13] hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:border-brand/40 aria-expanded:bg-brand/[0.06] dark:border-white/[0.09] dark:hover:border-white/[0.16]"

/**
 * Yöneticinin kişi düğmesi: foto (yoksa baş harfler) · ad · unvan · ok. Basınca kişi kartı
 * (`PersonPopover`: sohbet, e-posta, arama, toplantı). Foto ve canlı durum kişi kartıyla aynı
 * bellek önbelleğinden, yalnız sessizce; izin yoksa baş harfler ve noktasız avatar.
 * `labelledBy`: dışarıdaki etiket ("Yöneticin") — erişilebilir ad "Yöneticin Ayşe Yılmaz" olur.
 */
export function ApproverPerson({ manager, labelledBy, describedBy, className }) {
  const { t } = useLocale()
  const id = useId()
  const address = String(manager.address ?? "")
    .trim()
    .toLowerCase()
  const list = address ? [address] : []
  const photo = usePeoplePhotos(list).get(address)
  const presence = usePresence(list).get(address)
  const nameId = `${id}-name`
  const titleId = `${id}-title`
  const stateId = `${id}-state`
  const described = [manager.title && titleId, presence && stateId, describedBy]
    .filter(Boolean)
    .join(" ")

  return (
    <PersonPopover
      person={{ name: manager.name, address: manager.address, title: manager.title }}
      align="start"
    >
      {(trigger) => (
        <button
          {...trigger}
          title={t("selfService.profile.openCard", { name: manager.name })}
          aria-labelledby={[labelledBy, nameId].filter(Boolean).join(" ")}
          aria-describedby={described || undefined}
          className={cn(TILE, className)}
        >
          <span
            aria-hidden="true"
            className="shrink-0 rounded-full ring-2 ring-brand/20 ring-offset-1 ring-offset-card"
          >
            <PersonAvatar
              name={manager.name}
              photo={photo}
              presence={presence}
              presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
              className="size-9 align-top [&>span:first-of-type]:text-[0.75rem]"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span
              id={nameId}
              lang="tr"
              className="line-clamp-2 text-[0.875rem] font-semibold leading-snug [overflow-wrap:anywhere]"
            >
              {manager.name}
            </span>
            {manager.title && (
              <span
                id={titleId}
                lang="tr"
                className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug text-muted-foreground"
              >
                {manager.title}
              </span>
            )}
            {presence && (
              <span id={stateId} className="sr-only">
                {t(`calendar.presence.${presence}`)}
              </span>
            )}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            aria-hidden="true"
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/approver:translate-x-0.5 group-hover/approver:text-foreground rtl:rotate-180 rtl:group-hover/approver:-translate-x-0.5"
          />
        </button>
      )}
    </PersonPopover>
  )
}
