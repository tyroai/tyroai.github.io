import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { Kbd } from "@/components/ui/kbd"
import { useLocale } from "@/hooks/useLocale"

// Mac'te ⌘, öbürlerinde Ctrl — kısayol ipucu kullanıcının klavyesiyle yazılsın.
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "")

/**
 * Header'daki Ara… — Spotlight'ı açan düğme (geniş ekranda; dar ekranda header'ın arama simgesi).
 * Pencere ve içeriği Ctrl/⌘+K ile AYNI (`CommandPalette` › `Spotlight`).
 */
export function HeaderSearch({ onOpen }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      onClick={onOpen}
      data-tour="search"
      aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      className="relative ml-auto hidden h-9 items-center gap-2 rounded-xl border border-input/80 bg-background/60 px-3 text-sm text-muted-foreground shadow-xs transition hover:border-input hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex sm:w-56 lg:w-72 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1"
    >
      <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0" />
      {/* Ad görünen yazıyla başlar (sesle "Ara" diyen bulsun); açıklama yalnız ekran okuyucuya. */}
      <span className="flex-1 truncate text-left">{t("header.search")}</span>
      <span className="sr-only"> — {t("header.searchAria")}</span>
      <Kbd aria-hidden="true" className="hidden text-foreground/75 lg:inline-flex">
        {isMac ? "⌘K" : "Ctrl K"}
      </Kbd>
    </button>
  )
}
