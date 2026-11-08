import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { RSVP_ACTIONS } from "@/lib/calendarInvites"
import { responseKey, responseTone } from "./eventFormat"

const ICON = { accept: Tick02Icon, tentativelyAccept: HelpCircleIcon, decline: Cancel01Icon }
const LABEL = {
  accept: "myspace.invite.accept",
  tentativelyAccept: "myspace.invite.tentative",
  decline: "myspace.invite.decline",
}
// Simge durum renginde, yazı nötr: renk yalnız anlam taşıyan yerde.
const TONE = { accept: "success", tentativelyAccept: "warning", decline: "danger" }

/**
 * Yanıt bekleyen davetin düğmeleri — bilgi listesindeki Yanıtınız satırında, durumun
 * ("Yanıtlamadınız") hemen altında tek sıra: Kabul et · Belki · Reddet, eşit genişlikte kayıt
 * penceresi kapsülleri. Alt eylem şeridinde değil: orada yalnız eylemler. Yanıt gidince kart durumu
 * hemen değiştirir (`EventDetailCard`), takvim arkada yeniden okunur. `pending`: o an giden yanıt.
 */
export function EventResponse({ pending, onAnswer }) {
  const { t } = useLocale()
  return (
    <div className="ev-rsvp" role="group" aria-label={t("calendar.detail.response")}>
      {RSVP_ACTIONS.map((action) => (
        <button
          key={action}
          type="button"
          className="rw-btn"
          data-tone={TONE[action]}
          disabled={Boolean(pending)}
          onClick={(e) => {
            e.stopPropagation()
            onAnswer(action)
          }}
        >
          <HugeiconsIcon
            icon={pending === action ? Loading03Icon : ICON[action]}
            className={pending === action ? "animate-spin motion-reduce:animate-none" : undefined}
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span>{t(LABEL[action])}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * "Yanıtınız" satırının değeri: durum (nokta takvim satırının şeridiyle aynı tonda: kabul marka,
 * bekleyen dikkat, ret gri). Buradan yanıtlanamayan davette (başkasının takvimi, yanıtsız iç
 * davet) LCV bağlantısı; yanıtlanabilir davette durumun hemen altında Kabul et · Belki · Reddet.
 * `detail`: `useEventDetail`in sonucu.
 */
export function ResponseValue({ event, detail }) {
  const { t } = useLocale()
  const { response, needsAnswer, canAnswer, pending, onAnswer } = detail
  return (
    <>
      <span className="ev-resp" data-tone={responseTone(response, event.isCancelled)}>
        {t(responseKey(response))}
        {event.webLink && needsAnswer && !canAnswer && (
          <>
            {/* Gerçek boşluk (yarım em), kenar boşluğu değil: Arapçada iki sağdan sola parça
              yan yana dizilir, `margin-inline-start` dış kenara düşüp onları yapıştırıyordu. */}
            {"\u2002"}
            <a
              href={event.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ev-rsvp-link"
            >
              {t("calendar.rsvp")}
            </a>
          </>
        )}
      </span>
      {canAnswer && <EventResponse pending={pending} onAnswer={onAnswer} />}
    </>
  )
}
