import { useCallback, useId, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { calendarChanged } from "@/hooks/useCalendarEvents"
import { useLocale } from "@/hooks/useLocale"
import {
  endAfter,
  initialMeeting,
  meetingErrors,
  meetingPayload,
  minutesBetween,
  shiftEnd,
  transactionId,
  wallTime,
} from "@/features/calendar/lib/meeting"
import { createMeeting } from "@/features/calendar/lib/meetingApi"
import { STATUS, browserTimeZone } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { clock, dayMonth } from "../format"

// Pencere açılışına özgü kısa iz: aynı içerikle yeniden denemede aynı işlem kimliği (`transactionId`).
const newSeed = () => Math.random().toString(36).slice(2, 10)
const NO_NAMES = []

/**
 * Yeni toplantı formunun durumu ve gönderimi. `target`: `{ day, minute }` (tıklanan gün ve saat),
 * `onDone`: oluşturulunca. `target.initial` (takvim Anlat'ı): formun önceden dolu alanları (`title`,
 * `date`, `from`, `to`, `teams`, `where`; yoksa varsayılanlar) ve `who`, söylenen katılımcı adları
 * (`spoken`: seçici onları eşler). Gönderim Graph'a yazar; başarıda takvimler tazelenir (`calendarChanged`:
 * header, çentik ve sayfa), bildirim çıkar. Başarısızlıkta form olduğu gibi kalır, nedeni
 * `failure`da (`denied` izin yok · `failed` diğer). Zorunlu alanlar ancak ilk denemeden sonra
 * kırmızı yanar (`attempted`); ilk geçersiz alana odak gider. `v.people`: zorunlu ve isteğe bağlı
 * katılımcılar tek dizide (isteğe bağlıda `optional: true`, `features/calendar/lib/attendeeKinds`);
 * `v.draft` zorunlu, `v.draftOptional` isteğe bağlı kutusunun yazısı.
 */
export function useMeetingForm({ target, onDone }) {
  const { t, locale } = useLocale()
  const { instance, accounts } = useMsal()
  const idBase = useId().replace(/:/g, "")
  const [seed] = useState(newSeed)
  const [v, setV] = useState(() => initialMeeting(target))
  const [attempted, setAttempted] = useState(false)
  // Yazılı ama seçilmemiş ad: uyarı yalnız gönderme denemesinde, kişi yazmaya dönünce kalkar.
  const [asked, setAsked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const errors = useMemo(() => meetingErrors(v), [v])

  const change = useCallback((fn) => {
    setV(fn)
    setFailure(null)
  }, [])
  const set = useCallback(
    (patch) => {
      change((cur) => ({ ...cur, ...patch }))
      if ("draft" in patch || "draftOptional" in patch) setAsked(false)
    },
    [change],
  )
  // Başlangıç kayınca bitiş süreyi korur; süre çipleri bitişi başlangıçtan sonraya koyar.
  const setFrom = useCallback(
    (from) => change((cur) => ({ ...cur, from, to: shiftEnd(cur.from, cur.to, from) })),
    [change],
  )
  const setLength = useCallback(
    (minutes) => change((cur) => ({ ...cur, to: endAfter(cur.from, minutes) })),
    [change],
  )

  async function submit(e) {
    e?.preventDefault()
    if (busy) return
    setAttempted(true)
    const unpicked = errors.draft || errors.draftOptional
    if (errors.title || errors.time || unpicked) {
      setAsked(Boolean(unpicked))
      const first = errors.title ? "title" : errors.time ? "to" : errors.draft ? "who" : "who-opt"
      requestAnimationFrame(() => document.getElementById(`${idBase}-${first}`)?.focus())
      return
    }
    setBusy(true)
    setFailure(null)
    const body = meetingPayload(v, browserTimeZone(), transactionId(seed, v))
    const res = await createMeeting(instance, accounts[0], body)
    if (res.status === STATUS.ready) {
      calendarChanged()
      const start = wallTime(v.date, v.from)
      const end = wallTime(v.date, v.to)
      notify.success(t("calendar.meet.done"), {
        description: `${dayMonth(start, locale)} · ${clock(start, locale)} – ${clock(end, locale)}`,
      })
      onDone()
      return
    }
    setBusy(false)
    setFailure({
      kind: res.status === STATUS.denied ? "denied" : "failed",
      detail: String(res.error ?? "").slice(0, 160),
    })
  }

  const dirty = Boolean(
    v.title.trim() ||
    v.people.length ||
    v.draft.trim() ||
    v.draftOptional?.trim() ||
    v.where.trim() ||
    v.note.trim(),
  )
  const minutes = minutesBetween(v.from, v.to)
  return {
    v,
    set,
    setFrom,
    setLength,
    errors,
    attempted,
    draftOptionalError: asked && Boolean(errors.draftOptional),
    draftError: asked && Boolean(errors.draft),
    spoken: target.initial?.who ?? NO_NAMES,
    busy,
    failure,
    dirty,
    minutes,
    submit,
    idBase,
    me: accounts[0]?.username ?? "",
  }
}
