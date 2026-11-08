import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useMailImages } from "@/hooks/useMailImages"
import { useLocale } from "@/hooks/useLocale"
import { formatAgo } from "@/lib/date"
import { askAboutPost } from "@/lib/feedAsk"
import { cn } from "@/lib/utils"
import { PostActions } from "./actions/PostActions"
import { FeedMarks } from "./FeedMarks"
import { useFeedLayout } from "./feedLayout"
import { FeedTag, ForYouTag } from "./FeedTag"
import { PostMedia } from "./timeline/PostMedia"

/**
 * Kart görüş alanına yaklaşınca bir kez `true` olur; kapak isteği ancak o zaman açılır
 * (yirmi kart için peşin istek ilk boyamaya yirmi Graph turu eklerdi). Kök sayfanın
 * kaydırıcısı: `rootMargin` yalnız kökün dikdörtgenine uygulanır.
 */
function useNearViewport(ref, scrollRoot) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { root: scrollRoot?.current ?? null, rootMargin: "300px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, near, scrollRoot])
  return near
}

/**
 * Akıştaki tek gönderi: avatar, kimlik satırı, başlık, özet, kapak ve eylemler (Beğen ·
 * Paylaş · TYRO ile özetle · Kaydet, `actions/PostActions`). Genişte Twitter tarzı (metin
 * avatarın sağında), darda (< 30rem) LinkedIn tarzı: avatar ve kimlik üstte, metin ve kapak
 * kartın tam genişliğinde.
 * Sosyal kipte (`feedLayout.js`, kap ≥ 40rem) her gönderi kendi kartı: başlıkta avatar, ad ve
 * "kanal · zaman" iki satırda, gövde ve kapak tam genişlikte, eylemler ince çizginin altında
 * (LinkedIn düzeni); telefonun ayraçlı satırları değişmez.
 * Satırın tamamı okuma penceresini açar (gerilmiş kaplama, `z-[1]`); kişi kartı ve
 * eylemler kaplamanın üstünde (`z-10`), iç içe düğme yok.
 * Kapak kapısı `hasAttachments` değil: Graph gövdeye gömülü (`cid:`) görselde o
 * bayrağı yakmaz. Kişisel (işaretli) postada kapak aranmaz.
 */
export function FeedPostCard({ post, photo, now, scrollRoot, onOpen }) {
  const { t, locale } = useLocale()
  const ref = useRef(null)
  const near = useNearViewport(ref, scrollRoot)
  const images = useMailImages(post.id, near && !post.personal, "hero")
  const hero = images?.[0] ?? null
  const subject = post.subject || t("feed.noSubject")
  const { social } = useFeedLayout()

  return (
    <article
      ref={ref}
      data-post-id={post.id}
      className={cn(
        "@container/post group/post relative transition-colors hover:bg-accent/30 focus-within:bg-accent/30 has-[>button:active]:bg-accent/40",
        social ? "ms-surface overflow-hidden rounded-[1.5rem] px-5 pb-2 pt-4" : "px-4 py-3.5",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(post.id)}
        className="absolute inset-0 z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        <span className="sr-only">{`${subject} — ${t("feed.readMore")}`}</span>
      </button>

      <PersonPopover person={{ name: post.author, address: post.address }}>
        {(trigger) => (
          <div
            className={cn(
              "grid items-center gap-x-3",
              social
                ? "grid-cols-[2.75rem_minmax(0,1fr)]"
                : "grid-cols-[2.5rem_minmax(0,1fr)] @[30rem]/post:items-start",
            )}
          >
            {/* Avatar yalnız işaretçi için: aynı kartı açan ad düğmesi erişilebilir olan (baş harfler
                adla uyuşmazdı, klavyede de aynı yere iki durak olurdu). Dokunmatikte görünmez pay. */}
            <button
              {...trigger}
              aria-hidden="true"
              tabIndex={-1}
              className="relative z-10 grid shrink-0 rounded-full transition hover:brightness-95 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
            >
              <PersonAvatar
                name={post.author}
                photo={photo}
                className={social ? "size-11" : "size-10"}
              />
            </button>
            {/* Dar kartta kimlik iki satır (ad · kanal + zaman): ad kırpılmaz. */}
            <div
              className={cn(
                "flex min-w-0 flex-col gap-0.5",
                !social &&
                  "@[30rem]/post:flex-row @[30rem]/post:items-center @[30rem]/post:gap-x-1.5",
              )}
            >
              <button
                {...trigger}
                data-private=""
                className={cn(
                  "relative z-10 min-h-[24px] min-w-0 max-w-full self-start truncate rounded text-left font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3",
                  social ? "text-[0.9375rem]" : "text-[0.8125rem] @[30rem]/post:self-auto",
                )}
              >
                <bdi>{post.author}</bdi>
              </button>
              <div className="flex min-w-0 items-center gap-x-1.5">
                {post.tag ? <FeedTag tag={post.tag} accent={post.accent} /> : <ForYouTag />}
                <span aria-hidden="true" className="text-muted-foreground/50">
                  ·
                </span>
                {/* `now` dakikada bir değişir: göreli zaman uzun açık kalan akışta donmasın. */}
                <time
                  key={now}
                  dateTime={post.received?.toISOString()}
                  className="shrink-0 text-[0.75rem] text-muted-foreground"
                >
                  {formatAgo(post.received, locale)}
                </time>
                <FeedMarks post={post} />
                {post.hasAttachments && (
                  <span
                    title={t("feed.hasAttachment")}
                    className="inline-flex shrink-0 items-center rounded-md bg-muted px-1 py-px leading-4 text-muted-foreground"
                  >
                    <HugeiconsIcon icon={Attachment01Icon} className="size-3" strokeWidth={2.2} />
                    <span className="sr-only">{t("feed.hasAttachment")}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Darda gövde iki sütunu kaplar (avatarın altından başlar), genişte metin sütununda. */}
            <div
              className={cn(
                "col-span-2 min-w-0",
                social
                  ? "mt-3"
                  : "mt-2 @[30rem]/post:col-span-1 @[30rem]/post:col-start-2 @[30rem]/post:mt-0.5",
              )}
            >
              <h2
                dir="auto"
                data-private=""
                className={cn(
                  "line-clamp-2 font-semibold leading-snug tracking-[-0.01em] text-foreground",
                  social ? "text-base" : "text-[0.9375rem]",
                )}
              >
                {subject}
              </h2>
              {post.preview && (
                <p
                  dir="auto"
                  data-private=""
                  className={cn(
                    "mt-1 line-clamp-3 leading-relaxed text-muted-foreground",
                    social ? "text-sm" : "text-[0.8125rem]",
                  )}
                >
                  {post.preview}
                </p>
              )}
              {hero && <PostMedia src={hero.dataUrl} ratio={hero.ratio} />}

              {/* Eylem satırı gönderinin hemen altında, metinle aynı hizada (ikon payı kadar
                  dışarı); kaydet içerik sütununun SONUNDA — genişlik sınırı onu kartın ortasında
                  bırakıyordu. "Outlook'ta aç" okuma bölmesinde, kartta tekrar etmez. */}
              <div className={cn(social && "-mx-5 mt-3 border-t border-border/60 px-5 pt-1.5")}>
                <PostActions
                  post={post}
                  onAsk={() => askAboutPost(post, t)}
                  className={cn("-mx-2.5", !social && "mt-1.5")}
                />
              </div>
            </div>
          </div>
        )}
      </PersonPopover>
    </article>
  )
}
