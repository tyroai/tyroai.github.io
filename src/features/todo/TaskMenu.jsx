import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AlarmClockIcon from "@hugeicons/core-free-icons/AlarmClockIcon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import RepeatIcon from "@hugeicons/core-free-icons/RepeatIcon"
import { DestructiveDialog } from "@/features/security/dialogs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { localDayKey } from "@/lib/todo"
import { dueLabel } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { DueBody } from "./DuePicker"
import { ReminderBody, RepeatOptions } from "./TaskTiming"

const OPTS_STAMP = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }

function MenuRow({ icon, label, hint, hintTone, danger, next, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] outline-none transition disabled:pointer-events-none disabled:opacity-45 pointer-coarse:min-h-11",
        danger
          ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
          : "hover:bg-accent focus-visible:bg-accent",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        aria-hidden="true"
        className={cn("size-4 shrink-0", !danger && "text-muted-foreground")}
        strokeWidth={1.8}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && (
        <span
          className={cn(
            "max-w-[55%] truncate text-[0.75rem]",
            hintTone === "overdue"
              ? "font-medium text-amber-700 dark:text-amber-400"
              : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      )}
      {next && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
          strokeWidth={2}
        />
      )}
    </button>
  )
}

function PageHead({ title, onBack }) {
  const { t } = useLocale()
  return (
    <div className="flex items-center gap-1 border-b border-border p-1.5">
      <button
        type="button"
        autoFocus
        onClick={onBack}
        aria-label={t("todo.menu.back")}
        className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/30 pointer-coarse:size-11"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" strokeWidth={2} />
      </button>
      <span className="text-[0.8125rem] font-semibold">{title}</span>
    </div>
  )
}

/**
 * Satırın "⋯" menüsü: ayrıntı panelinin sık işleri, görevi açmadan — son tarih, hatırlatıcı,
 * tekrar, seç ve sil. Alt sayfalar aynı açılırda ve geri düğmeli; seçiciler panelinkilerle
 * aynı gövde (`DueBody`, `TaskTiming`). Sil ve Seç açılır kapandıktan sonra yürür: odak önce
 * "⋯"ye döner, onay penceresi kapanınca da oraya.
 */
export function TaskMenu({ task, board, list, onToggle, className }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState("main")
  const [back, setBack] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const after = useRef(null)
  const today = localDayKey()
  const reminder = task.reminderAt ? new Date(task.reminderAt) : null

  const change = (changes) => {
    board.updateTask(task.id, changes)
    setOpen(false)
  }
  const then = (what) => {
    after.current = what
    setOpen(false)
  }
  const goBack = () => {
    setBack(page)
    setPage("main")
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) {
            setPage("main")
            setBack(null)
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={task.pending}
            aria-label={t("todo.menu.open")}
            title={t("todo.menu.open")}
            className={className}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={1.9} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className={cn("gap-0 p-0", page === "due" || page === "reminder" ? "w-[17rem]" : "w-64")}
          onCloseAutoFocus={() => {
            const what = after.current
            after.current = null
            if (what === "delete") setConfirm(true)
          }}
        >
          {page === "main" && (
            <div className="p-1.5">
              {/* Soldaki yuvarlak seçim yapar; tek görevi tamamlamanın yolu burası (ve seçim çubuğu). */}
              {onToggle && (
                <>
                  <MenuRow
                    icon={CheckmarkCircle02Icon}
                    label={task.done ? t("todo.check.undo") : t("todo.check.done")}
                    onClick={() => {
                      onToggle(task)
                      setOpen(false)
                    }}
                  />
                  <div className="my-1 h-px bg-border" />
                </>
              )}
              <MenuRow
                icon={Calendar03Icon}
                label={t("todo.detail.due")}
                hint={task.dueKey ? dueLabel(task.dueKey, today, t, locale) : null}
                hintTone={!task.done && task.dueKey && task.dueKey < today ? "overdue" : null}
                next
                autoFocus={back === "due"}
                onClick={() => setPage("due")}
              />
              <MenuRow
                icon={AlarmClockIcon}
                label={t("todo.menu.reminder")}
                hint={reminder ? getDateTimeFormat(locale, OPTS_STAMP).format(reminder) : null}
                next
                disabled={task.done}
                autoFocus={back === "reminder"}
                onClick={() => setPage("reminder")}
              />
              <MenuRow
                icon={RepeatIcon}
                label={t("todo.menu.repeat")}
                hint={task.recurrence ? t(`todo.repeat.${task.recurrence}`) : null}
                next
                disabled={task.done}
                autoFocus={back === "repeat"}
                onClick={() => setPage("repeat")}
              />
              <div className="my-1 h-px bg-border" />
              <MenuRow
                icon={Delete02Icon}
                label={t("todo.detail.delete")}
                danger
                onClick={() => then("delete")}
              />
            </div>
          )}
          {page === "due" && (
            <>
              <PageHead title={t("todo.detail.due")} onBack={goBack} />
              <DueBody
                value={task.dueKey}
                onPick={(dueKey) => change({ dueKey })}
                onClear={() => change({ dueKey: null })}
              />
            </>
          )}
          {page === "reminder" && (
            <>
              <PageHead title={t("todo.menu.reminder")} onBack={goBack} />
              <ReminderBody
                current={reminder}
                dueKey={task.dueKey}
                onSave={(d) => change({ reminderAt: d.toISOString() })}
                onClear={reminder ? () => change({ reminderAt: null }) : null}
              />
            </>
          )}
          {page === "repeat" && (
            <>
              <PageHead title={t("todo.menu.repeat")} onBack={goBack} />
              <div className="p-1.5">
                <RepeatOptions
                  value={task.recurrence}
                  hasDue={Boolean(task.dueKey)}
                  onPick={(recurrence) => change({ recurrence })}
                />
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <DestructiveDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={Delete02Icon}
        title={t("todo.detail.deleteTitle")}
        description={t("todo.detail.deleteBody")}
        subject={task.title || t("todo.untitled")}
        consequences={[
          { kind: "gone", text: t("todo.detail.deleteGone") },
          ...(list?.kind === "flagged"
            ? [{ kind: "keep", text: t("todo.detail.deleteKeepMail") }]
            : []),
        ]}
        confirmLabel={t("todo.detail.deleteConfirm")}
        cancelLabel={t("todo.cancel")}
        onConfirm={() => {
          setConfirm(false)
          board.removeTask(task.id)
        }}
      />
    </>
  )
}
