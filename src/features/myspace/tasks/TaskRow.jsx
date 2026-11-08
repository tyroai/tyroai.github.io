import { useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"

const ENTER = { type: "spring", duration: 0.35, bounce: 0 }
const FADE = { duration: 1.1, delay: 0.35, ease: "easeOut" }

const dayOf = (key) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Yeni gelen satırı kartın kaydırma alanında görünür yapar; sayfa kaymaz. */
function reveal(row) {
  const box = row?.closest(".tasks-scroll")
  if (!box) return
  const r = row.getBoundingClientRect()
  const b = box.getBoundingClientRect()
  if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 8
  else if (r.top < b.top) box.scrollTop -= b.top - r.top + 8
}

/**
 * Bugünün görevlerinin bir satırı: daire (tamamla), başlık (ayrıntıyı açar), gecikme ve önem işareti,
 * masaüstünde üstüne gelince "Bugünden çıkar". Sonradan gelen satır (eklenen, öneriden alınan) kısa
 * bir marka tonuyla belirir ve kaydırma alanında görünür olur; ilk çizimdekiler sessiz
 * (`AnimatePresence initial={false}`). Telefonda başlık alttan çekmeceyi açar (`detail` yok).
 */
export function TaskRow({
  task,
  todo,
  meta,
  dayFmt,
  mobile,
  open,
  onOpenChange,
  detail,
  onToggle,
  onRemove,
}) {
  const { t } = useLocale()
  const fresh = useRef(null)
  const panel = useRef(null)
  const late = Boolean(task.overdue && task.dueKey && !task.done)
  const lateDay = late ? dayFmt.format(dayOf(task.dueKey)) : ""
  const star = meta?.importance === "high" && !task.done
  const removeLabel = t(todo ? "myspace.tasks.unplan" : "myspace.tasks.remove")

  const title = (
    <button
      type="button"
      dir="auto"
      className="tasks-title"
      disabled={task.pending}
      aria-haspopup="dialog"
      onClick={mobile ? () => onOpenChange(true) : undefined}
    >
      {task.title}
    </button>
  )

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
      transition={ENTER}
      className="tasks-row"
      data-done={task.done || undefined}
      data-pending={task.pending || undefined}
    >
      <motion.span
        ref={fresh}
        aria-hidden="true"
        className="tasks-fresh"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={FADE}
        onAnimationStart={() => reveal(fresh.current?.parentElement)}
      />
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.title}
        disabled={task.pending}
        onClick={() => onToggle(task)}
        className="tasks-check"
        data-late={late || undefined}
      >
        <HugeiconsIcon icon={Tick02Icon} className="tasks-tick" strokeWidth={3} />
      </button>
      {mobile ? (
        title
      ) : (
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>{title}</PopoverTrigger>
          {open && (
            <PopoverContent
              ref={panel}
              tabIndex={-1}
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className="tasks-pop"
              // Odak "Tamamla"ya düşmesin (ikinci Enter işi bitirirdi): pencerenin kendisine.
              onOpenAutoFocus={(e) => {
                e.preventDefault()
                panel.current?.focus({ preventScroll: true })
              }}
            >
              {detail}
            </PopoverContent>
          )}
        </Popover>
      )}
      {(late || star || !mobile) && (
        <span className="tasks-trail">
          {(late || star) && (
            <span className="tasks-meta">
              {star && (
                <>
                  <HugeiconsIcon
                    icon={StarIcon}
                    className="tasks-star"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t("myspace.taskPreview.important")}</span>
                </>
              )}
              {late && (
                <span className="tasks-chip" data-tone="late">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} aria-hidden="true" />
                  <span className="tasks-chip-text" aria-hidden="true">
                    {lateDay}
                  </span>
                  <span className="sr-only">
                    {t("myspace.tasks.tip.overdue", { date: lateDay })}
                  </span>
                </span>
              )}
            </span>
          )}
          {!mobile && (
            <button
              type="button"
              className="tasks-remove"
              disabled={task.pending}
              onClick={() => onRemove(task.id)}
              aria-label={removeLabel}
              title={removeLabel}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </button>
          )}
        </span>
      )}
    </motion.li>
  )
}
