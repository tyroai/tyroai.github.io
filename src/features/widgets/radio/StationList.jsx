import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { FILLED } from "./radioStyles"
import { Equalizer, StationArt } from "./radioParts"
import { scrollBehavior } from "./useStationScroll"

const on = (radio, st) => radio.station?.id === st.id
const live = (radio, st) => on(radio, st) && radio.status === "playing"
const PAGER_BTN =
  "relative grid size-6 place-items-center rounded-full text-(--r-fg2) transition after:absolute after:-inset-2 pointer-coarse:after:content-[''] hover:bg-(--r-hover) hover:text-(--r-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--r-ring) aria-disabled:opacity-30 aria-disabled:hover:bg-transparent"

/** Koyu kartın sayfa çeviricisi (‹ 1/10 ›) — Pano'nun `Pager`ının aynısı, koyu zemine. */
export function RadioPager({ pager, label }) {
  const { t } = useLocale()
  if (pager.pages < 2) return null
  const first = pager.page === 0
  const last = pager.page === pager.pages - 1
  return (
    <span role="group" aria-label={label} className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-disabled={first || undefined}
        aria-label={t("widgets.pager.prev")}
        onClick={pager.prev}
        className={PAGER_BTN}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={2.2} />
      </button>
      <span
        aria-live="polite"
        className="min-w-[2rem] text-center text-[0.6875rem] font-medium tabular-nums text-(--r-fg2) @max-[18rem]/widget:sr-only"
      >
        {t("widgets.pager.of", { page: pager.page + 1, pages: pager.pages })}
      </span>
      <button
        type="button"
        aria-disabled={last || undefined}
        aria-label={t("widgets.pager.next")}
        onClick={pager.next}
        className={PAGER_BTN}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2.2} />
      </button>
    </span>
  )
}

/**
 * Geniş kartın sağ bölmesi — Spotify'ın kuyruğu gibi: kapak · ad, çalanda çubuklar, yakındakinde
 * konum glifi; favori kalbi üstüne gelince ya da odakta (dokunmatikte her zaman). Satıra
 * basmak çalar, çalana basmak duraklatır. `dense` (v2'nin dar boyu): satır 30px, kapak 24px,
 * çubuk ve konum glifi yok (ad sığsın; çalan satır zemininden belli).
 * Liste KAYAR (`useStationScroll`): kutu tam `rows` satır boyunda, satırlar kutuya oturur.
 * Klavyede tek sekme durağı (40 satırın 80 düğmesi sekmeyi doldurmasın): ok tuşları satırlar
 * arasında gezer, Home/End uçlara; etkin satır istasyonun KİMLİĞİYLE tutulur (favori başa
 * çıkınca sıra değişiyor). Çalan istasyon değişince (sonraki/önceki) görünür olur.
 */
export function StationList({
  stations,
  scroll,
  radio,
  onPlay,
  onFavorite,
  dense = false,
  className,
}) {
  const { el: box, setEl: bindBox, onScroll, swipe } = scroll
  const { t } = useLocale()
  const [activeId, setActiveId] = useState(null)
  const at = Math.max(
    0,
    stations.findIndex((st) => st.id === activeId),
  )
  const playingId = radio.station?.id

  // Çalan istasyon değişince (medya tuşu, sonraki/önceki) görünmüyorsa kutuya getir — her
  // istasyon için BİR kez: liste gezinirken favori eklemek kaydırmayı geri almasın.
  const shownFor = useRef(null)
  useEffect(() => {
    if (shownFor.current === playingId) return
    const ul = box
    const i = stations.findIndex((st) => st.id === playingId)
    const li = i >= 0 ? ul?.children[i] : null
    if (!ul || !li) return
    shownFor.current = playingId
    const top = li.offsetTop
    if (top >= ul.scrollTop && top + li.offsetHeight <= ul.scrollTop + ul.clientHeight) return
    ul.scrollTo({ top, behavior: scrollBehavior() })
  }, [playingId, stations, box])

  // Odaktaki satır yer değiştirince (favori başa çıktı) kutuda görünür kalsın.
  useEffect(() => {
    const li = document.activeElement?.closest?.("li")
    if (!box || !li || li.parentElement !== box) return
    if (
      li.offsetTop >= box.scrollTop &&
      li.offsetTop + li.offsetHeight <= box.scrollTop + box.clientHeight
    )
      return
    box.scrollTo({ top: li.offsetTop, behavior: scrollBehavior() })
  }, [stations, box])

  const moveTo = (i) => {
    const next = Math.max(0, Math.min(stations.length - 1, i))
    setActiveId(stations[next]?.id ?? null)
    box?.children[next]?.querySelector("button")?.focus()
  }
  const keys = {
    ArrowDown: () => moveTo(at + 1),
    ArrowUp: () => moveTo(at - 1),
    Home: () => moveTo(0),
    End: () => moveTo(stations.length - 1),
  }

  return (
    <ul
      ref={bindBox}
      onScroll={onScroll}
      {...swipe}
      onKeyDown={(e) => {
        if (!keys[e.key]) return
        e.preventDefault()
        keys[e.key]()
      }}
      aria-label={t("widgets.radio.stations")}
      className={cn(
        "relative flex min-w-0 shrink-0 snap-y snap-mandatory flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] pointer-coarse:overflow-y-hidden [&::-webkit-scrollbar]:hidden",
        // Tam satır boyu: 4 × 36 + 3 × 2 · dar boyda 3 × 30 + 2 × 2. `className`: başka kap
        // (Tyrofy sahnesinin listesi) boyu ve dokunmatik kaydırmayı kendisi verir.
        dense ? "h-[5.875rem]" : "h-[9.375rem]",
        className,
      )}
    >
      {stations.map((st, i) => (
        <li
          key={st.id}
          className={cn(
            "group/row flex min-w-0 shrink-0 snap-start items-center gap-1 rounded-xl pe-1 transition-colors hover:bg-(--r-hover)",
            dense ? "h-[1.875rem]" : "h-9",
            on(radio, st) && "bg-(--r-active)",
          )}
        >
          <button
            type="button"
            tabIndex={i === at ? 0 : -1}
            onFocus={() => setActiveId(st.id)}
            onClick={() => onPlay(st)}
            aria-label={t(
              live(radio, st) ? "widgets.radio.pauseNamed" : "widgets.radio.playNamed",
              {
                name: st.name,
              },
            )}
            aria-current={on(radio, st) || undefined}
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-xl ps-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--r-ring)"
          >
            <StationArt
              station={st}
              size="xs"
              className={dense ? "size-6 rounded-md" : undefined}
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-medium",
                dense ? "text-[0.8125rem]" : "text-[0.8125rem]",
                on(radio, st) ? "font-semibold text-(--r-fg)" : "text-(--r-fg)",
              )}
            >
              {st.name}
            </span>
            {st.near && !dense && (
              <HugeiconsIcon
                icon={Location01Icon}
                className="size-3 shrink-0 text-(--r-fg3)"
                strokeWidth={2}
              />
            )}
            {live(radio, st) && !dense && <Equalizer playing className="me-1 h-3" />}
          </button>
          <button
            type="button"
            tabIndex={i === at ? 0 : -1}
            onFocus={() => setActiveId(st.id)}
            onClick={() => onFavorite(st)}
            aria-pressed={Boolean(st.fav)}
            aria-label={t(st.fav ? "widgets.radio.unfavorite" : "widgets.radio.favorite")}
            className={cn(
              "relative grid shrink-0 place-items-center rounded-full transition hover:bg-(--r-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--r-ring) pointer-coarse:after:absolute",
              dense
                ? "size-6 pointer-coarse:after:-inset-2.5"
                : "size-7 pointer-coarse:after:-inset-2",
              st.fav
                ? "text-(--r-fg)"
                : "text-(--r-fg3) opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
            )}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              className={cn("size-3.5", st.fav && FILLED)}
              strokeWidth={1.9}
            />
          </button>
        </li>
      ))}
    </ul>
  )
}
