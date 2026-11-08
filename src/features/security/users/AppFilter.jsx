import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { SearchInput } from "@/features/security/primitives"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { catalogNameKey } from "@/lib/agentName"
import { fold } from "@/lib/fold"
import { cn } from "@/lib/utils"

/** Uygulama seçenekleri (arama + kutular + kaç kişide) — açılır ve telefon çekmecesi ortak. */
export function AppOptions({ options, value, onChange }) {
  const { t } = useLocale()
  const [query, setQuery] = useState("")
  const keys = new Set(value.map(catalogNameKey))
  const needle = fold(query)
  const shown = options.filter((o) => !needle || fold(o.name).includes(needle))
  const toggle = (name) =>
    onChange(
      keys.has(catalogNameKey(name))
        ? value.filter((v) => catalogNameKey(v) !== catalogNameKey(name))
        : [...value, name],
    )
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("authz.ws.editor.search")}
          className="max-w-none"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
          >
            {t("authz.ws.editor.none")}
          </button>
        )}
      </div>
      <ul className="max-h-72 overflow-y-auto overscroll-contain">
        {shown.map((o) => (
          <li key={o.name}>
            <label className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[0.8125rem] hover:bg-foreground/[0.04] pointer-coarse:min-h-12">
              <Checkbox
                checked={keys.has(catalogNameKey(o.name))}
                onCheckedChange={() => toggle(o.name)}
              />
              <span lang="tr" className="min-w-0 flex-1 truncate">
                {o.name}
              </span>
              <span className="tabular-nums text-xs text-muted-foreground">{o.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Masaüstü: "Uygulama" açılır düğmesi (çoklu seçim; seçim varken sayıyla). */
export function AppFilter({ options, value, onChange }) {
  const { t } = useLocale()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            value.length
              ? "bg-foreground/[0.07] text-foreground"
              : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
          )}
        >
          {value.length
            ? t("security.people.appFilterN", { n: value.length })
            : t("security.people.appFilter")}
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label={t("security.people.appFilter")}
        className="w-80 p-2"
      >
        <AppOptions options={options} value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
