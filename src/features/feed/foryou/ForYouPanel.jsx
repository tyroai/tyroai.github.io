import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useMailHandoff } from "@/features/feed/hooks/useMailHandoff"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { searchPosts } from "@/lib/feed"
import { MARKS, buildLanes, matchesMark } from "@/features/feed/lib/forYouBoard"
import { STATUS } from "@/lib/graph"
import { pluralKey } from "@/lib/intl-cache"
import { FeedStateCard } from "../timeline/FeedStateCard"
import { ForYouList } from "./ForYouList"
import { ForYouSkeleton } from "./ForYouSkeleton"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  KEŞFET › SANA ÖZEL — işaretli postaların panosu (2026-10-01)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * İstek: *"dosyalarım ve sana özel sekmesinde de aynı şekilde yapmalıyız —
 * ferah, canlı, enerjik, bentolu; tüm fonksiyonlar kalsın"*.
 *
 *   KART   sayım + zarflı maskot; beyaz tepside "Sıradaki" (bir sonraki iş, tek
 *          dokunuş) ve Sabitlenmiş · Bayraklı · Yüksek önem — her biri süzgeç kapısı
 *   LİSTE  raf (sabitliler, kart) · bayraklı · yüksek önem (satır)
 *
 * ⚠️ TEK KART (2026-10-02, istek: *"resimdeki kısmı birleştir, ferah ve
 * compact"*): üç kutucuk kartın tepsisine girdi; liste başı 1440×900'de
 * 652 → ~470 px.
 *
 * Veri `useImportantMail`den (FeedPage — Akışım sekmesiyle ORTAK, yeni istek
 * YOK). Süzgeç adreste (`?mark=`, replace): kutucuğa basınca liste o işarete
 * daralır ve görünen sayı kutucuğunkine eşittir. Arama (Keşfet'in kutusu)
 * yalnız LİSTEYİ süzer; pano süzülmemiş hâli anlatır.
 *
 * ⚠️ "Sıradaki" ve To-Do'ya devredilenler OTURUM KAYDINDA (`features/feed/lib/forYouSession.js`)
 * — sekme değişince sıfırlanmasın, çıkışta düşsün.
 */

export function ForYouPanel({
  state,
  query,
  now,
  onOpen,
  onConnect,
  onRetry,
  onClearQuery,
  todoOpen,
}) {
  const { t, locale } = useLocale()
  const [params, setParams] = useSearchParams()
  const rawMark = params.get("mark")
  const mark = MARKS.includes(rawMark) ? rawMark : null
  const items = useMemo(() => state.items ?? [], [state.items])
  const searched = useMemo(() => searchPosts(items, query), [items, query])
  const listed = useMemo(
    () => (mark ? searched.filter((m) => matchesMark(m, mark)) : searched),
    [searched, mark],
  )
  const lanes = useMemo(() => buildLanes(listed), [listed])
  const addresses = useMemo(
    () => [...new Set(items.map((m) => m.address).filter(Boolean))],
    [items],
  )
  const photos = usePeoplePhotos(addresses)
  const handoff = useMailHandoff()
  const titleRef = useRef(null)
  const [freshId, setFreshId] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const loading = state.status === "loading"
  const ready = state.status === STATUS.ready
  const showList = ready && items.length > 0

  /** To-Do'ya giden satırın kısa ışığı. */
  function done(id) {
    setFreshId(id)
    timers.current.push(setTimeout(() => setFreshId((cur) => (cur === id ? null : cur)), 1600))
  }
  /** Çipteki ✕: süzgeç kalkar (adresteki `?mark=`). */
  function clearMark() {
    const p = new URLSearchParams(params)
    p.delete("mark")
    setParams(p, { replace: true })
  }
  const announce = loading
    ? t("myspace.loading")
    : ready
      ? t(pluralKey("feed.important.countAnnounce", locale, listed.length), { n: listed.length })
      : ""

  if (loading) return <ForYouSkeleton />

  // Kart yok (istek üzerine kaldırıldı): liste yoksa durumu sade bir kart söyler — bağlantı yok,
  // okunamadı ya da işaretli posta yok. Eylem (Bağlan / Yeniden dene) kartın eski yuvasındaki gibi.
  if (!showList) {
    const denied = state.status === STATUS.denied
    const error = state.status === STATUS.error
    return (
      <div className="@container/foryou min-w-0 pb-20">
        <p role="status" aria-live="polite" className="sr-only">
          {announce}
        </p>
        <FeedStateCard
          icon={ready ? Mail01Icon : Alert02Icon}
          title={t(
            ready
              ? "feed.important.empty"
              : denied
                ? "feed.denied"
                : error
                  ? "feed.important.error"
                  : "feed.signedOut",
          )}
          body={t(
            ready
              ? "feed.important.emptyBody"
              : denied
                ? "feed.important.deniedBody"
                : error
                  ? "feed.important.errorBody"
                  : "feed.important.signedOutBody",
          )}
          cause={denied || error ? state.detail : null}
          action={denied ? t("feed.connect") : error ? t("feed.retry") : null}
          onAction={denied ? onConnect : onRetry}
        />
      </div>
    )
  }

  return (
    <div className="@container/foryou min-w-0">
      <div className="pb-20">
        <p role="status" aria-live="polite" className="sr-only">
          {announce}
        </p>
        <section id="foryou-list" aria-labelledby="foryou-list-title" className="scroll-mt-4">
          <ForYouList
            state={state}
            lanes={lanes}
            listed={listed}
            mark={mark}
            query={query}
            now={now}
            photos={photos}
            freshId={freshId}
            handoff={handoff}
            todoOpen={todoOpen}
            titleRef={titleRef}
            onOpen={onOpen}
            onDone={done}
            onClearMark={clearMark}
            onClearQuery={onClearQuery}
          />
        </section>
      </div>
    </div>
  )
}
