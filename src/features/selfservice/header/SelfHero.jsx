import { useId } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useHeroInk } from "@/hooks/useGradientInk"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePresence } from "@/hooks/usePresence"
import { HERO_INK, HERO_SHADE } from "@/lib/gradientInk"
import { metaOf } from "@/lib/selfServiceProfile"
import { cn } from "@/lib/utils"
import { HeroPeople } from "./HeroPeople"
import { HeroStatsBar } from "./HeroStatsBar"
import { HERO, SOFT_INK, TRAY } from "./heroStyles"
import { MetaChips } from "./MetaChips"
import { usePhone } from "../layout/phone"
import { useIsMobile } from "@/hooks/use-mobile"
import { AvatarCard } from "./ProfileHeader"
import "./selfHero.css"

// Ofis (konum) kartta yok: kişinin kendi ofisini kartta görmesi bilgi değil (ürün sahibi).
const OMIT = ["office"]
const PHONE_OMIT = ["office", "department"]

/**
 * SELF SERVİS'İN KARTI — To-Do'nun karşılama kartının dili: marka gradyanı, altına markanın
 * renginde yumuşak gölge, solda kişi (avatar · ad · unvan · bilgiler · hizmet süresi · bağlı
 * olunan kişi ve yanında Ekibim); yanda beyaz tepside dönem ve özet (`tray`; Bilgilerim ile
 * Ekibim'de aynı kart, aynı boy). Yeni talep kartta değil, sekme şeridinin sağındaki "Yeni"
 * düğmesinde (`NewRequestWand`). Mürekkep gradyandan ölçülür (`useGradientInk`), tepsi düz kart:
 * yazı her palette iki temada okunur.
 *
 * Boy To-Do'nun kartıyla aynı ve sabit (`selfHero.css`); düzen kabın eninden (`band`,
 * `layout/phone.js`): `wide` tepsi yanda, kişi hapları; `mid` tepsi yanda, bilgiler iki sütun ve
 * kişi bilgileri cam şeritte (`HeroStatsBar`); `narrow` ve `short` kart yalnız kişi (tepsi kartın
 * altında), `short` geniş kapta tek sıra. İçerik tek satırlara iner, uzun değerin tamamı ipucunda.
 */
export function SelfHero({ profile, team, tray, people, showMeta = true, band = "wide" }) {
  const { t } = useLocale()
  // Geniş kartta kişi hapları ve yan yana bilgiler; daha darında iki sütun bilgi ve kişi şeridi.
  const compact = band !== "wide"
  const { ink, shade } = useHeroInk()
  const titleId = useId()
  const loading = profile?.status === "loading"
  const address = profile?.address ?? ""
  const upn = profile?.upn || address
  const photos = usePeoplePhotos(profile?.photo || !address ? [] : [address])
  const photo = profile?.photo ?? photos.get(address) ?? null
  const presence = usePresence(upn ? [upn] : []).get(upn)
  // Telefonda bir satır kazanılır: sicil adın yanında, şirketin dört harfli kodu unvanın önünde
  // (tam ad ipucunda), departman çipi yok.
  const phone = usePhone()
  // Boy içerikten yalnız gerçek telefonda: dokunmatik tablette telefon düzeni olsa da kart
  // To-Do'nunkiyle eşit kalır (`heroParity`).
  const handset = useIsMobile()
  const meta = metaOf(profile, { omit: phone ? PHONE_OMIT : OMIT, companyCode: phone })
  const { title } = meta
  // `showMeta={false}`: şirket ve departman yazılmaz (Ticket: o sayfada bilgi değil).
  const company = showMeta && phone ? meta.chips.find((c) => c.key === "company") : null
  const chips = company ? meta.chips.filter((c) => c !== company) : meta.chips
  const companyCode = company && (
    <span title={company.full ?? company.value}>
      <span className="sr-only">{t("selfService.profile.company")}: </span>
      <span aria-hidden={company.full ? "true" : undefined}>{company.value}</span>
      {company.full && <span className="sr-only">{company.full}</span>}
    </span>
  )
  const personnel = profile?.personnel && (
    <span className={cn("shrink-0 text-[0.8125rem] tabular-nums", SOFT_INK)}>
      <span className="sr-only">{t("selfService.profile.personnel")} </span>#{profile.personnel}
    </span>
  )
  // Unvan satırının başı: telefonda şirket kodu, öteki dar kartta sicil.
  const lead = phone ? companyCode : compact && personnel

  return (
    <section
      aria-labelledby={titleId}
      data-ink={ink}
      data-shade={shade ?? undefined}
      style={{ "--hero-ink": HERO_INK[ink] }}
      data-band={band}
      data-phone={(phone && handset) || undefined}
      className={cn(HERO, "ss-hero")}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-from via-brand-via to-brand-to"
      />
      <div data-tray={tray ? "" : undefined} className="ss-hero-grid grid min-w-0 gap-4">
        {/* Örtü yalnız mürekkebin okunamadığı paletlerde (`HERO_SHADE`, To-Do'nun kartıyla aynı). */}
        <div
          className={cn("ss-hero-main flex min-w-0 flex-col gap-4 p-1 @[40rem]/ss:p-2", HERO_SHADE)}
        >
          <div className="ss-hero-id grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5">
            <AvatarCard profile={profile} address={upn}>
              <PersonAvatar
                name={profile?.name ?? ""}
                photo={photo}
                presence={presence}
                presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
                className="ss-hero-avatar size-12 rounded-full ring-2 ring-white/50 [&>span:first-of-type]:text-[1.0625rem] @[40rem]/ss:size-16"
              />
            </AvatarCard>
            <div className="min-w-0">
              {/* Ad tek satır (tamamı ipucunda): kartın boyu sabit, sicil adın yanında kalır. */}
              <div className="flex min-w-0 items-baseline gap-x-2">
                <h2
                  id={titleId}
                  lang="tr"
                  title={profile?.name}
                  className="ss-hero-name min-w-0 truncate text-[1.25rem] font-semibold leading-tight tracking-[-0.02em] @[40rem]/ss:text-[1.625rem]"
                >
                  {profile?.name}
                </h2>
                {(!compact || phone) && personnel}
              </div>
              {loading ? (
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-3.5 w-48 rounded-full bg-white/25"
                />
              ) : (
                (title || lead) && (
                  <p
                    lang="tr"
                    title={title || undefined}
                    className="mt-0.5 truncate text-[0.875rem] font-medium"
                  >
                    {/* Dar kartta sicil (telefonda şirket kodu) unvanın önünde, kesilmez. */}
                    {lead}
                    {lead && title && <span aria-hidden="true"> · </span>}
                    {title}
                  </p>
                )
              )}
            </div>
          </div>
          {showMeta && <MetaChips chips={chips} onHero grid={compact} className="ss-hero-chips" />}
          {/* Dar kartta kişi bilgileri tek cam şeritte eşit hücreler; genişte yan yana haplar.
              `people`: sayfanın kendi şeridi (Ticket: Xurrent ekiplerin). */}
          {people ??
            (compact ? (
              <HeroStatsBar profile={profile} team={team} />
            ) : (
              <HeroPeople profile={profile} team={team} />
            ))}
        </div>
        {tray && (
          <div data-tour="ss-summary" className={cn(TRAY, "ss-hero-tray")}>
            {tray}
          </div>
        )}
      </div>
    </section>
  )
}
