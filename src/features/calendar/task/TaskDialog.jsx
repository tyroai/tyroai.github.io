import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
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
import { TaskFields } from "./TaskFields"
import { useTaskForm } from "./useTaskForm"
import "../meeting/calendarMeeting.css"
import "./calendarTask.css"

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
function TaskFoot({ form, formId, onCancel }) {
  const { t } = useLocale()
  const { failure, saved, busy } = form
  const label = busy
    ? "calendar.task.creating"
    : saved
      ? "calendar.task.retrySteps"
      : "calendar.page.new.taskAdd"
  return (
    <>
      {failure && (
        <p className="cal-meet-fail" role="alert">
          {failure.kind === "steps"
            ? t("calendar.task.errSteps", { done: failure.done, total: failure.total })
            : t("calendar.task.errFailed")}
        </p>
      )}
      <div className="cal-meet-actions">
        <button type="button" className="cal-btn" onClick={onCancel}>
          {t(saved ? "sheet.close" : "todo.cancel")}
        </button>
        <button
          type="submit"
          form={formId}
          className="cal-btn"
          data-primary=""
          disabled={busy}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          {t(label)}
        </button>
      </div>
    </>
  )
}

function TaskPanel({ target, board, open, onClose, mobile }) {
  const { t } = useLocale()
  const form = useTaskForm({ target, board, onDone: onClose })
  const formId = `${form.idBase}-form`
  const title = t("calendar.task.title")
  const where = t("todo.board.eyebrow")
  // Alanlar çok satırlı olabildiği için Enter formu göndermez; Ctrl/⌘+Enter gönderir. Adım
  // satırı Enter'ı kendisi işler (yeni satır).
  const onKeyDown = (e) => {
    if (e.key !== "Enter") return
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      form.submit()
    } else if (e.target instanceof HTMLInputElement) e.preventDefault()
  }
  const fields = (
    <form id={formId} noValidate onSubmit={form.submit} onKeyDown={onKeyDown}>
      <TaskFields form={form} />
    </form>
  )
  const foot = <TaskFoot form={form} formId={formId} onCancel={onClose} />
  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={title}
        description={where}
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
        className="cal-pop cal-meet cal-task-dlg"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          document.getElementById(`${form.idBase}-title`)?.focus()
        }}
        onCloseAutoFocus={keepFocus}
        // Sohbet rıhtımı Esc'i pencerede dinliyor; açık tarih menüsü Esc'i kendisi yutar.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => form.dirty && e.preventDefault()}
      >
        <header className="cal-meet-head" data-tone="task">
          <span className="cal-d-ic">
            <HugeiconsIcon
              icon={TaskAdd01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
          </span>
          <div className="cal-meet-titles">
            <DialogTitle className="cal-meet-title">{title}</DialogTitle>
            <DialogDescription className="cal-meet-day">{where}</DialogDescription>
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
 * Yeni görev penceresi (takvimde, To-Do'ya gitmeden): masaüstünde ortada pencere, telefonda alttan
 * çekmece; başlık, liste, son tarih, adımlar, not ve önem. `target`: `{ day, seq, initial? }` ya da
 * null (`initial`: formun önceden dolu alanları, `features/calendar/lib/task › initialTask`); `board`:
 * `useTodoBoard`. Her açılış taze bir formla başlar (`seq`), kapanış animasyonu süresince son form
 * çizilir. Kabuk ve alanların stili toplantı penceresininkiyle ortak (`meeting/calendarMeeting.css`).
 */
export function TaskDialog({ target, board, onClose }) {
  const mobile = useIsMobile()
  const [last, setLast] = useState(target)
  if (target && target !== last) setLast(target)
  if (!last) return null
  return (
    <TaskPanel
      key={last.seq}
      target={last}
      board={board}
      open={Boolean(target)}
      onClose={onClose}
      mobile={mobile}
    />
  )
}
