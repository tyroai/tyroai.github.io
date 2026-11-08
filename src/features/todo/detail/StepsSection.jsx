import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { AutoText } from "./AutoText"
import { useTaskSteps } from "./useTaskSteps"

/**
 * Adımlar bölümü — kâğıtta ince ayırıcılı satırlar: yuvarlak kutu · düzenlenebilir ad (uzun ad
 * alt satıra kayar, kesilmez; Enter bırakır) · sil (×);
 * en altta "Adım ekle". Okunamazsa nedeni ve BT'ye iletilecek kod (`ErrorCause`).
 */
export function StepsSection({ board, task }) {
  const { t, locale } = useLocale()
  const steps = useTaskSteps(board, task)
  const [draft, setDraft] = useState("")
  const done = steps.steps.filter((x) => x.done).length

  function submit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setDraft("")
    steps.add(draft)
  }

  return (
    <section className="td-section">
      <div className="td-section-head">
        <h3 className="rw-section">{t("todo.detail.steps")}</h3>
        {steps.steps.length > 0 && (
          <span className="td-count">
            <span aria-hidden="true">
              {formatCount(locale, done)}/{formatCount(locale, steps.steps.length)}
            </span>
            <span className="sr-only">
              {t("todo.steps.progress", { done, total: steps.steps.length })}
            </span>
          </span>
        )}
      </div>
      {steps.status === "loading" && (
        <div aria-hidden="true" className="td-skeleton">
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
        </div>
      )}
      {steps.status === "error" && (
        <div className="td-error">
          <p>{t("todo.detail.stepsError")}</p>
          <ErrorCause detail={steps.detail} className="mt-1" />
        </div>
      )}
      {steps.steps.length > 0 && (
        <ul className="td-steps">
          {steps.steps.map((step) => (
            <li key={step.id} className="td-step" data-pending={step.pending || undefined}>
              <button
                type="button"
                role="checkbox"
                aria-checked={step.done}
                aria-label={step.title}
                disabled={step.pending}
                onClick={() => steps.toggle(step)}
                className="td-step-check"
              >
                {step.done && <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} />}
              </button>
              <AutoText
                value={step.title}
                disabled={step.pending}
                singleLine
                label={t("todo.detail.stepTitle")}
                onChange={(title) => steps.edit(step.id, title)}
                onFocus={() => steps.startEdit(step)}
                onCommit={(e) => steps.rename(step.id, e.currentTarget.value)}
                className="no-ios-zoom td-step-input"
              />
              <button
                type="button"
                disabled={step.pending}
                onClick={() => steps.remove(step)}
                aria-label={t("todo.detail.removeStep")}
                className="td-step-remove"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {steps.status !== "loading" && (
        <form onSubmit={submit} className="td-step-add">
          <HugeiconsIcon icon={Add01Icon} aria-hidden="true" strokeWidth={2} />
          <input
            value={draft}
            maxLength={255}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("todo.detail.addStep")}
            aria-label={t("todo.detail.addStep")}
            className="no-ios-zoom td-step-input"
          />
        </form>
      )}
    </section>
  )
}
