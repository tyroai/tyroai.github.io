import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import RepeatIcon from "@hugeicons/core-free-icons/RepeatIcon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonCard } from "@/components/common/PersonCard"
import { EventActions } from "@/components/common/event-detail/EventActions"
import { ResponseValue } from "@/components/common/event-detail/EventResponse"
import { allDaySpan, dayDiff, duration } from "@/components/common/event-detail/eventFormat"
import { useEventDetail } from "@/components/common/event-detail/useEventDetail"
import { dayTitle, stateText } from "@/components/common/event-detail/whenText"
import { RecordTag } from "@/components/record-window/RecordHeader"
import { RecordMeter } from "@/components/record-window/RecordHero"
import { useLocale } from "@/hooks/useLocale"
import { clock } from "../format"
import { ITEM_ICONS } from "../icons"
import { PanelPeople } from "./PanelPeople"
import "@/components/common/event-detail/eventDetail.css"

/** Etiket üstte, değer altında: panelin bütün bilgileri bu biçimde (örnekteki gibi). */
function Field({ label, children }) {
  return (
    <section className="cal-dp-field">
      <h4>{label}</h4>
      {children}
    </section>
  )
}

/** Düzenleyen katılımcı listesinde zaten "Düzenleyen" etiketiyle var mı (yinelenmesin). */
function organizerListed(people, address) {
  const org = (address || "").toLowerCase()
  return people.some(
    (a) => a.response === "organizer" || (org && (a.address || "").toLowerCase() === org),
  )
}

/** Düzenleyen (katılımcı listesinde yoksa): fotoğraf · ad · ben düzenliyorsam "(siz)"; başkasıysa kişi kartı. */
function Organizer({ event, detail, onPerson }) {
  const { t } = useLocale()
  const body = (
    <>
      <PersonAvatar
        name={event.organizer}
        photo={detail.photoOf(event.organizerAddress)}
        presence={detail.presenceOf(event.organizerAddress)}
        className="cal-dp-av"
      />
      <span data-private="" className="cal-dp-name">
        {event.organizer}
      </span>
      {detail.iOrganize && <span className="cal-dp-reply">{t("calendar.page.detail.you")}</span>}
    </>
  )
  if (detail.iOrganize) return <p className="cal-dp-person">{body}</p>
  return (
    <button
      type="button"
      className="cal-dp-person"
      title={t("person.openCard", { name: event.organizer })}
      onClick={() => onPerson({ name: event.organizer, address: event.organizerAddress })}
    >
      {body}
    </button>
  )
}

/**
 * Toplantı, odak bloğu ve seyahat — Takvim'in sağ panelinde. Bilgi toplantı kartıyla
 * (`EventDetailCard`) aynı kaynaktan (`useEventDetail`); düzen ürün sahibinin örneğinden: başta
 * simge kutusu · konu · gün, altında etiketli alanlar (zaman, konum; gündem ve bağlantı yok — ürün sahibi: "gerek yok"), ayrı bir
 * "Toplantı bilgileri" grubu (düzenleyen, yanıtınız, katılımcılar alt alta) ve dipte yapışık eylem
 * şeridi. Kişiye basınca panel o kişinin kartına geçer, geri ok toplantıya döner.
 */
export function MeetingPanel({ item }) {
  const { t, locale } = useLocale()
  const event = item.source
  const d = useEventDetail(event)
  const [who, setWho] = useState(null)

  if (who) {
    return (
      <div className="cal-dp-body">
        <PersonCard
          person={who}
          onBack={() => setWho(null)}
          backLabel={t("person.backToMeeting")}
          focusBack
        />
      </div>
    )
  }

  const { now, state } = d
  const days = event.isAllDay ? allDaySpan(event) : 1
  const offset = dayDiff(now, event.start)
  const relative = offset === 0 ? t("calendar.today") : offset === 1 ? t("calendar.tomorrow") : null
  const day = dayTitle(event, days, now, locale)
  const status = stateText(state, event, now, days, t)
  const live = state.phase === "live" && (!event.isAllDay || days > 1)
  const tone = live ? "success" : state.phase === "soon" ? "brand" : d.ended ? "neutral" : null
  const Icon = d.online ? Video01Icon : (ITEM_ICONS[item.icon] ?? Calendar03Icon)

  return (
    <>
      <div className="cal-dp-body">
        <header className="cal-d-head cal-dp-hero" data-tone={item.kind}>
          <span className="cal-d-ic">
            <HugeiconsIcon icon={Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="cal-d-titles">
            <h3 data-private="">{event.subject || t("calendar.noSubject")}</h3>
            <p>{relative ? `${relative} · ${day}` : day}</p>
          </div>
        </header>
        {(d.online || event.seriesMasterId) && (
          <div className="cal-dp-tags">
            {d.online && (
              <RecordTag icon={Video01Icon} tone="brand">
                {t("calendar.teamsMeeting")}
              </RecordTag>
            )}
            {event.seriesMasterId && (
              <RecordTag icon={RepeatIcon} plain>
                {t("calendar.detail.recurring")}
              </RecordTag>
            )}
          </div>
        )}

        <Field label={t("calendar.page.detail.when")}>
          <p className="cal-dp-value">
            {event.isAllDay ? (
              days > 1 ? (
                t("calendar.durationDays", { days })
              ) : (
                t("calendar.allDay")
              )
            ) : (
              <>
                {/* Arapça rakamlar yalıtımda da ters dizilir: aralık yazıldığı sırada okunsun. */}
                <bdo dir="ltr">{`${clock(event.start, locale)} – ${clock(event.end, locale)}`}</bdo>
                <span className="cal-dp-soft"> · {duration(event, t)}</span>
              </>
            )}
          </p>
          {status && (
            <p className="cal-dp-state" data-tone={tone ?? undefined}>
              {status}
            </p>
          )}
          {live && <RecordMeter done={state.elapsed} />}
        </Field>
        {d.place && (
          <Field label={t("calendar.detail.location")}>
            <p data-private="" className="cal-dp-value">
              {d.place}
            </p>
          </Field>
        )}
        {event.owner?.name && (
          <Field label={t("calendar.detail.calendar")}>
            <p data-private="" className="cal-dp-value">
              {t("calendar.sharedOwner", { name: event.owner.name })}
            </p>
          </Field>
        )}

        <div className="cal-dp-group">
          <h3 className="cal-dp-group-title">{t("calendar.page.detail.info")}</h3>
          {event.organizer && !organizerListed(d.people, event.organizerAddress) && (
            <Field label={t("calendar.att.organizer")}>
              <Organizer event={event} detail={d} onPerson={setWho} />
            </Field>
          )}
          {!d.iOrganize && (
            <Field label={t("calendar.detail.response")}>
              <div className="cal-dp-value">
                <ResponseValue event={event} detail={d} />
              </div>
            </Field>
          )}
          {d.people.length > 0 && (
            <Field label={t("calendar.attendees", { count: d.people.length })}>
              <PanelPeople
                people={d.people}
                organizerAddress={event.organizerAddress}
                photoOf={d.photoOf}
                presenceOf={d.presenceOf}
                onPerson={setWho}
              />
            </Field>
          )}
        </div>
      </div>
      {/* Eylemler dipte yapışık: uzun ayrıntıda da kaydırmadan erişilir. Boşsa çizilmez. */}
      <div className="cal-dp-foot">
        <EventActions
          event={event}
          soon={d.soon}
          ended={d.ended}
          iOrganize={d.iOrganize}
          onPrepare={d.prepare}
        />
      </div>
    </>
  )
}
