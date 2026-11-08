import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { actionButtonClass } from "@/components/common/actionButtonClass"
import { useLocale } from "@/hooks/useLocale"
import { PostActions } from "../actions/PostActions"

/**
 * Okuma bölmesinin ALT çubuğu (masaüstü ve tablet; telefonda `PhoneReader`): okuduktan sonra
 * yapılan işler başparmağın/gözün bittiği yerde — solda kartın satırı (Beğen · TYRO ile özetle ·
 * Paylaş · Kaydet, durum ortak), sağda önceki · "3 / 24" · sonraki ve "Outlook'ta aç". Ürün sahibi:
 * eylemler ve gezinme üstte durunca sosyal okuyucu hissi yoktu. Bölmenin dibine yapışık.
 */
export function ReaderFooter({ post, onAsk, at, total, prev, next, onNavigate }) {
  const { t } = useLocale()
  const outlook = post.webLink ?? "https://outlook.office.com/mail/"
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/70 bg-background/95 px-5 py-2.5 backdrop-blur sm:px-6">
      <PostActions post={post} onAsk={onAsk} className="-ms-2.5 min-w-0 gap-3" />
      <div className="ms-auto flex shrink-0 items-center gap-controls">
        {total > 1 && (
          <div className="flex items-center gap-0.5" aria-label={t("feed.reader.nav")} role="group">
            <ActionButton
              tone="plain"
              size="toolbar"
              iconOnly
              aria-label={t("feed.prevPost")}
              title={`${t("feed.prevPost")} (K)`}
              aria-disabled={!prev || undefined}
              className="aria-disabled:pointer-events-none aria-disabled:opacity-35"
              onClick={() => prev && onNavigate?.(prev.id)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </ActionButton>
            <span
              aria-live="polite"
              className="min-w-12 text-center text-callout tabular-nums text-muted-foreground"
            >
              <span className="sr-only">{t("feed.reader.position", { at: at + 1, total })}</span>
              <span aria-hidden="true">
                {at + 1} / {total}
              </span>
            </span>
            <ActionButton
              tone="plain"
              size="toolbar"
              iconOnly
              aria-label={t("feed.nextPost")}
              title={`${t("feed.nextPost")} (J)`}
              aria-disabled={!next || undefined}
              className="aria-disabled:pointer-events-none aria-disabled:opacity-35"
              onClick={() => next && onNavigate?.(next.id)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </ActionButton>
          </div>
        )}
        <a
          href={outlook}
          target="_blank"
          rel="noopener noreferrer"
          className={actionButtonClass({ tone: "soft", size: "toolbar" })}
        >
          {t("feed.openOutlook")}
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}
