import { lazy, Suspense, useState } from "react"
import { loadMeeting } from "./meetingLoader"

const MeetingDialog = lazy(() => loadMeeting().then((m) => ({ default: m.MeetingDialog })))

/**
 * Yeni toplantı penceresi ayrı parçada (form, katılımcı seçici, müsaitlik): takvim onsuz açılır.
 * İlk açılıştan sonra hep çizilir (kapanış animasyonu). `target`: `{ day, minute, seq, initial? }` ya da null.
 */
export function LazyMeetingDialog({ target, onClose }) {
  const [used, setUsed] = useState(Boolean(target))
  if (target && !used) setUsed(true)
  if (!used) return null
  return (
    <Suspense fallback={null}>
      <MeetingDialog target={target} onClose={onClose} />
    </Suspense>
  )
}
