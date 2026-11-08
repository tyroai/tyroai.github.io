import { Component } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { isChunkLoadError } from "@/lib/chunkError"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

function WidgetCrash({ className, onRetry }) {
  const { t } = useLocale()
  return (
    <div
      role="alert"
      className={cn(
        "ms-surface flex h-full flex-col items-center justify-center gap-2 rounded-[1.75rem] p-5 text-center",
        className,
      )}
    >
      <HugeiconsIcon
        icon={Alert02Icon}
        className="size-5 text-muted-foreground"
        strokeWidth={1.8}
      />
      <p className="text-[0.8125rem] text-muted-foreground">{t("widgets.crash.title")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full px-3 py-1 text-[0.75rem] font-medium text-brand-ink transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        {t("widgets.crash.retry")}
      </button>
    </div>
  )
}

/**
 * Kartın kendi hata sınırı: bir widget çizilirken çökerse yalnız o kart "Bu kart açılamadı" der,
 * Anasayfa ayakta kalır (sayfa sınırı sayfanın kendi hatası için). "Yeniden dene" kartı baştan
 * çizer. Parça yüklenemediyse (yeni sürüm) hata sayfa sınırına geçer: orada bir kez yenilenir.
 */
export class WidgetBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) console.error(`[ErrorBoundary:widget] ${this.props.id}`, error)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (isChunkLoadError(error)) throw error
    return (
      <WidgetCrash
        className={this.props.className}
        onRetry={() => this.setState({ error: null })}
      />
    )
  }
}
