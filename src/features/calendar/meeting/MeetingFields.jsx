import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { FieldTile } from "@/features/selfservice/request/field/FieldTile"
import { fieldState } from "@/features/selfservice/request/field/fieldState"
import { useLocale } from "@/hooks/useLocale"
import { DEFAULT_MINUTES, DURATIONS, endAfter, toClock } from "@/features/calendar/lib/meeting"
import { dayKey, minuteOf } from "@/features/calendar/lib/range"
import { Attendees } from "./Attendees"
import { useAvailability } from "./useAvailability"

/** Hata satırı: alanın altında, kısa; `id` alanın `aria-describedby`ı, görününce okunur. */
function FieldError({ id, children }) {
  return (
    <p id={id} className="cal-meet-err" role="alert">
      {children}
    </p>
  )
}

/**
 * Yeni toplantı formunun alanları (Self Servis'in alan karoları): konu · tarih ve saatler (+ süre
 * çipleri) · katılımcılar (zorunlu ve isteğe bağlı, + müsaitlik: `Attendees`) · Teams · konum · not.
 * Tarih ve saat tarayıcının kendi denetimi (klavye ve telefon seçicisi hazır). Alt şerit
 * (`MeetingFoot`) ve başlık pencerede.
 */
export function MeetingFields({ form }) {
  const { t } = useLocale()
  const { v, set, setFrom, setLength, errors, attempted, idBase, minutes, me } = form
  const avail = useAvailability(v, me)
  const titleError = attempted && Boolean(errors.title)
  const timeError = attempted && Boolean(errors.time)
  // Önerilen ilk ortak boşluk: gün ve saat oraya kayar, süre aynı kalır.
  const apply = (ms) => {
    const at = new Date(ms)
    const from = toClock(minuteOf(at))
    set({ date: dayKey(at), from, to: endAfter(from, minutes ?? DEFAULT_MINUTES) })
  }
  return (
    <div className="cal-meet-fields">
      <div>
        <FieldTile
          as="label"
          icon={Edit02Icon}
          label={t("calendar.meet.subject")}
          state={fieldState({ filled: Boolean(v.title.trim()), required: true, error: titleError })}
        >
          <input
            id={`${idBase}-title`}
            className="cal-meet-input"
            dir="auto"
            value={v.title}
            maxLength={255}
            autoComplete="off"
            placeholder={t("calendar.meet.subjectPh")}
            aria-required="true"
            aria-invalid={titleError || undefined}
            aria-describedby={titleError ? `${idBase}-title-err` : undefined}
            onChange={(e) => set({ title: e.target.value })}
          />
        </FieldTile>
        {titleError && (
          <FieldError id={`${idBase}-title-err`}>{t("calendar.meet.errTitle")}</FieldError>
        )}
      </div>

      <div className="cal-meet-when">
        <FieldTile as="label" icon={Calendar03Icon} label={t("calendar.meet.date")}>
          <input
            type="date"
            className="cal-meet-input"
            dir="ltr"
            value={v.date}
            // Boş değer (alan silindi) yok sayılır: geçerli bir gün hep kalır.
            onChange={(e) => e.target.value && set({ date: e.target.value })}
          />
        </FieldTile>
        {/* İki saat tek karoda: tarayıcının saat denetimi (12 saatlikte "PM" dahil) yan yana sığar. */}
        <FieldTile
          as="div"
          icon={Clock01Icon}
          label={`${t("calendar.meet.start")} – ${t("calendar.meet.end")}`}
          state={timeError ? "error" : null}
          onClick={(e) =>
            e.target === e.currentTarget && e.currentTarget.querySelector("input")?.focus()
          }
        >
          <span className="cal-meet-range" dir="ltr">
            <input
              type="time"
              className="cal-meet-input"
              aria-label={t("calendar.meet.start")}
              value={v.from}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
            />
            <span aria-hidden="true">–</span>
            <input
              id={`${idBase}-to`}
              type="time"
              className="cal-meet-input"
              aria-label={t("calendar.meet.end")}
              value={v.to}
              aria-invalid={timeError || undefined}
              aria-describedby={timeError ? `${idBase}-time-err` : undefined}
              onChange={(e) => e.target.value && set({ to: e.target.value })}
            />
          </span>
        </FieldTile>
      </div>
      {timeError && <FieldError id={`${idBase}-time-err`}>{t("calendar.meet.errTime")}</FieldError>}
      <div className="cal-meet-lens" role="group" aria-label={t("calendar.meet.length")}>
        {DURATIONS.map((n) => (
          <button
            key={n}
            type="button"
            className="cal-meet-chip"
            aria-pressed={minutes === n}
            onClick={() => setLength(n)}
          >
            {t("calendar.meet.min", { n })}
          </button>
        ))}
      </div>

      <Attendees form={form} avail={avail} onApply={apply} />

      <FieldTile
        icon={Video01Icon}
        label={t("calendar.teamsMeeting")}
        value={t(v.teams ? "calendar.meet.teamsOn" : "calendar.meet.teamsOff")}
        role="switch"
        aria-checked={v.teams}
        onClick={() => set({ teams: !v.teams })}
        trailing={<span className="cal-switch" data-on={v.teams || undefined} aria-hidden="true" />}
      />
      <FieldTile as="label" icon={Location01Icon} label={t("myspace.meeting.location")}>
        <input
          className="cal-meet-input"
          dir="auto"
          value={v.where}
          maxLength={255}
          autoComplete="off"
          placeholder={t("calendar.meet.optional")}
          onChange={(e) => set({ where: e.target.value })}
        />
      </FieldTile>
      <FieldTile
        as="label"
        icon={Note01Icon}
        label={t("calendar.meet.note")}
        className="cal-meet-note"
      >
        <textarea
          className="cal-meet-input"
          dir="auto"
          rows={2}
          value={v.note}
          maxLength={4000}
          placeholder={t("calendar.meet.optional")}
          onChange={(e) => set({ note: e.target.value })}
        />
      </FieldTile>
    </div>
  )
}
