import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { teamsChat } from "@/lib/celebrate"
import { whenText } from "./format"

/**
 * Paylaşılan takvimdeki kayıt: kişi (rengiyle), kayıt, zaman ve konum; "Özel" kayıtta yalnız zaman.
 * Yanıt düğmeleri ve toplantı kartı YOK: kayıt başkasının takviminde, yanıt verilemez. Eylem: Teams'te
 * mesaj. `item.source`: etkinlik (`owner` kişisi).
 */
export function SharedDetail({ item }) {
  const { locale, t } = useLocale()
  const { owner, location } = item.source
  const photos = usePeoplePhotos([owner.address])
  return (
    <div className="cal-d">
      <header className="cal-d-head cal-d-person" data-tone="shared" style={{ "--hue": item.hue }}>
        <PersonAvatar
          name={owner.name}
          photo={photos.get(String(owner.address ?? "").toLowerCase())}
          className="cal-avatar"
        />
        <div className="cal-d-titles">
          <h3>{item.what}</h3>
          <p>{t("calendar.sharedOwner", { name: owner.name })}</p>
        </div>
      </header>
      <p className="cal-d-row">
        <HugeiconsIcon icon={Clock01Icon} className="cal-ic" strokeWidth={1.8} aria-hidden="true" />
        <span>{whenText(item, locale, t)}</span>
      </p>
      {location && (
        <p className="cal-d-row">
          <HugeiconsIcon
            icon={Location01Icon}
            className="cal-ic"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span>{location}</span>
        </p>
      )}
      <div className="cal-d-actions">
        <a
          className="cal-act"
          href={teamsChat(owner.address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("calendar.page.team.chat")}
        </a>
      </div>
    </div>
  )
}
