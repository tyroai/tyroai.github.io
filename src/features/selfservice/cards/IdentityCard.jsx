import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePresence } from "@/hooks/usePresence"
import { metaOf } from "@/lib/selfServiceProfile"
import { CopyNumber } from "../detail/CopyNumber"
import { AvatarCard } from "../header/ProfileHeader"
import { tenureText } from "../header/profileText"
import { day } from "../kinds"
import { peopleText } from "../team/teamText"
import "./identityCard.css"

// Ofis kartta yok: kişinin kendi ofisini görmesi bilgi değil (standart kartla aynı karar).
const OMIT = ["office"]
const ORG = ["department", "company", "employeeType"]

/**
 * Kartlar düzeninin kimlik bölümü (üst kartın sol yarısı; sağında TYRO anlatıyor) — iki kat:
 * üstte fotoğraf (basınca kişi kartı), ad ve yanında "#sicil" (kopyalanabilir), altında unvan,
 * sonra departman · şirket · çalışan tipi tek satır; altta üç karo (hizmet süresi ve işe giriş ·
 * yönetici, basınca kişi kartı · ekip, basınca Ekibim). Hepsi kayıtta bulunan bilgiler;
 * bilinmeyen çizilmez, beklenirken yer tutulur.
 * `team`: sayfanın ekip geçişi `{ count, onToggle }` (ekibi olmayanlarda yok).
 */
export function IdentityCard({ profile, team }) {
  const { t, locale } = useLocale()
  const titleId = useId()
  const loading = profile?.status === "loading"
  const address = profile?.address ?? ""
  const upn = profile?.upn || address
  const manager = profile?.manager ?? null
  const photos = usePeoplePhotos([!profile?.photo && address, manager?.address].filter(Boolean))
  const photo = profile?.photo ?? photos.get(address) ?? null
  const presence = usePresence(upn ? [upn] : []).get(upn)
  const { title, chips } = metaOf(profile, { omit: OMIT })
  const tenure = profile?.hireDate ? tenureText(profile.hireDate, t, locale) : null
  const pending = profile?.pending ?? {}
  // Başlığın üçüncü satırı: departman · şirket · çalışan tipi (kayıtta olanlar, bu sırayla).
  const org = ORG.map((key) => chips.find((c) => c.key === key))
    .filter(Boolean)
    .map((c) => c.full ?? c.value)

  return (
    <section aria-labelledby={titleId} className="ssc-card ssc-id">
      <div className="ssc-id-head">
        <AvatarCard profile={profile} address={upn}>
          <PersonAvatar
            name={profile?.name ?? ""}
            photo={photo}
            presence={presence}
            presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
            className="ssc-id-avatar rounded-full"
          />
        </AvatarCard>
        <div className="ssc-id-name">
          {/* Ad ve sicil yan yana (#): altta unvan, sonra departman · şirket — kart alçalır. */}
          <div className="ssc-id-line">
            <h2 id={titleId} lang="tr" title={profile?.name}>
              {profile?.name}
            </h2>
            {profile?.personnel && (
              <span data-private="" className="ssc-id-no">
                <span className="sr-only">{t("selfService.profile.personnel")} </span>
                <CopyNumber value={String(profile.personnel)} />
              </span>
            )}
          </div>
          {loading ? (
            <span aria-hidden="true" className="ms-skeleton ssc-skel-line" />
          ) : (
            title && (
              <p lang="tr" title={title}>
                {title}
              </p>
            )
          )}
          {org.length > 0 && (
            <p lang="tr" className="ssc-id-org" title={org.join(" · ")}>
              {org.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="ssc-id-tiles">
        {tenure ? (
          <div className="ssc-id-tile">
            <span className="ssc-eyebrow">{t("selfService.profile.tenure")}</span>
            <b>{tenure}</b>
            {/* Dar karoda yalnız tarih; "İşe giriş" ipucunda ve okuyucuda. */}
            <small title={t("selfService.profile.hired", { date: day(profile.hireDate, locale) })}>
              <span className="sr-only">
                {t("selfService.profile.hired", { date: day(profile.hireDate, locale) })}
              </span>
              <span aria-hidden="true">{day(profile.hireDate, locale)}</span>
            </small>
          </div>
        ) : (
          pending.hireDate && <span aria-hidden="true" className="ms-skeleton ssc-id-tile" />
        )}
        {manager ? (
          <PersonPopover
            person={{ name: manager.name, address: manager.address, title: manager.title }}
            align="start"
          >
            {(trigger) => (
              <button
                {...trigger}
                aria-label={t("selfService.profile.openCard", { name: manager.name })}
                className="ssc-id-tile ssc-id-tile--wide"
              >
                <span className="ssc-eyebrow">{t("selfService.profile.managerShort")}</span>
                <span className="ssc-id-person">
                  <PersonAvatar
                    name={manager.name}
                    photo={photos.get(manager.address)}
                    className="ssc-id-mini rounded-full"
                  />
                  <b lang="tr" title={manager.name}>
                    {manager.name}
                  </b>
                </span>
                {manager.title && <small lang="tr">{manager.title}</small>}
              </button>
            )}
          </PersonPopover>
        ) : (
          pending.manager && (
            <span aria-hidden="true" className="ms-skeleton ssc-id-tile ssc-id-tile--wide" />
          )
        )}
        {team && (
          <button type="button" onClick={team.onToggle} className="ssc-id-tile ssc-id-tile--slim">
            <span className="ssc-eyebrow">{t("selfService.view.team")}</span>
            {team.count != null ? (
              <b>{peopleText(team.count, t, locale)}</b>
            ) : (
              <span aria-hidden="true" className="ms-skeleton ssc-skel-line" />
            )}
            <small className="ssc-id-go">
              {t("selfService.cards.seeTeam")}
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
            </small>
          </button>
        )}
      </div>
    </section>
  )
}
