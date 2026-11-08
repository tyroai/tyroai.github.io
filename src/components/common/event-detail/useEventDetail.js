import { useState } from "react"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useOneOnOnePrep } from "@/hooks/useOneOnOnePrep"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePresence } from "@/hooks/usePresence"
import { useRsvp } from "@/hooks/useRsvp"
import { RSVP_RESULT } from "@/lib/calendarInvites"
import { uniqueAttendees } from "@/lib/calendarPeople"
import { agendaText, meetingPlace } from "./eventFormat"
import { meetingState } from "./meetingState"
import { prepareMeeting } from "./prepareMeeting"

/**
 * Toplantı ayrıntısının verisi ve kuralları — kart (`EventDetailCard`: header, Anasayfa, çentik)
 * ve Takvim'in sağ paneli aynı şeyi söylesin: saat durumu (dakikada bir), katılımcılar, fotoğraf
 * ve Teams durumu, yanıtım, asistanla hazırlık. `live`: çağıran "şimdi/15 dk kala" dediyse Katıl
 * öne çıkar. `onAnswered`: davete yanıt gittikten sonra.
 */
export function useEventDetail(event, { live, onAnswered } = {}) {
  const now = useMinuteNow()
  const state = meetingState(event.start, event.end, now.getTime())
  const ended = state.phase === "ended"
  const online = event.isOnlineMeeting
  const people = uniqueAttendees(event)
  const iOrganize = event.myResponse === "organizer"

  const photos = usePeoplePhotos([
    event.organizerAddress,
    ...people.slice(0, 12).map((a) => a.address),
  ])
  const photoOf = (address) => photos.get((address || "").toLowerCase())
  const presence = usePresence([...people.map((a) => a.address), event.organizerAddress])
  const presenceOf = (address) => presence.get((address || "").toLowerCase())

  // Yanıtım: gönderilince hemen değişir (takvim arkada yeniden okunur). Etkinlik değişirse eski
  // yanıt taşınmasın diye kimliğiyle tutulur.
  const { busy, answer } = useRsvp()
  const [mine, setMine] = useState(null)
  const response = (mine?.id === event.id ? mine.value : null) ?? event.myResponse
  const open = !iOrganize && !event.isCancelled && !ended
  // Başkasının takvimindeki etkinliğe buradan yanıt verilemez — Outlook bağlantısı kalır.
  const canAnswer = open && !event.owner && response === "notResponded"
  async function onAnswer(action) {
    if (!(await answer(event, action))) return
    setMine({ id: event.id, value: RSVP_RESULT[action] })
    onAnswered?.()
  }

  const prep = useOneOnOnePrep(prepareMeeting)
  return {
    now,
    state,
    ended,
    soon: Boolean(live) || state.phase === "live" || state.phase === "soon",
    online,
    people,
    iOrganize,
    agenda: agendaText(event.bodyPreview),
    // Teams'in kendi konum yazısı başlıktaki etiketi tekrar etmesin.
    place: meetingPlace(event.location, online),
    photoOf,
    presenceOf,
    response,
    needsAnswer: open && (response === "none" || response === "notResponded"),
    canAnswer,
    pending: busy[event.id],
    onAnswer,
    prepare: () => prep.run(event),
  }
}
