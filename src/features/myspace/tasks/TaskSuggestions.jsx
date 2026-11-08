import { useId } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import { useLocale } from "@/hooks/useLocale"
import { dueLabel } from "@/lib/todoInsights"

const LEAVE = { opacity: 0, y: -6, transition: { duration: 0.16 } }

/**
 * Önerilerin listesi (eski "Bugüne al" kartı): bugüne düşmemiş açık işler (`useTaskSuggestions`).
 * Listeyle aynı kaydırma alanında, altında. "Bugüne al" işi hemen listeye taşır: öneri yukarı
 * doğru söner, iş listede belirir. Dar kartta düğme yalnız güneş (ad ipucunda ve ekran okuyucuda).
 */
export function TaskSuggestions({ picks, today, canOpenTodo, onTake }) {
  const { t, locale } = useLocale()
  const head = useId()
  return (
    <section className="tasks-suggest" aria-labelledby={head}>
      <div className="tasks-suggest-head">
        <span id={head} className="tasks-suggest-title">
          <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} aria-hidden="true" />
          {t("myspace.focus.suggestTitle")}
        </span>
        {canOpenTodo && (
          <Link to="/todo?view=planned" className="tasks-suggest-all">
            {t("widgets.suggest.all")}
          </Link>
        )}
      </div>
      <ul className="tasks-suggest-list">
        <AnimatePresence initial={false} mode="popLayout">
          {picks.map((task) => {
            const title = task.title || t("todo.untitled")
            const due = task.dueKey
              ? dueLabel(task.dueKey, today, t, locale)
              : t("widgets.suggest.noDue")
            const label = t("myspace.focus.takeTask", { title })
            return (
              <motion.li
                key={task.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={LEAVE}
                className="tasks-sugg"
              >
                {task.importance === "high" && (
                  <HugeiconsIcon
                    icon={StarIcon}
                    className="tasks-star"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                )}
                <span dir="auto" className="tasks-sugg-title" title={`${title} · ${due}`}>
                  {title}
                </span>
                <span className="tasks-sugg-due">{due}</span>
                <button
                  type="button"
                  className="tasks-take"
                  onClick={() => onTake(task)}
                  aria-label={label}
                  title={label}
                >
                  <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} aria-hidden="true" />
                  <span className="tasks-take-text" aria-hidden="true">
                    {t("myspace.tasks.take")}
                  </span>
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}
