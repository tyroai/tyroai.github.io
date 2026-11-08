import { useCallback, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { afterBackSettles, useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { StoryActions } from "./StoryActions"
import { STORY_ICON, storyCaption, storyContext, storyRing } from "./storyData"
import { useStoryGestures } from "./useStoryGestures"
import "../feedDesktop.css"

/** Her hikâyenin ekranda kalma süresi; fare üstündeyken, duraklatılınca ya da menü açıkken işlemez. */
const STEP_MS = 7000

const BTN =
  "grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
const SIDE =
  "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-popover text-foreground shadow-lg ring-1 ring-foreground/10 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 pointer-coarse:size-11"
// Kartı kaplayan önceki/sonraki bölgesi: sürükleme sayfayı kaydırmasın, basılı tutmak seçim açmasın.
const ZONE =
  "h-full touch-none select-none [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"

/**
 * Hikâye görüntüleyicisi (Instagram): üstte ilerleme çubukları, ortada halkalı avatar, altta Kutla.
 * Masaüstünde ortada tek kart ve yanlarda oklar; telefonda (`full`) tam ekran, Geri tuşu ve aşağı
 * çekmek kapatır. Kartın sol üçte biri önceki, kalanı sonraki hikâye (dokunuş, tık ya da Enter);
 * basılı tutmak duraklatır, yana kaydırmak geçer (`useStoryGestures`). ← → gezinir, Esc ve dışarı
 * tıklama kapatır (Radix Dialog: odak tuzağı ve odak dönüşü). Süre dolunca sonrakine geçer,
 * sonuncuda kapanır; fare üstündeyken, duraklatılınca ya da Kutla menüsü açıkken durur. Hareketi
 * azalt'ta otomatik geçiş yok (kullanıcı kendisi gezinir).
 */
export function StoryViewer({
  stories,
  photos,
  index,
  onIndex,
  onClose,
  onOpenPost,
  returnTo,
  full = false,
}) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [cycle, setCycle] = useState(0)
  const cardRef = useRef(null)
  const total = stories.length
  const s = stories[index]
  const last = index >= total - 1

  const go = useCallback(
    (next, auto = false) => {
      if (next >= total && auto) onClose()
      else if (next >= 0 && next < total) onIndex(next)
    },
    [total, onClose, onIndex],
  )
  // Telefonda son hikâyede "sonraki" kapatır (Instagram); masaüstünde son kartta bir şey yapmaz.
  const next = () => (last && full ? onClose() : go(index + 1))
  const prev = () => go(index - 1)
  const gestures = useStoryGestures({
    cardRef,
    onPrev: prev,
    onNext: next,
    onClose: full ? onClose : null,
  })
  useBackToClose(full, onClose)
  if (!s) return null

  const ctx = storyContext(t, locale, s)
  const chip = s.kind === "joiner" ? ctx?.text : storyCaption(t, s)
  const running = !(reduce || paused || hover || gestures.held)
  const advance = () => {
    // Menü ya da kişi kartı açıkken süre baştan başlar; kullanıcı onu okuyor.
    if (cardRef.current?.querySelector('[aria-expanded="true"]')) setCycle((c) => c + 1)
    else go(index + 1, true)
  }
  const onKeyDown = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.target instanceof Element && e.target.closest('[role="menu"]')) return
    if (e.key === "ArrowRight") go(index + 1)
    else if (e.key === "ArrowLeft") go(index - 1)
    else return
    e.preventDefault()
  }
  // Telefonda kapanış Geri adımını geri alır; gönderi o bittikten sonra açılır, yoksa geri alma
  // gönderinin adresini silerdi.
  const open = () => {
    onClose()
    afterBackSettles(() => onOpenPost(s.postId))
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onKeyDown={onKeyDown}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          returnTo?.current?.focus()
        }}
        className={cn(
          "gap-0 bg-transparent p-0 pb-0 ring-0 sm:max-h-none sm:pb-0",
          full
            ? "inset-0 top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none sm:max-w-none"
            : "w-96 overflow-visible",
        )}
      >
        <DialogTitle className="sr-only">{t("feed.view.congrats")}</DialogTitle>
        <div
          ref={cardRef}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
          onPointerLeave={() => setHover(false)}
          className={cn(
            "relative flex flex-col overflow-hidden bg-popover text-sm",
            full
              ? "h-full pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
              : "min-h-[min(34rem,calc(100dvh-4rem))] rounded-[1.75rem] shadow-2xl ring-1 ring-foreground/10",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand/[0.09] to-transparent"
          />
          <p role="status" aria-live="polite" className="sr-only">
            {[
              t("feed.desktop.story.position", { index: index + 1, total }),
              s.name,
              s.team && t("special.circle.team"),
              t(`person.ctx.${s.kind}`),
              chip,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div aria-hidden="true" className="pointer-events-none relative flex gap-1 px-4 pt-4">
            {stories.map((x, i) => (
              <span
                key={x.key}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/15"
              >
                <span
                  key={i === index ? `${index}-${cycle}` : "idle"}
                  onAnimationEnd={i === index ? advance : undefined}
                  className={cn(
                    "block h-full rounded-full bg-foreground",
                    i < index || (i === index && reduce) ? "w-full" : i > index && "w-0",
                    i === index && !reduce && "feed-story-fill w-full",
                  )}
                  style={
                    i === index && !reduce
                      ? {
                          animationDuration: `${STEP_MS}ms`,
                          animationPlayState: running ? "running" : "paused",
                        }
                      : undefined
                  }
                />
              </span>
            ))}
          </div>
          <div className="relative z-10 flex items-center gap-2 px-4 pt-2.5">
            <HugeiconsIcon
              icon={STORY_ICON[s.kind]}
              className="size-4 text-brand-ink"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span
              lang={locale}
              className="pointer-events-none min-w-0 flex-1 truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              {t(`person.ctx.${s.kind}`)}
            </span>
            {!reduce && (
              <button
                type="button"
                className={BTN}
                aria-pressed={paused}
                aria-label={t(paused ? "feed.desktop.story.play" : "feed.desktop.story.pause")}
                onClick={() => setPaused((p) => !p)}
              >
                <HugeiconsIcon
                  icon={paused ? PlayIcon : PauseIcon}
                  className="size-4"
                  strokeWidth={2}
                />
              </button>
            )}
            <DialogClose className={BTN} aria-label={t("feed.desktop.story.close")}>
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </DialogClose>
          </div>

          {/* Bölgeler kartın tamamını kaplar; avatar ve metin dokunuşu geçirir, başlık ve eylemler
              üstte (`z-10`). Başlıktan SONRA: açılışta odak duraklat düğmesine gitsin, bölgeye değil. */}
          <div className="absolute inset-0 z-0 flex">
            <button
              type="button"
              aria-label={t("feed.desktop.story.prev")}
              aria-disabled={index === 0}
              onClick={gestures.tap(prev)}
              {...gestures.bind}
              className={cn(ZONE, "w-1/3")}
            />
            <button
              type="button"
              aria-label={t(last && full ? "feed.desktop.story.close" : "feed.desktop.story.next")}
              aria-disabled={last && !full}
              onClick={gestures.tap(next)}
              {...gestures.bind}
              className={cn(ZONE, "flex-1")}
            />
          </div>
          <div className="pointer-events-none relative flex flex-1 flex-col items-center justify-center gap-1 px-6 py-6 text-center shortest:py-2">
            <span
              className={cn("relative grid place-items-center rounded-full p-[3px]", storyRing(s))}
            >
              <span className="grid place-items-center rounded-full bg-popover p-[3px]">
                <PersonAvatar
                  name={s.name}
                  photo={photos.get(s.mail)}
                  className={cn(
                    "[&>span:first-of-type]:text-3xl shortest:size-16 shortest:[&>span:first-of-type]:text-lg",
                    full ? "size-32" : "size-28",
                  )}
                />
              </span>
            </span>
            <p
              lang="tr"
              className={cn(
                "mt-3 font-semibold tracking-tight [overflow-wrap:anywhere] shortest:mt-1 shortest:text-lg",
                full ? "text-2xl" : "text-xl",
              )}
            >
              {s.name}
            </p>
            {s.title && (
              <p
                lang="tr"
                className="text-[0.8125rem] text-muted-foreground [overflow-wrap:anywhere]"
              >
                {s.title}
              </p>
            )}
            {(chip || s.team) && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 shortest:mt-1">
                {s.team && (
                  <span
                    lang={locale}
                    className="inline-flex h-7 items-center rounded-full bg-success/[0.1] px-3 text-xs font-semibold text-success-ink"
                  >
                    {t("special.circle.team")}
                  </span>
                )}
                {chip && (
                  <span
                    lang={locale}
                    className="inline-flex h-7 items-center rounded-full bg-brand/[0.1] px-3 text-xs font-semibold text-brand-ink"
                  >
                    {chip}
                  </span>
                )}
              </div>
            )}
          </div>

          <StoryActions story={s} context={ctx} onOpenPost={open} />
        </div>

        {!full && index > 0 && (
          <button
            type="button"
            className={cn(SIDE, "-start-14")}
            aria-label={t("feed.desktop.story.prev")}
            onClick={() => go(index - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" strokeWidth={2} />
          </button>
        )}
        {!full && index < total - 1 && (
          <button
            type="button"
            className={cn(SIDE, "-end-14")}
            aria-label={t("feed.desktop.story.next")}
            onClick={() => go(index + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" strokeWidth={2} />
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
