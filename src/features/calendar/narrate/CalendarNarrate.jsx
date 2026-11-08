import { useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { NarrateField } from "@/features/selfservice/narrate/NarrateField"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { KIND_LOOK, chipsOf } from "./narrateLook"
import "./calendarNarrate.css"

/**
 * "Anladığım": önce türün çipi (Toplantı · İzin · Görev, Yeni menüsündeki seçenekle aynı renkte),
 * ardından her parça kendi simgesiyle bir çip; altında uyarılar. Anlaşılmadıysa örnekli tek satır.
 * Yeni anlaşılan çip kısa bir kayışla gelir (hareketi azaltmada yalnız solma).
 */
function Chips({ result }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const reduced = useReducedMotion()
  if (!result.kind) {
    return (
      <p className="cal-nar-note" role="status">
        {t("calendar.narrate.unknown")}
      </p>
    )
  }
  const kind = KIND_LOOK[result.kind]
  const chips = chipsOf(result, { t, locale, today })
  return (
    <>
      <ul className="cal-nar-chips" aria-live="polite">
        <li className="cal-nar-chip" data-kind="" data-tone={kind.tone}>
          <HugeiconsIcon icon={kind.icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
          <span>{t(kind.label)}</span>
        </li>
        <AnimatePresence initial={false}>
          {chips.map((c) => (
            <motion.li
              key={`${c.id}:${c.text}`}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="cal-nar-chip"
            >
              {c.icon && <IconTile icon={c.icon} tone={c.tone ?? "brand"} size="xs" />}
              <span>{c.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {result.warnings.map((w) => (
        <p key={w} className="cal-nar-warn">
          <HugeiconsIcon icon={Alert02Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
          {t(`selfService.narrate.warn.${w}`)}
        </p>
      ))}
    </>
  )
}

/**
 * Yeni menüsünün ilk satırı: bir cümleyle toplantı, izin ya da görev (Self Servis'in Anlat kutusu:
 * dönen örnekler, mikrofon, onay oku). Yazılınca altında "anladığım" çipleri çıkar; Enter ya da ok
 * düğmesi doğru formu dolu açar (`onOpen(sonuç)`), hiçbir şey kendiliğinden kaydedilmez.
 * `nar`: `useCalendarNarrate`. `onDown`: boş kutuda aşağı ok (menünün seçeneklerine iner).
 */
export function CalendarNarrate({ nar, onOpen, onDown }) {
  const { t } = useLocale()
  // Temizle düğmesi odağı kutuya geri verir (kutu boşalınca düğme kalkar, odak sayfa başına düşmesin).
  const inputRef = useRef(null)
  const ok = Boolean(nar.result?.kind)
  return (
    <div className="cal-nar">
      <NarrateField
        inputRef={inputRef}
        label={t("calendar.narrate.label")}
        text={nar.text}
        setText={nar.setText}
        onSubmit={() => ok && onOpen(nar.result)}
        canSubmit={ok}
        submitLabel={t("selfService.narrate.open")}
        examples={[
          t("calendar.narrate.phMeeting"),
          t("selfService.narrate.placeholder"),
          t("calendar.narrate.phTask"),
        ]}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" || nar.typing) return
          e.preventDefault()
          onDown()
        }}
        className="cal-nar-field"
      />
      {nar.typing && nar.result && <Chips result={nar.result} />}
    </div>
  )
}
