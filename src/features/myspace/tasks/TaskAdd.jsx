import { useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import { useLocale } from "@/hooks/useLocale"
import { MAX_TITLE } from "@/lib/myspaceTasks"
import { showResultToast } from "@/lib/refreshToast"

/** Yapıştırılan çok satırlı metin → iş adları (madde işaretleri ve "1." numaraları düşer). */
const linesOf = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean)

/**
 * Ekleme alanı — kartın dibine sabit, hep açık (bir düğmenin arkasında değil). Enter ekler ve odak
 * alanda kalır (art arda yazılır); çok satırlı yapıştırma her satırı ayrı iş yapar. Gönder düğmesi
 * yalnız yazı varken. Yerel yedekte liste dolunca alanın yerinde sebebi yazılır.
 */
export function TaskAdd({ focus }) {
  const { t } = useLocale()
  const id = useId()
  const [draft, setDraft] = useState("")
  const input = useRef(null)
  if (focus.full) return <p className="tasks-full">{t("myspace.tasks.full")}</p>

  function submit(e) {
    e.preventDefault()
    if (focus.add(draft)) setDraft("")
    input.current?.focus()
  }

  function onPaste(e) {
    const lines = linesOf(e.clipboardData?.getData("text") ?? "")
    if (lines.length < 2) return
    e.preventDefault()
    let added = 0
    for (const line of lines) if (focus.add(line)) added += 1
    if (!added) return
    setDraft("")
    showResultToast({ state: "success", title: t("myspace.focus.addedMany", { n: added }) })
  }

  return (
    <form onSubmit={submit} className="tasks-add">
      <label htmlFor={id} className="tasks-add-plus">
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} aria-hidden="true" />
        <span className="sr-only">{t("myspace.tasks.add")}</span>
      </label>
      <input
        ref={input}
        id={id}
        value={draft}
        maxLength={MAX_TITLE}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === "Escape" && draft) {
            e.stopPropagation()
            setDraft("")
          }
        }}
        placeholder={t("myspace.focus.placeholder")}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        className="tasks-add-input no-ios-zoom"
      />
      {draft.trim() && (
        <button type="submit" className="tasks-add-go" aria-label={t("myspace.tasks.add")}>
          <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2.4} />
        </button>
      )}
      <span id={`${id}-hint`} className="sr-only">
        {t("myspace.focus.addHint")}
      </span>
    </form>
  )
}
