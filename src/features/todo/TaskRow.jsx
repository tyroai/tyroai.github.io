import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AlarmClockIcon from "@hugeicons/core-free-icons/AlarmClockIcon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import RepeatIcon from "@hugeicons/core-free-icons/RepeatIcon"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { dueLabel } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { MetaChip, SelectCheck, TaskCheck } from "./TaskCheck"
import { TaskMenu } from "./TaskMenu"
import { listIcon } from "./listIcon"

const OPTS_DONE_TIME = { hour: "2-digit", minute: "2-digit" }

/**
 * Adımlar sorguyla gelmediyse satır kendisi sorar: yalnız ekrana girince ve aynı
 * anda en çok iki tane (posta kutusunun eşzamanlılık sınırı). Anahtar
 * `kimlik@değişiklik`: görev değişmedikçe ikinci kez sorulmaz.
 */
const stepAsk = { running: 0, waiting: [], asked: new Set() }
function pumpSteps() {
  while (stepAsk.running < 2 && stepAsk.waiting.length) {
    const job = stepAsk.waiting.shift()
    stepAsk.running += 1
    job().finally(() => {
      stepAsk.running -= 1
      pumpSteps()
    })
  }
}
function askSteps(board, task) {
  const k = `${task.id}@${task.modifiedAt}`
  if (stepAsk.asked.has(k)) return
  stepAsk.asked.add(k)
  stepAsk.waiting.push(() =>
    board.loadSteps(task).then((res) => {
      if (res.status === "ready") board.setTaskSteps(task.id, res.steps)
    }),
  )
  pumpSteps()
}

/** Açık tutulan adım listeleri — satır gruplar arasında yeniden doğsa da açık kalsın (oturum). */
const openSteps = new Set()

/** Satır sonundaki ⋯ ve yıldız: masaüstünde satırın üstüne gelince, dokunmatikte hep görünür. */
const TRAIL =
  "grid size-8 shrink-0 place-items-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-brand/30 pointer-coarse:-m-1.5 pointer-coarse:size-11"
const HOVER_ONLY =
  "text-muted-foreground/40 opacity-0 hover:text-foreground group-hover/row:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"

export function TaskRow({
  task,
  list,
  today,
  showList,
  onToggle,
  onStar,
  onOpen,
  fresh,
  board,
  selecting,
  selected,
  onSelect,
  onStartSelect,
}) {
  const { t, locale } = useLocale()
  const due = dueLabel(task.dueKey, today, t, locale)
  const overdue = !task.done && task.dueKey && task.dueKey < today
  const doneTime =
    task.done && task.doneAt
      ? getDateTimeFormat(locale, OPTS_DONE_TIME).format(new Date(task.doneAt))
      : null
  const steps = Array.isArray(task.steps) ? task.steps : null
  const stepsDone = steps ? steps.filter((x) => x.done).length : 0
  const [showSteps, setShowSteps] = useState(() => openSteps.has(task.id))
  const rowRef = useRef(null)
  const stepsId = `steps-${task.id}`

  // Yedek yol: adımları bilinmeyen AÇIK görev ekrana girince sorulur.
  const unknown = task.steps === undefined && !task.done && !task.pending
  useEffect(() => {
    if (!unknown || !board) return undefined
    const el = rowRef.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          askSteps(board, task)
          io.disconnect()
        }
      },
      { rootMargin: "200px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
    // `board`/`task` nesneleri her çizimde yeni; kimlik ve değişiklik anı yeter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unknown, task.id, task.modifiedAt])

  const flipSteps = () => {
    const next = !showSteps
    if (next) openSteps.add(task.id)
    else openSteps.delete(task.id)
    setShowSteps(next)
  }

  return (
    <li
      ref={rowRef}
      data-task-row=""
      className={cn(
        "group/row relative flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]",
        // Seçili satırı çerçeve söyler: daha koyu zemin küçük gri yazıyı AA'nın altına indiriyor.
        selected && "bg-brand/[0.02] ring-1 ring-inset ring-brand/35 hover:bg-brand/[0.02]",
        task.pending && "opacity-60",
        fresh && "animate-[todo-fresh_1.6s_ease-out]",
      )}
    >
      {/* Soldaki yuvarlak görevi SEÇER (ürün sahibinin kararı; "Seç" düğmesi yok): ilk seçim
          kipi açar, son seçim kaldırılınca kip kapanır. Tamamlama ⋯ menüsünde ve seçim çubuğunda. */}
      <span className="pt-0.5">
        <SelectCheck
          checked={selected}
          onToggle={(e) => (selecting ? onSelect(task, e) : onStartSelect(task))}
          label={t("todo.select.item", { title: task.title || t("todo.untitled") })}
        />
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          // Seçim kipinde satıra basmak seçer; düğme odak sırasından çıkar (kutu yeterli).
          onClick={(e) => (selecting ? onSelect(task, e) : onOpen(task))}
          disabled={task.pending}
          tabIndex={selecting ? -1 : undefined}
          aria-hidden={selecting || undefined}
          className="block w-full min-w-0 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <span
            dir="auto"
            className={cn(
              "line-clamp-2 text-[0.875rem] leading-snug [overflow-wrap:anywhere]",
              task.done && "text-muted-foreground line-through decoration-foreground/30",
            )}
          >
            {task.title || t("todo.untitled")}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {showList && list && (
              <MetaChip icon={listIcon(list)}>
                <span className="max-w-[10rem] truncate">{list.name}</span>
              </MetaChip>
            )}
            {due && !task.done && (
              <MetaChip
                icon={Calendar03Icon}
                tone={overdue ? "overdue" : task.dueKey === today ? "today" : undefined}
              >
                {overdue ? t("todo.due.overdue", { date: due }) : due}
              </MetaChip>
            )}
            {doneTime && (
              <MetaChip icon={CheckmarkCircle02Icon}>
                {t("todo.meta.doneAt", { time: doneTime })}
              </MetaChip>
            )}
            {task.reminderAt && !task.done && (
              <MetaChip icon={AlarmClockIcon} label={t("todo.meta.reminder")} />
            )}
            {task.recurrence && <MetaChip icon={RepeatIcon} label={t("todo.meta.repeat")} />}
            {task.hasAttachments && (
              <MetaChip icon={Attachment01Icon} label={t("todo.meta.attachment")} />
            )}
          </span>
          {/* Not satırda: metnin kendisi, iki satıra kadar; tamamı ayrıntı panelinde. */}
          {task.note && (
            <span className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-muted-foreground">
              <HugeiconsIcon
                icon={Note01Icon}
                className="mt-0.5 size-3 shrink-0 opacity-70"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="sr-only">{t("todo.meta.note")}: </span>
              <span className="line-clamp-2 whitespace-pre-line [overflow-wrap:anywhere]">
                {task.note}
              </span>
            </span>
          )}
        </button>
        {/* Adımlar: düğme açma düğmesinin kardeşi (iç içe düğme yok); adım buradan da işaretlenir. */}
        {steps && steps.length > 0 && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={flipSteps}
              aria-expanded={showSteps}
              aria-controls={stepsId}
              className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 -mx-1 text-[0.75rem] font-medium text-muted-foreground outline-none transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/30 [@media(pointer:coarse)]:min-h-9"
            >
              <HugeiconsIcon
                icon={CheckListIcon}
                className="size-3.5"
                strokeWidth={2}
                aria-hidden="true"
              />
              {showSteps ? t("todo.steps.hide") : t("todo.steps.show")}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums",
                  stepsDone === steps.length
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                    : "bg-foreground/[0.06] text-foreground/70",
                )}
              >
                {stepsDone}/{steps.length}
              </span>
              <span className="sr-only">
                {t("todo.steps.progress", { done: stepsDone, total: steps.length })}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={cn("size-3 transition-transform", showSteps && "rotate-180")}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
            {showSteps && (
              <ul id={stepsId} className="mt-1 space-y-0.5 border-l border-foreground/10 pl-2.5">
                {steps.map((step) => (
                  <li
                    key={step.id}
                    className={cn("flex items-start gap-2 py-0.5", step.pending && "opacity-60")}
                  >
                    <span className="pt-[0.1875rem]">
                      <TaskCheck
                        size="sm"
                        done={step.done}
                        pending={step.pending || task.pending || !board}
                        onToggle={() => board?.toggleStep(task, step)}
                        label={t(step.done ? "todo.steps.uncheck" : "todo.steps.check", {
                          title: step.title,
                        })}
                      />
                    </span>
                    <span
                      className={cn(
                        "min-w-0 text-[0.8125rem] leading-snug [overflow-wrap:anywhere]",
                        step.done
                          ? "text-muted-foreground line-through decoration-foreground/30"
                          : "text-foreground/85",
                      )}
                    >
                      {step.title || t("todo.untitled")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {!selecting && (
        <div className="flex shrink-0 items-center gap-0.5 pointer-coarse:gap-3">
          <TaskMenu
            task={task}
            board={board}
            list={list}
            onToggle={onToggle}
            className={cn(
              TRAIL,
              HOVER_ONLY,
              "data-[state=open]:bg-accent data-[state=open]:opacity-100",
            )}
          />
          <button
            type="button"
            onClick={() => onStar(task)}
            disabled={task.pending}
            aria-pressed={task.importance === "high"}
            aria-label={task.importance === "high" ? t("todo.star.off") : t("todo.star.on")}
            title={task.importance === "high" ? t("todo.star.off") : t("todo.star.on")}
            className={cn(TRAIL, task.importance === "high" ? "text-brand" : HOVER_ONLY)}
          >
            <HugeiconsIcon
              icon={StarIcon}
              className={cn("size-4", task.importance === "high" && "fill-current")}
              strokeWidth={1.9}
            />
          </button>
        </div>
      )}
    </li>
  )
}
