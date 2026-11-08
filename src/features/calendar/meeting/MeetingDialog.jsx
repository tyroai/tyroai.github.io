import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { keyToDay } from "@/features/calendar/lib/range"
import { dayFull } from "../format"
import { MeetingFields } from "./MeetingFields"
import { useMeetingForm } from "./useMeetingForm"
import "./calendarMeeting.css"
import "./calendarWho.css"

// Odak kapanınca Yeni düğmesine döner (boş saate basış için sanal nokta açan öğe yok).
const focusNew = () =>
  requestAnimationFrame(() =>
    document.querySelector('[data-tour="cal-new"]')?.focus({ preventScroll: true }),
  )
const keepFocus = (e) => {
  e.preventDefault()
  focusNew()
}

/** Alt şerit: hata (varsa) ve düğmeler. Birincil düğme formu dışarıdan gönderir (`form=`). */
function MeetingFoot({ form, formId, onCancel }) {
  const { t } = useLocale()
  const { failure } = form
  return (
    <>
      {failure && (
        <p className="cal-meet-fail" role="alert">
          {t(failure.kind === "denied" ? "calendar.meet.errDenied" : "calendar.meet.errFailed")}
          {failure.kind === "failed" && failure.detail && <span>{failure.detail}</span>}
        </p>
      )}
      <div className="cal-meet-actions">
        <button type="button" className="cal-btn" onClick={onCancel}>
          {t("todo.cancel")}
        </button>
        <button
          type="submit"
          form={formId}
          className="cal-btn"
          data-primary=""
          disabled={form.busy}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          {t(form.busy ? "calendar.meet.creating" : "calendar.meet.create")}
        </button>
      </div>
    </>
  )
}

function MeetingPanel({ target, open, onClose, mobile }) {
  const { t, locale } = useLocale()
  const form = useMeetingForm({ target, onDone: onClose })
  const formId = `${form.idBase}-form`
  const title = t("calendar.meet.title")
  const when = dayFull(keyToDay(form.v.date), locale)
  // Enter formu göndermez (davet geri alınamaz); Ctrl/⌘+Enter gönderir.
  const onKeyDown = (e) => {
    if (e.key !== "Enter") return
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      form.submit()
    } else if (e.target instanceof HTMLInputElement) e.preventDefault()
  }
  const fields = (
    <form id={formId} noValidate onSubmit={form.submit} onKeyDown={onKeyDown}>
      <MeetingFields form={form} />
    </form>
  )
  const foot = <MeetingFoot form={form} formId={formId} onCancel={onClose} />
  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={title}
        description={when}
        // Alt şerit de çekmece gövdesinin renk ve çizgi değişkenlerini ister (`.cal-sheet-body`).
        footer={<div className="cal-sheet-body">{foot}</div>}
        onCloseAutoFocus={keepFocus}
        onPointerDownOutside={(e) => form.dirty && e.preventDefault()}
      >
        <div className="cal-sheet-body cal-meet-sheet">{fields}</div>
      </BottomSheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="cal-pop cal-meet"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          document.getElementById(`${form.idBase}-title`)?.focus()
        }}
        onCloseAutoFocus={keepFocus}
        // Açık katılımcı listesi varsa Esc yalnız onu kapatır; sohbet rıhtımı Esc'i pencerede dinliyor.
        onEscapeKeyDown={(e) =>
          e.target?.getAttribute?.("aria-expanded") === "true"
            ? e.preventDefault()
            : e.stopPropagation()
        }
        onPointerDownOutside={(e) => form.dirty && e.preventDefault()}
      >
        <header className="cal-meet-head" data-tone="meeting">
          <span className="cal-d-ic">
            <HugeiconsIcon
              icon={CalendarAdd01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
          </span>
          <div className="cal-meet-titles">
            <DialogTitle className="cal-meet-title">{title}</DialogTitle>
            <DialogDescription className="cal-meet-day">{when}</DialogDescription>
          </div>
          <DialogClose className="cal-icon-btn" aria-label={t("sheet.close")}>
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
          </DialogClose>
        </header>
        <div className="cal-meet-scroll">{fields}</div>
        <div className="cal-meet-foot">{foot}</div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Yeni toplantı penceresi (takvimde, Outlook'a gitmeden): masaüstünde ortada pencere, telefonda
 * alttan çekmece. `target`: `{ day, minute, seq, initial? }` ya da null (`initial`: Anlat'ın doldurduğu
 * alanlar, `useMeetingForm`); her açılış taze bir formla başlar (`seq`), kapanış animasyonu süresince
 * son form çizilir.
 */
export function MeetingDialog({ target, onClose }) {
  const mobile = useIsMobile()
  const [last, setLast] = useState(target)
  if (target && target !== last) setLast(target)
  if (!last) return null
  return (
    <MeetingPanel
      key={last.seq}
      target={last}
      open={Boolean(target)}
      onClose={onClose}
      mobile={mobile}
    />
  )
}
