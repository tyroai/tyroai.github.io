import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { day } from "../kinds"
import { FROST } from "./heroStyles"
import { tenureText } from "./profileText"

const PILL = "inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full pointer-coarse:min-h-11"

function Manager({ manager }) {
  const { t } = useLocale()
  return (
    <PersonPopover
      person={{ name: manager.name, address: manager.address, title: manager.title }}
      align="start"
    >
      {(trigger) => (
        <button
          {...trigger}
          aria-label={t("selfService.profile.openCard", { name: manager.name })}
          // Ad kısalabilir: tamamı ipucunda.
          title={`${t("selfService.profile.manager")}: ${manager.name}`}
          className={cn(PILL, FROST, "px-3 text-[0.8125rem] font-semibold")}
        >
          {/* Yalnız bağlantı ikonu ve ad: "Bağlı olduğum kişi" etiketi ve avatar kalabalıktı. */}
          <HugeiconsIcon icon={Link01Icon} aria-hidden="true" className="size-4" strokeWidth={2} />
          <span lang="tr" className="truncate">
            {manager.name}
          </span>
        </button>
      )}
    </PersonPopover>
  )
}

/**
 * Kartın kişi satırı: hizmet süresi, bağlı olunan kişi (basınca kişi kartı) ve hemen yanında
 * ekibe geçiş — "Ekibim n" (ekip görünümünde "Bilgilerim"e dönüş). Ayrı sekme yok: ekip, bağlı
 * olunan kişinin yanından açılıyor. Bilinmeyen bilgi çizilmez; beklenirken yer tutulur. Kartın
 * boyu sabitken (`selfHero.css`, `.ss-hero-people`) tek sıra: sığmazsa yalnız bağlı olunan kişinin
 * adı kısalır; başka yerde sıra kırılır.
 */
export function HeroPeople({ profile, team }) {
  const { t, locale } = useLocale()
  const pending = profile?.pending ?? {}
  const tenure = profile?.hireDate ? tenureText(profile.hireDate, t, locale) : null
  const manager = profile?.manager ?? null
  const hired = profile?.hireDate
    ? t("selfService.profile.hired", { date: day(profile.hireDate, locale) })
    : undefined
  const skeleton = (w) => (
    <span aria-hidden="true" className={cn("block h-9 rounded-full bg-white/20", w)} />
  )

  return (
    <div className="ss-hero-people flex min-w-0 flex-wrap items-center gap-2">
      {tenure ? (
        <span
          title={hired}
          className={cn(PILL, FROST, "shrink-0 px-3 text-[0.8125rem] font-semibold")}
        >
          <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" className="size-4" strokeWidth={2} />
          <span className="sr-only">{t("selfService.profile.tenure")}: </span>
          {tenure}
        </span>
      ) : (
        pending.hireDate && skeleton("w-24")
      )}
      {manager ? <Manager manager={manager} /> : pending.manager && skeleton("w-44")}
      {team && (
        <button
          type="button"
          onClick={team.onToggle}
          data-tour="ss-team"
          className={cn(
            PILL,
            "shrink-0 px-3.5 text-[0.8125rem] font-semibold",
            // Seçenek değil gidiş: ekip görünümünde beyaz hap (geri dönüş), aksi hâlde cam.
            team.active ? "bg-white text-brand-fill-deep shadow-sm ring-1 ring-white" : FROST,
          )}
        >
          <HugeiconsIcon
            icon={team.active ? ArrowLeft01Icon : UserGroupIcon}
            aria-hidden="true"
            className="size-4 rtl:rotate-180"
            strokeWidth={2}
          />
          {t(team.active ? "selfService.view.me" : "selfService.view.team")}
          {!team.active && team.count != null && (
            <span className="rounded-full bg-white/25 px-1.5 text-[0.6875rem] tabular-nums group-data-[ink=dark]/herocard:bg-black/10">
              {team.count}
            </span>
          )}
          {!team.active && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              aria-hidden="true"
              className="-me-1 size-3.5 rtl:rotate-180"
              strokeWidth={2.2}
            />
          )}
        </button>
      )}
    </div>
  )
}
