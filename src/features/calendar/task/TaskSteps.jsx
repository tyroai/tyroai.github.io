import { useLayoutEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import { FieldTile } from "@/features/selfservice/request/field/FieldTile"
import { fieldState } from "@/features/selfservice/request/field/fieldState"
import { useLocale } from "@/hooks/useLocale"
import {
  MAX_STEPS,
  STEP_MAX_LENGTH,
  dropStep,
  insertStepAfter,
  newStep,
  renameStep,
} from "@/features/calendar/lib/task"

/**
 * Adımlar: satır satır, yerinde düzenlenir. Bir satırda Enter (doluysa) arkasına yeni satır açar
 * ve odağı ona verir; boş satırda Geri tuşu satırı siler ve odak öncekine döner; her satırda
 * kaldır düğmesi var. Boş satırlar gönderilmez (`features/calendar/lib/task › stepTitles`). `steps`:
 * `{ id, title }` listesi, `onChange` yeni listeyi alır.
 */
export function TaskSteps({ idBase, steps, onChange }) {
  const { t } = useLocale()
  const seq = useRef(0)
  const inputs = useRef(new Map())
  const addButton = useRef(null)
  // Satır eklenince ya da silinince odak, çizimden sonra yeni yerine gider.
  const focusNext = useRef(null)
  useLayoutEffect(() => {
    const id = focusNext.current
    if (!id) return
    focusNext.current = null
    inputs.current.get(id)?.focus()
  })

  const full = steps.length >= MAX_STEPS
  const addAfter = (id) => {
    if (full) return
    const step = newStep(`s${++seq.current}`)
    focusNext.current = step.id
    onChange(insertStepAfter(steps, id, step))
  }
  const remove = (id) => {
    const at = steps.findIndex((s) => s.id === id)
    const near = steps[at - 1] ?? steps[at + 1]
    focusNext.current = near?.id ?? null
    onChange(dropStep(steps, id))
    // Satır kalmadıysa odak "Adım ekle"de kalsın (silinen düğme odağı bırakmasın).
    if (!near) requestAnimationFrame(() => addButton.current?.focus())
  }
  const onKeyDown = (e, step) => {
    if (e.nativeEvent.isComposing) return
    const plain = !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
    if (e.key === "Enter" && plain) {
      e.preventDefault()
      if (step.title.trim()) addAfter(step.id)
    } else if (e.key === "Backspace" && !step.title) {
      e.preventDefault()
      remove(step.id)
    }
  }

  return (
    <FieldTile
      as="div"
      icon={CheckListIcon}
      label={t("todo.detail.steps")}
      labelId={`${idBase}-steps-l`}
      state={fieldState({ filled: steps.some((s) => s.title.trim()) })}
      className="cal-task-tile"
      role="group"
      aria-labelledby={`${idBase}-steps-l`}
    >
      {steps.length > 0 && (
        <ol className="cal-steps" role="list">
          {steps.map((step, i) => (
            <li key={step.id} className="cal-step">
              <span className="cal-step-dot" aria-hidden="true" />
              <input
                ref={(el) => {
                  if (el) inputs.current.set(step.id, el)
                  else inputs.current.delete(step.id)
                }}
                className="cal-step-input"
                dir="auto"
                value={step.title}
                maxLength={STEP_MAX_LENGTH}
                autoComplete="off"
                placeholder={t("todo.detail.stepTitle")}
                aria-label={t("calendar.task.stepN", { n: i + 1 })}
                onChange={(e) => onChange(renameStep(steps, step.id, e.target.value))}
                onKeyDown={(e) => onKeyDown(e, step)}
              />
              <button
                type="button"
                className="cal-task-x"
                aria-label={t("calendar.task.stepRemove", { n: i + 1 })}
                onClick={() => remove(step.id)}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="cal-ic"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ol>
      )}
      {!full && (
        <button
          ref={addButton}
          type="button"
          className="cal-link cal-task-add"
          onClick={() => addAfter(steps[steps.length - 1]?.id)}
        >
          <HugeiconsIcon icon={Add01Icon} className="cal-ic" strokeWidth={2.2} aria-hidden="true" />
          {t("todo.detail.addStep")}
        </button>
      )}
    </FieldTile>
  )
}
