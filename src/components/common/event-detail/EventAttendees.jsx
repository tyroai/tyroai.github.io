import { useState } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { groupAttendees } from "./attendeeStatus"

// `ev-face`: dokunmatikte avatarı büyütmeden 44 px'lik basma alanı (eventDetail.css).
const PERSON_BUTTON =
  "ev-face rounded-full transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Kartın katılımcıları — bilgi listesinin geniş satırının değeri (başlığı "15 katılımcı" satırın
 * etiketi): yanıtların özeti (Kabul etti · Belki · Reddetti · Yanıt vermedi — sayılarıyla), ilk
 * altı yüz, "tümünü göster".
 * Tam liste yanıta göre gruplu ve KENDİ İÇİNDE kayar — yüzlerce katılımcılı toplantıda kart
 * yutulmasın, devamı olduğu da görünsün.
 */
export function EventAttendees({ people, organizerAddress, photoOf, presenceOf, onPerson }) {
  const { t } = useLocale()
  const [showAll, setShowAll] = useState(false)
  const groups = groupAttendees(people, organizerAddress)
  const dot = (g) => (
    <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", g.dot)} />
  )
  const avatar = (a, size) => {
    const presence = presenceOf(a.address)
    return (
      <PersonAvatar
        name={a.name}
        photo={photoOf(a.address)}
        response={a.response}
        presence={presence}
        presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
        className={size}
      />
    )
  }

  return (
    <div className="ev-people">
      <ul className="flex flex-wrap gap-1.5">
        {/* Özet yalnız yanıtlar; düzenleyen listede kendi grubunda. */}
        {groups
          .filter((g) => g.key !== "organizer")
          .map((g) => (
            <li
              key={g.key}
              className="flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5 text-[0.6875rem] text-foreground/80"
            >
              {dot(g)}
              {t(g.label)}
              <span className="font-semibold tabular-nums text-foreground">{g.people.length}</span>
            </li>
          ))}
      </ul>
      <div className="ev-faces mt-2 flex items-center gap-1.5">
        {people.slice(0, 6).map((a) => (
          <button
            key={a.address || a.name}
            type="button"
            onClick={() => onPerson({ name: a.name, address: a.address })}
            // Ad görünmeyen metinden, ne yaptığı ipucunda: aria-label baş harflerle uyuşmuyordu
            // (WCAG 2.5.3, axe label-content-name-mismatch).
            title={t("person.openCard", { name: a.name })}
            className={PERSON_BUTTON}
          >
            {avatar(a, "size-7")}
            <span className="sr-only">{a.name}</span>
          </button>
        ))}
        {people.length > 6 && (
          <span className="text-[0.6875rem] text-muted-foreground">
            {t("calendar.moreAttendees", { count: people.length - 6 })}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="mt-2 text-[0.71875rem] font-semibold text-brand transition hover:underline"
      >
        {t(showAll ? "calendar.hideAll" : "calendar.showAll", { count: people.length })}
      </button>
      {showAll && (
        <div className="mt-1.5 max-h-64 space-y-2.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15">
          {groups.map((g) => (
            <section key={g.key} aria-label={t(g.label)}>
              <p className="flex items-center gap-1.5 px-1 pb-1 text-[0.6875rem] font-semibold text-muted-foreground">
                {dot(g)}
                {t(g.label)}
                <span className="tabular-nums">· {g.people.length}</span>
              </p>
              <ul className="space-y-1">
                {g.people.map((a) => (
                  <li key={a.address || a.name}>
                    <button
                      type="button"
                      onClick={() => onPerson({ name: a.name, address: a.address })}
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {avatar(a, "size-6")}
                      <span className="min-w-0 text-foreground/85 [overflow-wrap:anywhere]">
                        {a.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
