import { useMemo, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useLocale } from "@/hooks/useLocale"
import { useSheetDrag } from "@/hooks/useSheetDrag"
import { getNumberFormat } from "@/lib/intl-cache"
import { ReaderBar } from "./ReaderBar"
import { ReaderPane } from "./ReaderPane"
import { returnFocusTo } from "./postStamp"
import { usePostPager } from "./usePostPager"
import "./phoneReader.css"

/**
 * Keşfet gönderisinin telefon okuyucusu — Fotoğraflar / Instagram gibi tam ekran: üstte ince
 * çubuk (kapat · konum "3 / 24" ve önceki/sonraki · ⋯), ortada yatay kayan gönderiler (sabit şerit), altta
 * başparmağın yerinde eylem çubuğu (Beğen · TYRO ile özetle · Paylaş · Kaydet).
 * Yatay, çünkü dikey kaydırma gönderiyi OKUMAYA ait (gövde uzun bülten) ve korumalı çerçevenin
 * sonu sayfadan görülemez — "sona gelince sonrakine geç" kurulamaz. Gmail de postalar arasında
 * yatay kaydırır.
 * Gezinme adresi `replace` ile değiştirir (`useFeedNav`): Geri okuyucuyu tek adımda kapatır.
 * Üst çubuktan aşağı çekmek kapatır (`useSheetDrag`, uygulamanın çekmeceleriyle aynı).
 */
export function PhoneReader({
  post,
  photo,
  photoFor,
  open,
  onOpenChange,
  list,
  onNavigate,
  onAsk,
}) {
  const { t, locale } = useLocale()
  const opener = useRef(null)
  const { contentRef, overlayRef, grip } = useSheetDrag(() => onOpenChange(false))

  const at = list ? list.findIndex((p) => p.id === post.id) : -1
  const prev = at > 0 ? list[at - 1] : null
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null
  // Bütün liste sabit şeritte (sayfalar gezinmede yer değiştirmez — `usePostPager`); dolu olan
  // yalnız geçerli ve iki komşusu, ötekiler boş yer tutucu.
  const panes = at >= 0 ? list : [post]
  const here = Math.max(at, 0)
  const listKey = useMemo(() => list?.map((p) => p.id).join(" ") ?? "", [list])
  const layoutKey = at >= 0 ? listKey : post.id
  const { ref: pager, go } = usePostPager(post.id, layoutKey, onNavigate)
  const num = getNumberFormat(locale)
  const outlook = post.webLink ?? "https://outlook.office.com/mail/"

  function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return
    // Portaldaki menü ve pencerelerin tuşları React ağacından buraya kabarır: onlarda gezinme yok.
    if (!e.currentTarget.contains(e.target)) return
    const rtl = document.documentElement.dir === "rtl"
    const back = e.key === "k" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")
    const fwd = e.key === "j" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")
    const to = fwd ? next : back ? prev : null
    if (!to) return
    e.preventDefault()
    go(to.id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        overlayRef={overlayRef}
        side="bottom"
        showCloseButton={false}
        className="fr-sheet"
        // Sohbet rıhtımı da Escape dinliyor: okuyucuyu kapatan Escape rıhtımı kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        onOpenAutoFocus={() => {
          opener.current = document.activeElement
        }}
        onCloseAutoFocus={(e) => {
          returnFocusTo(e, post.id, opener.current)
          opener.current = null
        }}
      >
        <div {...grip} className="fr-top">
          <span aria-hidden="true" className="fr-grabber" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("feed.close")}
            className="fr-icon"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
          </button>
          {at >= 0 && (
            <div className="fr-nav">
              <NavButton
                icon={ArrowLeft01Icon}
                label={t("feed.prevPost")}
                target={prev}
                onGo={go}
              />
              {/* Konum her gezinmede okunur: ekran okuyucu hangi gönderide olduğunu bilir. */}
              <span aria-live="polite" className="fr-count">
                <span aria-hidden="true">
                  {num.format(at + 1)} / {num.format(list.length)}
                </span>
                <span className="sr-only">
                  {t("feed.reader.position", { at: at + 1, total: list.length })}
                </span>
              </span>
              <NavButton
                icon={ArrowRight01Icon}
                label={t("feed.nextPost")}
                target={next}
                onGo={go}
              />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={t("feed.reader.more")} className="fr-icon">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={outlook} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
                  {t("feed.openOutlook")}
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div ref={pager} className="fr-pager">
          {panes.map((p, i) =>
            Math.abs(i - here) <= 1 ? (
              <ReaderPane
                key={p.id}
                post={p}
                photo={p.id === post.id ? photo : photoFor?.(p)}
                active={p.id === post.id}
              />
            ) : (
              <section key={p.id} className="fr-pane" data-post-id={p.id} aria-hidden inert />
            ),
          )}
        </div>

        <ReaderBar key={post.id} post={post} onAsk={onAsk} />
      </SheetContent>
    </Sheet>
  )
}

/** Önceki/sonraki. Uçta `aria-disabled`: `disabled` düğme klavye odağını düşürür. */
function NavButton({ icon, label, target, onGo }) {
  return (
    <button
      type="button"
      onClick={() => target && onGo(target.id)}
      aria-disabled={!target || undefined}
      aria-label={label}
      className="fr-icon"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </button>
  )
}
