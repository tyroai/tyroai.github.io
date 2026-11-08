import "@/lib/i18n/onenote"
import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useSlow } from "@/components/onenote/useSlow"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useOneNotePages } from "@/hooks/useOneNotePages"
import { STATUS } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { WidgetOverlay } from "../WidgetOverlay"
import { PageBody, Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { useAtLeast } from "./hooks/useAtLeast"
import { NotebookMenu } from "./NotebookMenu"
import { OneNoteHero } from "./OneNoteHero"
import { OneNoteReader } from "@/components/onenote/OneNoteReader"
import { OneNoteRow } from "./OneNoteRow"
import { filterPages, notebooksOf } from "@/lib/onenote/onenotePages"
import "./onenote.css"

// Gövde bu genişliğin altındaysa yalnız liste; üstünde solda son sayfanın kâğıdı (geniş kart).
const HERO_PX = 352
const ROWS = 3

/** Yüklenirken iskelet; 4 sn'yi aşarsa tek cümle ("Biraz uzun sürüyor…"): iskelet "takıldı mı?" dedirtir. */
function Loading({ listOnly }) {
  const { t } = useLocale()
  const slow = useSlow()
  if (slow) return <WidgetEmpty icon={NotebookTabsIcon}>{t("onenote.slow")}</WidgetEmpty>
  return (
    <div aria-hidden="true" className={cn("on-skeleton", !listOnly && "has-hero")}>
      {!listOnly && <span className="ms-skeleton on-skeleton-hero" />}
      <span className="on-skeleton-rows">
        {Array.from({ length: ROWS }, (_, i) => (
          <span key={i} className="ms-skeleton" />
        ))}
      </span>
    </div>
  )
}

/**
 * OneNote — son düzenlenen sayfalar (en yeni önce): başlık, ne zaman, Defter › Bölüm. Başlıktaki
 * ad defter filtresidir (Tüm defterler · tek defter; altta Yenile). Satır sayfayı uygulamanın
 * içinde, kilitli çerçevede açar (`OneNoteReader`). Geniş kartta en son sayfa solda kâğıt gibi,
 * ilk satırlarıyla. Yalnız okur (`Notes.Read`); yoklama yok — açılışta bir istek, gerisi Yenile.
 * Büyük hesapta liste parça parça gelir (`useOneNotePages`): son sayfaya varınca sıradaki parça
 * istenir. Okunamazsa neden ve kod kartta (`ErrorCause`).
 */
export default function OneNoteWidget({ className }) {
  const { t } = useLocale()
  const res = useOneNotePages()
  const [notebook, setNotebook] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reading, setReading] = useState(null)
  const bodyRef = useRef(null)
  const listOnly = !useAtLeast(bodyRef, HERO_PX)
  const pages = res.pages
  const notebooks = useMemo(() => notebooksOf(pages), [pages])
  const shown = useMemo(() => filterPages(pages, notebook), [pages, notebook])
  const active = notebooks.find((nb) => nb.id === notebook) ?? null
  const hero = !listOnly && shown.length > 1 ? shown[0] : null
  const pager = usePager(hero ? shown.slice(1) : shown, ROWS)
  const now = useMinuteNow().getTime()
  const title = t("widgets.onenote.title")
  const loading = res.status === "loading"
  const canFilter = notebooks.length > 1

  // Büyük hesapta liste parça parça gelir: son sayfaya varınca sıradaki parça istenir. Liste boyu başına
  // bir kez: süzülen defterden yeni sayfa gelmezse (boy aynı) milyon notu zincirleme çekmez.
  const asked = useRef(-1)
  const { hasMore, loadingMore, moreError, loadMore } = res
  useEffect(() => {
    if (!hasMore || loadingMore || moreError) return
    if (pager.pages < 2 || pager.page < pager.pages - 1 || asked.current === shown.length) return
    asked.current = shown.length
    loadMore()
  }, [hasMore, loadingMore, moreError, loadMore, pager.page, pager.pages, shown.length])

  const pick = (id) => {
    setNotebook(id)
    setMenuOpen(false)
  }
  // Okuyucu kapanınca odak açan satıra döner (klavyeyle gezen yerini kaybetmesin).
  const opener = useRef(null)
  const openPage = (page) => {
    opener.current = document.activeElement
    setReading(page)
  }
  const closeReader = () => {
    setReading(null)
    const el = opener.current
    requestAnimationFrame(() => el?.isConnected && el.focus())
  }
  const refresh = () => {
    setMenuOpen(false)
    asked.current = -1
    res.refresh()
  }

  // Başlık defter seçicidir: seçili defterin adı ya da "OneNote", yanında küçük ok.
  const heading = canFilter ? (
    <WidgetOverlay
      title={t("onenote.filter")}
      open={menuOpen}
      onOpenChange={setMenuOpen}
      align="start"
      trigger={
        <button
          type="button"
          className="on-heading"
          title={active?.name || t("onenote.all")}
          aria-label={`${title}: ${active?.name || t("onenote.all")}`}
        >
          <span dir="auto" className="truncate">
            {active?.name || title}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="on-heading-chev" strokeWidth={2.2} />
        </button>
      }
    >
      <NotebookMenu
        notebooks={notebooks}
        total={pages.length}
        value={notebook}
        onPick={pick}
        onRefresh={refresh}
        busy={loading}
      />
    </WidgetOverlay>
  ) : null

  return (
    <WidgetFrame
      id="onenote"
      title={title}
      heading={heading}
      icon={NotebookTabsIcon}
      busy={loading}
      className={className}
      pager={<Pager pager={pager} label={title} />}
    >
      <div ref={bodyRef} className="on-body">
        {loading ? (
          <Loading listOnly={listOnly} />
        ) : res.status === STATUS.denied ? (
          <WidgetEmpty icon={LockKeyIcon} hint={t("onenote.deniedHint")}>
            {t("onenote.denied")}
          </WidgetEmpty>
        ) : res.status !== STATUS.ready ? (
          <>
            <WidgetEmpty
              icon={NotebookTabsIcon}
              action={
                <button type="button" onClick={res.refresh} className="on-text-btn">
                  {t("onenote.retry")}
                </button>
              }
            >
              {t("onenote.error")}
            </WidgetEmpty>
            {/* Neden cümlesi ve kod (BT'ye iletilir): "okunamadı" tek başına işe yaramıyordu. */}
            <ErrorCause detail={res.detail} className="mt-0 pb-1" />
          </>
        ) : !shown.length ? (
          <WidgetEmpty icon={NotebookTabsIcon}>{t("onenote.empty")}</WidgetEmpty>
        ) : (
          <div className={cn("on-layout", hero && "has-hero")}>
            {hero && <OneNoteHero page={hero} now={now} onOpen={openPage} />}
            <PageBody pager={pager} className="on-list">
              {pager.items.map((p) => (
                <OneNoteRow key={p.id} page={p} now={now} onOpen={openPage} />
              ))}
            </PageBody>
          </div>
        )}
      </div>
      <OneNoteReader page={reading} onClose={closeReader} />
    </WidgetFrame>
  )
}
