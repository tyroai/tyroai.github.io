import { useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { addQuickTask } from "@/lib/todoQuickAdd"
import { TileShell } from "./TileShell"
import { TileTip } from "./TileTip"

/** Hızlı görev kutucuğu: dokununca yazma alanı panelin içinde açılır (`TaskDetail`). */
export function TaskTile({ onOpen, ...shell }) {
  const { t } = useLocale()
  return (
    <TileShell id="tool:task" {...shell}>
      <TileTip hint={t("control.task.hint")}>
        <button type="button" className="cc-hit" onClick={() => onOpen("tool:task")}>
          <span className="cc-ic">
            <HugeiconsIcon icon={TaskAdd01Icon} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="cc-text">
            <span className="cc-label">{t("control.task.title")}</span>
          </span>
        </button>
      </TileTip>
    </TileShell>
  )
}

/**
 * Hızlı görev: yaz, Enter — To Do'nun varsayılan listesine bugünün tarihiyle düşer (Anasayfa'nın
 * "Bugünün odağı" ve To-Do'nun Bugün'ü). Bu açılışta eklenenler altta ✓ ile (kişisel: Sunum
 * modunda bulanık). Boşsa ya da yazılamadıysa alanın altında söyler; alan hep odakta kalır.
 */
export function TaskDetail() {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [added, setAdded] = useState([])
  const field = useRef(null)
  useEffect(() => {
    field.current?.focus({ preventScroll: true })
  }, [])

  async function submit(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) {
      setError(t("control.task.empty"))
      field.current?.focus()
      return
    }
    setBusy(true)
    setError("")
    const res = await addQuickTask(instance, accounts[0], text)
    setBusy(false)
    if (res.status === STATUS.ready) {
      setAdded((list) => [{ id: `${Date.now()}`, text }, ...list].slice(0, 3))
      setTitle("")
    } else {
      setError(t("control.task.failed"))
    }
    field.current?.focus()
  }

  return (
    <form className="cc-form" onSubmit={submit} noValidate>
      <div className="cc-field">
        <input
          ref={field}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError("")
          }}
          maxLength={255}
          enterKeyHint="done"
          placeholder={t("control.task.placeholder")}
          aria-label={t("control.task.title")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "cc-task-error" : undefined}
          className="cc-input"
        />
        <button type="submit" className="cc-pill" data-tone="prominent" disabled={busy}>
          {t("control.task.add")}
        </button>
      </div>
      {error && (
        <p id="cc-task-error" role="alert" className="cc-error">
          {error}
        </p>
      )}
      {added.length > 0 && (
        <ul className="cc-done" aria-live="polite">
          {added.map((x) => (
            <li key={x.id}>
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" />
              <span data-private="">{x.text}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="cc-note">{t("control.task.note")}</p>
    </form>
  )
}
