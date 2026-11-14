import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/hooks/useLocale"
import { useMyCircle } from "@/hooks/useMyCircle"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { STATUS } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { useFeedLayout } from "../feedLayout"
import { StoryTile } from "../stories/StoryTile"
import { StoryViewer } from "../stories/StoryViewer"
import { MAX_STORIES, useStories } from "../stories/storyData"
import { useStripScroll } from "../stories/useStripScroll"
import "./feedMobile.css"
import "../feedDesktop.css"

const PHOTO = { size: 120 }

/** Şeridin kenar oku (yalnız masaüstü): devamı olan yanda, avatarların hizasında. */
function StripArrow({ icon, label, onClick, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-4 z-10 grid size-8 place-items-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 motion-reduce:transition-none pointer-coarse:size-11",
        className,
      )}
    >
      <HugeiconsIcon icon={icon} className="size-4" strokeWidth={2} />
    </button>
  )
}

/**
 * Popüler'in tepesindeki tebrik şeridi: doğum günleri, iş yıl dönümleri, yeni katılanlar.
 * Ekibindekiler en önde ve yeşil halkalı, bugünkünün halkası paletin renginde (`storyRing`).
 * Basınca hikâye görüntüleyicisi açılır (`stories/StoryViewer`): telefonda tam ekran, masaüstünde
 * (`social`, `feedLayout.js`) ortada kart. Sondaki "Tümü" bütün listeleri (`people`: rayın kartları)
 * telefonda alttan açılan, masaüstünde ortada bir pencerede gösterir; masaüstünde şerit kenar
 * oklarıyla kayar. Kimse yoksa şerit çizilmez.
 */
export function FeedStories({ celebrations, posts, now, onOpen, people, empty, initialOpen }) {
  const { t, locale } = useLocale()
  const { social } = useFeedLayout()
  const [sheet, setSheet] = useState(Boolean(initialOpen))
  // Açık hikâye ANAHTARLA tutulur: ekip bilgisi sonradan gelip sırayı değiştirirse görüntüleyici
  // aynı kişide kalır.
  const [viewing, setViewing] = useState(null)
  const circle = useMyCircle(celebrations.status === STATUS.ready)
  const stories = useStories(celebrations, posts, now, circle)
  const shown = stories.slice(0, MAX_STORIES)
  // 52 px avatar 3× ekranda ~156 px ister: 48'lik fotoğraf bulanık kalıyordu (kişi kartı 120 kullanır).
  const photos = usePeoplePhotos(shown.map((s) => s.mail).filter(Boolean), PHOTO)
  const loading = celebrations.status === "loading"
  const stripRef = useRef(null)
  // Radix Dialog tetiksiz açıldığı için kapanışta odağı kendimiz geri veririz.
  const returnTo = useRef(null)
  const allRef = useRef(null)
  const scroll = useStripScroll(stripRef, shown.length + (loading ? 1 : 0), social)
  if (!shown.length && !loading && !sheet) return null
  const view = viewing ? shown.findIndex((s) => s.key === viewing) : -1
  const lists = (
    <div className="flex flex-col gap-3 pb-2">
      {people}
      {empty}
    </div>
  )

  return (
    <section
      aria-label={t("feed.view.congrats")}
      data-tour="feed-stories"
      className={cn("-mx-4 @[40rem]/feed:mx-0", social && "relative")}
    >
      <ul
        ref={stripRef}
        className={cn(
          "flex gap-1 overflow-x-auto px-3 pb-1 pt-0.5 @[40rem]/feed:px-0",
          social ? "feed-strip-x gap-2 pb-2" : "feed-strip",
        )}
      >
        {shown.map((s) => (
          <li key={s.key} className="shrink-0">
            <StoryTile
              story={s}
              photo={photos.get(s.mail)}
              wide={social}
              onView={(el) => {
                returnTo.current = el
                setViewing(s.key)
              }}
              t={t}
              locale={locale}
            />
          </li>
        ))}
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <li
              key={`sk${i}`}
              aria-hidden="true"
              className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 pt-0.5"
            >
              <Skeleton className="size-[3.75rem] rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </li>
          ))}
        {(stories.length > 0 || loading) && (
          <li className="shrink-0">
            <button
              ref={allRef}
              type="button"
              onClick={() => setSheet(true)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl pb-1 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                social ? "w-20" : "w-[4.5rem]",
              )}
            >
              <span
                className={cn(
                  "grid place-items-center rounded-full border border-dashed shortest:size-[2.875rem] border-border bg-muted/50 text-foreground/70",
                  social ? "size-16" : "size-[3.75rem]",
                )}
              >
                <HugeiconsIcon icon={UserGroupIcon} className="size-5" strokeWidth={1.8} />
              </span>
              <span
                className={cn(
                  "w-full truncate text-center font-semibold text-foreground/85",
                  social ? "text-xs" : "text-[0.6875rem]",
                )}
              >
                {t("feed.all")}
              </span>
              {stories.length > 0 && (
                <span className="-mt-1 text-[0.6875rem] tabular-nums text-muted-foreground shortest:hidden">
                  {stories.length}
                </span>
              )}
            </button>
          </li>
        )}
      </ul>
      {social && scroll.start && (
        <StripArrow
          icon={ArrowLeft01Icon}
          label={t("feed.desktop.stories.prev")}
          onClick={() => scroll.page(-1)}
          className="start-0"
        />
      )}
      {social && scroll.end && (
        <StripArrow
          icon={ArrowRight01Icon}
          label={t("feed.desktop.stories.next")}
          onClick={() => scroll.page(1)}
          className="end-0"
        />
      )}
      {social ? (
        <Dialog open={sheet} onOpenChange={setSheet}>
          <DialogContent
            aria-describedby={undefined}
            className="gap-3 sm:max-w-md pointer-coarse:[&_[data-slot=dialog-close]]:size-11"
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              allRef.current?.focus()
            }}
          >
            <DialogTitle>{t("feed.view.congrats")}</DialogTitle>
            {lists}
          </DialogContent>
        </Dialog>
      ) : (
        <BottomSheet
          open={sheet}
          onOpenChange={setSheet}
          title={t("feed.view.congrats")}
          closeOnBack
        >
          {lists}
        </BottomSheet>
      )}
      {view >= 0 && (
        <StoryViewer
          stories={shown}
          photos={photos}
          index={view}
          onIndex={(i) => setViewing(shown[i].key)}
          onClose={() => setViewing(null)}
          onOpenPost={onOpen}
          returnTo={returnTo}
          full={!social}
        />
      )}
    </section>
  )
}
