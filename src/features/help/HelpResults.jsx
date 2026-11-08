import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import SearchRemoveIcon from "@hugeicons/core-free-icons/SearchRemoveIcon"
import { useLocale } from "@/hooks/useLocale"

const QUIET =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

/** Sonuçların sonunda sessiz satır: aranan cümle genel asistana sorulur (sohbet rıhtımında). */
export function AskTyroRow({ query, onAsk }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      onClick={onAsk}
      className="-mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-start text-sm text-foreground/85 outline-none transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-14"
    >
      <HugeiconsIcon
        icon={AiChat02Icon}
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
      <span className="min-w-0 flex-1 truncate">{t("help.ask.query", { query })}</span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground/60 rtl:rotate-180"
      />
    </button>
  )
}

/** Sonuç yok: tek cümle + sonraki adımlar (temizle · TYRO'ya sor); destek bölümü hemen altta. */
export function NoResults({ onClear, onAsk }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/40 px-5 py-8 text-center dark:bg-white/[0.04]">
      <HugeiconsIcon
        icon={SearchRemoveIcon}
        aria-hidden="true"
        className="size-6 text-muted-foreground"
        strokeWidth={1.6}
      />
      <div className="space-y-1">
        <p className="text-sm font-medium">{t("help.search.empty")}</p>
        <p className="mx-auto max-w-md text-[0.8125rem] leading-relaxed text-muted-foreground">
          {t("help.search.emptyHint")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAsk}
          className={`${QUIET} bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]`}
        >
          <HugeiconsIcon
            icon={AiChat02Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />
          {t("help.ask.cta")}
        </button>
        <button
          type="button"
          onClick={onClear}
          className={`${QUIET} text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground`}
        >
          {t("help.search.clear")}
        </button>
      </div>
    </div>
  )
}
