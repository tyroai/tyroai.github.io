import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"

/** Outlook'ta seninle paylaşılmış ama listede olmayan takvimler — "Ekle". */
export function SuggestionList({ suggestions, onAdd, label, limit = 3 }) {
  const { t } = useLocale()
  return (
    <section aria-label={label}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground/60">
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {suggestions.slice(0, limit).map((p) => (
          <li key={p.address} className="flex min-h-10 items-center gap-2.5">
            <PersonAvatar name={p.name} className="size-7 text-[0.6875rem]" />
            <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{p.name}</span>
            <button
              type="button"
              onClick={() => onAdd(p)}
              aria-label={t("widgets.shared.addPerson", { name: p.name })}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {t("widgets.shared.addOne")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
