import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import { ActionButton } from "@/features/feed/actions/ActionButton"
import { SaveButton } from "@/features/feed/actions/SaveButton"
import { useLocale } from "@/hooks/useLocale"
import { askAboutPost } from "@/lib/feedAsk"
import { writeFeedSeen } from "@/lib/feedSeen"
import { ago } from "./format"
import { WidgetEmpty } from "./WidgetEmpty"
import { FrameAction, WidgetFrame } from "./WidgetFrame"
import { formatCount } from "@/lib/intl-cache"
import { isolate } from "@/lib/bidi"

/**
 * Keşfet'ten sana özel — son ziyaretinden beri gelen iş bildirimlerinin en
 * yenileri (sidebar rozetinin aynı sorgusu, `useFeedFresh`); satır Keşfet'te
 * o bildirimi açar. Keşfet'e gitmeden: satırda TYRO ile özetle ve Kaydet
 * (Keşfet'in kendi düğmeleri, aynı kayıt), sayının yanında Hepsini gördüm —
 * görüldü damgası en yeni bildirime ilerler, sidebar rozeti de söner. Mini
 * kartta satır eylemleri yok (satır yine Keşfet'te açar), sayı kısa.
 */
export function FeedPicksWidget({ ctx, className }) {
  const { feedFresh, pageAccess } = ctx
  const { t, locale } = useLocale()
  if (!pageAccess.feed) return null
  const items = feedFresh.items ?? []
  const n = feedFresh.count ?? items.length
  const newest = items[0]?.received
  const markSeen = () => newest && writeFeedSeen(new Date(newest).toISOString())
  return (
    <WidgetFrame
      id="feed-picks"
      title={t("widgets.feed.title")}
      shortTitle={t("widgets.feed.titleShort")}
      icon={AiArtIcon}
      className={className}
      action={<FrameAction to="/feed">{t("widgets.feed.all")}</FrameAction>}
    >
      {items.length ? (
        <>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="min-w-0 text-[0.75rem] text-muted-foreground">
              <span className="@max-[16rem]/widget:hidden">
                {t("widgets.feed.count", { n: formatCount(locale, n) })}
              </span>
              <span className="hidden @max-[16rem]/widget:inline">
                {t("widgets.feed.countShort", { n: formatCount(locale, n) })}
              </span>
            </p>
            <button
              type="button"
              onClick={markSeen}
              className="shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] font-medium text-foreground/70 transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
            >
              {t("widgets.feed.markSeen")}
            </button>
          </div>
          <ul className="mt-1">
            {items.map((x) => {
              const subject = x.subject || t("feed.noSubject")
              return (
                <li
                  key={x.id}
                  className="-mx-2 flex items-center rounded-xl transition hover:bg-accent/60"
                >
                  <Link
                    to={`/feed?post=${encodeURIComponent(x.id)}`}
                    className="block min-w-0 flex-1 rounded-xl px-2 py-2"
                  >
                    <span className="block truncate text-[0.8125rem] font-medium">{subject}</span>
                    <span className="block truncate text-[0.6875rem] text-muted-foreground">
                      {[
                        x.tag && t(`feed.tag.${x.tag}`),
                        isolate(x.author),
                        ago(toDate(x.received), locale),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                  <span className="flex shrink-0 items-center pe-1 @max-[16rem]/widget:hidden">
                    <ActionButton
                      icon={<HugeiconsIcon icon={AiChat02Icon} strokeWidth={1.7} />}
                      label={t("feed.ask")}
                      aria-label={t("feed.actions.askAria", { subject })}
                      onClick={() => askAboutPost(x, t)}
                    />
                    <SaveButton post={x} />
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <WidgetEmpty icon={AiArtIcon}>{t("widgets.feed.none")}</WidgetEmpty>
      )}
    </WidgetFrame>
  )
}

const toDate = (v) => (v ? new Date(v) : null)
