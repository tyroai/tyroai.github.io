import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import { useLocale } from "@/hooks/useLocale"
import { moveAttendee, splitPeople, withKind } from "@/features/calendar/lib/attendeeKinds"
import { AttendeePicker } from "./AttendeePicker"
import { Availability } from "./Availability"

/** Seçilmemiş yazı uyarısı: kutunun altında, kutunun `aria-describedby`ı. */
function PickError({ id, children }) {
  return (
    <p id={id} className="cal-meet-err" role="alert">
      {children}
    </p>
  )
}

/**
 * Toplantının katılımcıları (Outlook'un düzeni): "Zorunlu" seçici her zaman, "İsteğe bağlı" seçici
 * "+ İsteğe bağlı" ile açılır (isteğe bağlı kişi varken zaten açıktır). Tek `people` dizisi iki
 * seçiciyi besler (`features/calendar/lib/attendeeKinds`): bir kişi tek listede, birine eklenen öbüründen çıkar;
 * çipteki düğme kişiyi öbür listeye taşır, odak düğmeyle birlikte yeni yerine gider ve taşıma
 * ekran okuyucuya söylenir. Müsaitlik satırı (`Availability`) herkesi kapsar; ilk ortak boşluk yalnız
 * zorunlu olanlara bakar. Anlat'ın söylediği adlar (`form.spoken`) zorunlu seçiciye gider.
 */
export function Attendees({ form, avail, onApply }) {
  const { t } = useLocale()
  const { v, set, idBase, me, draftError, draftOptionalError } = form
  const { required, optional } = useMemo(() => splitPeople(v.people), [v.people])
  const [opened, setOpened] = useState(false)
  const [said, setSaid] = useState("")
  const root = useRef(null)
  const optionalText = v.draftOptional ?? ""
  const showOptional = opened || optional.length > 0 || Boolean(optionalText)
  const states = avail.view?.states

  const change = (list, isOptional) => set({ people: withKind(v.people, list, isOptional) })
  const move = (person, toOptional) => {
    set({ people: moveAttendee(v.people, person.address, toOptional) })
    setSaid(
      t(toOptional ? "calendar.meet.movedOptional" : "calendar.meet.movedRequired", {
        name: person.name,
      }),
    )
    // Çip öbür seçicide yeniden çizilir: odak, taşıyan düğmeyle birlikte oraya gider.
    requestAnimationFrame(() => {
      const key = String(person.address).toLowerCase()
      root.current?.querySelectorAll("[data-mv]").forEach((b) => b.dataset.mv === key && b.focus())
    })
  }
  const reveal = () => {
    setOpened(true)
    requestAnimationFrame(() => document.getElementById(`${idBase}-who-opt`)?.focus())
  }

  return (
    <div ref={root}>
      <AttendeePicker
        id={`${idBase}-who`}
        value={required}
        text={v.draft}
        onText={(draft) => set({ draft })}
        onChange={(list) => change(list, false)}
        onMove={(person) => move(person, true)}
        status={states}
        invalid={draftError}
        describedBy={draftError ? `${idBase}-who-err` : undefined}
        spoken={form.spoken}
      />
      {draftError && <PickError id={`${idBase}-who-err`}>{t("calendar.meet.errPick")}</PickError>}
      {showOptional ? (
        <div className="cal-who-second">
          <AttendeePicker
            optional
            id={`${idBase}-who-opt`}
            value={optional}
            text={optionalText}
            onText={(draftOptional) => set({ draftOptional })}
            onChange={(list) => change(list, true)}
            onMove={(person) => move(person, false)}
            status={states}
            invalid={draftOptionalError}
            describedBy={draftOptionalError ? `${idBase}-who-opt-err` : undefined}
          />
          {draftOptionalError && (
            <PickError id={`${idBase}-who-opt-err`}>{t("calendar.meet.errPick")}</PickError>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="cal-link cal-who-more"
          aria-label={t("calendar.meet.addOptional")}
          onClick={reveal}
        >
          <HugeiconsIcon icon={Add01Icon} className="cal-ic" strokeWidth={2.2} aria-hidden="true" />
          {t("calendar.meet.optional")}
        </button>
      )}
      <span className="cal-sr" role="status">
        {said}
      </span>
      <Availability avail={avail} people={v.people} me={me} onApply={onApply} />
    </div>
  )
}
