import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import UserMultiple02Icon from "@hugeicons/core-free-icons/UserMultiple02Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { FieldTile } from "@/features/selfservice/request/field/FieldTile"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePeopleSearch, useRecentPeople } from "@/hooks/useRecentPeople"
import { personLine, suggestPeople } from "@/lib/calendar/attendees"
import { EMAIL_RE } from "@/features/calendar/lib/meeting"
import { STATUS } from "@/lib/graph"
import { pluralKey } from "@/lib/intl-cache"
import { AttendeeChip } from "./AttendeeChip"
import { useSpokenAttendees } from "./useSpokenAttendees"

const lower = (s) => String(s ?? "").toLowerCase()
const NO_NAMES = []

/**
 * Katılımcı seçici: kişi çipleri (avatar, ad, taşı, kaldır) ve arama kutusu; öneriler yazıştıkların ve
 * şirket rehberi (unvanıyla), rehber okunamazsa People araması. `optional`: isteğe bağlı seçici
 * (etiketi ve çipleri ayrı), `onMove`: çipteki "öbür türe taşı" düğmesi. Kutu bir birleşik kutu (combobox):
 * ↑ ↓ ile gezilir, Enter ya da virgül ekler, Esc yalnız listeyi kapatır, boşken Geri tuşu son çipi
 * siler. Enter hiçbir zaman formu göndermez (davet geri alınamaz). Rehber ve yazıştıklar kutuya ilk
 * odakta yüklenir. `status`: adres → müsaitlik (çipin avatarında nokta), `text`: yazılan metin
 * (form gönderirken yazılı ama seçilmemiş adı yakalasın diye yukarıda tutulur). `spoken`: Anlat'ın
 * söylediği adlar (`useSpokenAttendees`): kaynaklar baştan yüklenir, tek kişiye uyanlar çip olur,
 * kalanlar kutuya yazılır ve öneri listesi açılır.
 */
export function AttendeePicker({
  id,
  optional = false,
  onMove,
  value,
  text,
  onText,
  onChange,
  status,
  invalid,
  describedBy,
  spoken = NO_NAMES,
}) {
  const { t, locale } = useLocale()
  const label = t(optional ? "calendar.meet.optionalWho" : "calendar.meet.required")
  const { accounts } = useMsal()
  const listId = useId()
  const [wanted, setWanted] = useState(spoken.length > 0)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const recent = useRecentPeople(wanted)
  const dir = useCompanyDirectory(wanted)
  const query = useDeferredValue(text.trim())
  const remote = usePeopleSearch(query, wanted && dir.status !== STATUS.ready)
  const me = accounts[0]?.username ?? ""
  const hits = useMemo(
    () =>
      suggestPeople({
        query,
        picked: value,
        me,
        recent,
        directory: dir.status === STATUS.ready ? dir.index : null,
        remote,
      }),
    [query, value, me, recent, dir.status, dir.index, remote],
  )
  const photos = usePeoplePhotos([...hits, ...value].map((p) => p.address))
  const photoOf = (p) => photos.get(lower(p.address))
  const shown = open && hits.length > 0

  useSpokenAttendees({
    spoken,
    settled: dir.status !== "loading" && dir.status !== "idle",
    sources: { me, recent, directory: dir.status === STATUS.ready ? dir.index : null },
    value,
    text,
    onChange,
    onText,
    onOpen: () => setOpen(true),
  })
  // Anlat'ın açtığı liste odak olmadan açıldı: dışarı basış kapatır (odakla açılan listeyi blur kapatır).
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false)
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [open])

  const add = (p) => {
    onChange([...value, { name: p.name || p.address, address: p.address }])
    onText("")
    setActive(0)
    setOpen(false)
  }
  const addTyped = () => {
    const typed = text.trim()
    if (EMAIL_RE.test(typed) && !value.some((p) => lower(p.address) === lower(typed))) {
      add({ name: typed, address: typed })
    }
  }
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!hits.length) return
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length)
    } else if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault()
      if (shown) add(hits[Math.min(active, hits.length - 1)])
      else addTyped()
    } else if (e.key === "Escape" && shown) {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="cal-who" ref={root}>
      <FieldTile
        as="div"
        icon={UserMultiple02Icon}
        label={label}
        labelId={`${id}-label`}
        state={invalid ? "error" : null}
        className="cal-who-tile"
        onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
      >
        <span className="cal-who-body">
          {value.map((p) => (
            <AttendeeChip
              key={p.address}
              person={p}
              optional={optional}
              state={status?.[lower(p.address)]}
              photo={photoOf(p)}
              onRemove={(x) => onChange(value.filter((y) => y !== x))}
              onMove={onMove}
            />
          ))}
          <input
            id={id}
            className="cal-meet-input cal-who-input"
            role="combobox"
            aria-expanded={shown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-labelledby={`${id}-label`}
            aria-activedescendant={shown ? `${listId}-${active}` : undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            dir="auto"
            autoComplete="off"
            value={text}
            placeholder={t(value.length ? "calendar.sharedAddMore" : "calendar.meet.peoplePh")}
            onFocus={() => {
              setWanted(true)
              if (text.trim()) setOpen(true)
            }}
            onBlur={() => {
              setOpen(false)
              addTyped()
            }}
            onChange={(e) => {
              onText(e.target.value)
              setOpen(true)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
        </span>
      </FieldTile>
      <span className="cal-sr" role="status">
        {shown
          ? t(pluralKey("calendar.page.unit.people", locale, hits.length), { n: hits.length })
          : ""}
      </span>
      {shown && (
        <ul id={listId} role="listbox" aria-label={label} className="cal-who-list">
          {hits.map((p, i) => (
            <li
              key={p.address}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="cal-who-opt"
              data-active={i === active || undefined}
              // Odak kutuda kalır: tıklama tamamlanmadan blur listeyi kapatırdı.
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => add(p)}
            >
              <PersonAvatar name={p.name} photo={photoOf(p)} className="cal-pav" />
              <span className="cal-who-txt">
                <strong>{p.name}</strong>
                <span>{personLine(p)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
