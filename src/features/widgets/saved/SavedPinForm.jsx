import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PinIcon from "@hugeicons/core-free-icons/PinIcon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cleanQuery, MIN_QUERY } from "@/features/widgets/lib/savedSearch"
import { cn } from "@/lib/utils"

const CHIP =
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Arama iğneleme: alan + iğne düğmesi (Enter de iğneler) ve dilin hazır önerileri (CoA,
 * konşimento, sertifika…); listede olan öneri çıkmaz.
 */
export function SavedPinForm({ saved, onPin, className }) {
  const { t } = useLocale()
  const [text, setText] = useState("")
  const ok = cleanQuery(text).length >= MIN_QUERY
  const taken = new Set(saved.map((s) => s.q.toLocaleLowerCase()))
  const suggestions = t("widgets.saved.suggestions")
    .split("|")
    .filter((s) => s && !taken.has(s.toLocaleLowerCase()))
  return (
    <div className={cn("space-y-2", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!ok) return
          onPin(text)
          setText("")
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("widgets.saved.placeholder")}
          aria-label={t("widgets.saved.inputLabel")}
          enterKeyHint="done"
          className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-transparent px-3 text-[0.8125rem] outline-none placeholder:text-muted-foreground focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/25 pointer-coarse:h-11"
        />
        <button
          type="submit"
          disabled={!ok}
          aria-label={t("widgets.saved.pinAria")}
          title={t("widgets.saved.pinAria")}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-fill-deep text-brand-on-brand transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
        >
          <HugeiconsIcon icon={PinIcon} className="size-4" strokeWidth={2} />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onPin(s)} className={CHIP}>
              <HugeiconsIcon icon={PlusSignIcon} className="size-3" strokeWidth={2.2} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
