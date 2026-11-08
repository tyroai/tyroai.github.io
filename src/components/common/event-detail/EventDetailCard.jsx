import { useRef, useState } from "react"
import RepeatIcon from "@hugeicons/core-free-icons/RepeatIcon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { RecordPaper } from "@/components/record-window/RecordFrame"
import { RecordHeader, RecordOwner, RecordTag } from "@/components/record-window/RecordHeader"
import { RecordInfoList } from "@/components/record-window/RecordInfoList"
import { PersonCard } from "@/components/common/PersonCard"
import { useLocale } from "@/hooks/useLocale"
import { EventActions } from "./EventActions"
import { EventAttendees } from "./EventAttendees"
import { ResponseValue } from "./EventResponse"
import { EventWhen } from "./EventWhen"
import { useEventDetail } from "./useEventDetail"
import "./eventDetail.css"

/**
 * Toplantının ayrıntısı, kayıt penceresi diliyle (`components/record-window`, çerçevesiz kâğıt).
 * TEK sol kenar, yukarıdan aşağı: başlık (konu, Teams · yinelenen etiketleri, düzenleyen), NE
 * ZAMAN kartı (saat aralığı, süre, sürüyor/başlamasına/bitti), etiket | değer listesi (yanıtınız,
 * konum, takvim, gündem, katılımcılar) ve en altta TEK eylem alanı (`ev-bar`): sakin düğmeler ve
 * en sonda tek birincil. Yanıt durumu listedeki "Yanıtınız" satırında; yanıt bekleyen davette
 * satır geniş, Kabul et · Belki · Reddet durumun hemen altında.
 *
 * Header takvimi, Takvim sayfası, çentik, Anasayfa'nın sıradaki toplantısı ve özetin davetleri
 * AYNI kartı açar — ikinci bir önizleme zamanla bundan ayrışırdı. Metinler kırpılmaz
 * (kısaltılmış satırın tam hâlini göstermek kartın işi). `live`: çağıran "şimdi/15 dk kala"
 * dediyse Katıl öne çıkar (kart dakikada bir kendisi de bakar).
 *
 * `onAnswered`: davete yanıt gittikten sonra (ör. pencereyi kapatmak için).
 */
export function EventDetailCard({ event, live, onAnswered }) {
  const { t } = useLocale()
  const d = useEventDetail(event, { live, onAnswered })
  const { now, state, ended, soon, online, people, iOrganize, agenda, place, photoOf, presenceOf } =
    d
  const organizerPresence = presenceOf(event.organizerAddress)

  // Kişiye basınca kart O KİŞİYE geçer (geri ok toplantıya döner): fareyle
  // açılan kartın içinden ikinci bir kart açmak ikisini birden kapatırdı.
  // Geçişte kart kısalmaz — imleç kartın dışında kalıp önizlemeyi kapatmasın.
  const [who, setWhoState] = useState(null)
  const rootRef = useRef(null)
  const [minH, setMinH] = useState(0)
  const setWho = (next) => {
    const h = rootRef.current?.offsetHeight ?? 0
    setMinH((m) => Math.max(m, h))
    setWhoState(next)
  }

  if (who) {
    return (
      <div ref={rootRef} style={minH ? { minHeight: minH } : undefined}>
        <PersonCard
          person={who}
          onBack={() => setWho(null)}
          backLabel={t("person.backToMeeting")}
          focusBack
        />
      </div>
    )
  }

  const tags = [
    online && (
      <RecordTag key="online" icon={Video01Icon} tone="brand">
        {t("calendar.teamsMeeting")}
      </RecordTag>
    ),
    event.seriesMasterId && (
      <RecordTag key="series" icon={RepeatIcon} plain>
        {t("calendar.detail.recurring")}
      </RecordTag>
    ),
  ].filter(Boolean)

  const rows = [
    !iOrganize && {
      key: "response",
      label: t("calendar.detail.response"),
      // Yanıtlanabilir davette satır geniş: durumun hemen altında Kabul et · Belki · Reddet (alt
      // şeritte yalnız eylemler kalır — ürün sahibi: "alt kısımda dünya kadar buton oluyor").
      wide: d.canAnswer || undefined,
      value: <ResponseValue event={event} detail={d} />,
    },
    // Teams'in kendi konum yazısı başlıktaki etiketi tekrar etmesin (`meetingPlace`).
    place && {
      key: "location",
      label: t("calendar.detail.location"),
      value: place,
      // Uzun adres (bina, kat, oda) sağa yaslı dar sütunda okunmaz: etiketin altına iner.
      wide: place.length > 36,
    },
    event.owner?.name && {
      key: "calendar",
      label: t("calendar.detail.calendar"),
      value: t("calendar.sharedOwner", { name: event.owner.name }),
    },
    agenda && {
      key: "agenda",
      label: t("calendar.detail.agenda"),
      wide: true,
      // Kırpma yerine kaydırma: gündemin devamı da okunabilsin.
      // Kendi içinde kayan alan klavyeyle de kayabilsin: odaklanabilir bölge (axe).
      value: (
        <span
          className="ev-agenda"
          tabIndex={0}
          role="region"
          aria-label={t("calendar.detail.agenda")}
        >
          {agenda}
        </span>
      ),
    },
    // Katılımcılar da listenin satırı: başlığı öteki etiketlerle aynı biçimde, aynı çizgiyle.
    people.length > 0 && {
      key: "people",
      label: t("calendar.attendees", { count: people.length }),
      wide: true,
      value: (
        <EventAttendees
          people={people}
          organizerAddress={event.organizerAddress}
          photoOf={photoOf}
          presenceOf={presenceOf}
          onPerson={setWho}
        />
      ),
    },
  ].filter(Boolean)

  return (
    <div ref={rootRef} style={minH ? { minHeight: minH } : undefined}>
      <RecordPaper className="ev-sheet">
        {/* Simge kutusu yok: konu, etiketler ve düzenleyen kartın geri kalanıyla aynı kenarda. */}
        <RecordHeader
          title={event.subject || t("calendar.noSubject")}
          titleAs="h2"
          tags={tags.length ? tags : null}
          personal
        >
          <RecordOwner
            name={event.organizer}
            photo={photoOf(event.organizerAddress)}
            presence={organizerPresence}
            presenceLabel={
              organizerPresence ? t(`calendar.presence.${organizerPresence}`) : undefined
            }
            role={t(iOrganize ? "calendar.detail.organizerYou" : "calendar.att.organizer")}
            // Düzenleyen bensem düğme değil: kendi kartıma geçmenin anlamı yok.
            onOpen={
              iOrganize
                ? undefined
                : () => setWho({ name: event.organizer, address: event.organizerAddress })
            }
            openTitle={t("person.openCard", { name: event.organizer })}
            className="ev-owner"
          />
        </RecordHeader>

        <EventWhen event={event} state={state} now={now} />

        <RecordInfoList rows={rows} personal />

        {/* Tek eylem alanı, kartın dibinde yapışık: uzun kartta da kaydırmadan erişilir.
            İçi boşsa (`:empty`) hiç görünmez. */}
        <div className="ev-bar">
          <EventActions
            event={event}
            soon={soon}
            ended={ended}
            iOrganize={iOrganize}
            onPrepare={d.prepare}
          />
        </div>
      </RecordPaper>
    </div>
  )
}
