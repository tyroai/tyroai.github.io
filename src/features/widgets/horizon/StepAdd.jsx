import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"

const MAX_STEP = 255

/**
 * Hedefe adım ekleme — Apple Hatırlatıcılar'ın listesindeki gibi satırın kendisi: Enter ekler,
 * alan boşalır ve odakta kalır (art arda yazılır). Boşken bir şey yapmaz. Daire adımların
 * işaret dairesiyle hizalı.
 */
export function StepAdd({ onAdd, disabled }) {
  const { t } = useLocale()
  const [text, setText] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (onAdd(text)) setText("")
      }}
      className="flex min-h-9 items-center gap-2.5 pointer-coarse:min-h-11"
    >
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-foreground/30 text-muted-foreground"
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-3" strokeWidth={2.2} />
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_STEP))}
        placeholder={t("widgets.horizon.addStep")}
        aria-label={t("widgets.horizon.addStep")}
        disabled={disabled}
        enterKeyHint="done"
        className="h-8 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-[0.8125rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/25 disabled:opacity-50 pointer-coarse:h-11"
      />
    </form>
  )
}
