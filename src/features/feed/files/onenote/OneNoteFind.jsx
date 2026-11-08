import "@/lib/i18n/onenote"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import NoteAddIcon from "@hugeicons/core-free-icons/NoteAddIcon"
import { ActionButton } from "@/components/common/ActionButton"
import { OneNoteNewPage } from "@/components/onenote/OneNoteNewPage"
import { OneNoteReader } from "@/components/onenote/OneNoteReader"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useOneNotePages } from "@/hooks/useOneNotePages"
import { fold } from "@/lib/fold"
import { STATUS } from "@/lib/graph"
import { groupBySection, isUngrouped } from "@/lib/onenote/onenoteGroups"
import { pagesOfTarget, searchPages } from "@/lib/onenote/onenoteItem"
import { notebooksOf } from "@/lib/onenote/onenotePages"
import { FileGroup } from "../FileRow"
import { RowsSkeleton, StateRow } from "../FilesStates"
import { SectionTitle } from "../FilesViews"
import { getOneNoteFocus, setOneNoteFocus, subscribeOneNoteFocus } from "./oneNoteFocus"
import { NotebookPicker } from "./NotebookPicker"
import { OneNoteMore, SlowHint } from "./OneNoteLoadParts"
import { OneNotePageRow } from "./OneNotePageRow"
import { OneNoteSections } from "./OneNoteSections"
import { useAskPage } from "./useAskPage"

/**
 * Bul › ONENOTE — son düzenlenen sayfalar (en yeni önce; OneNote kartıyla aynı kanca ve önbellek:
 * `useOneNotePages`: hızlı hesapta tek istekte en çok 100, büyük hesapta parça parça ve listenin
 * sonunda "Daha fazla göster"), OneNote gibi defter › bölüm gruplu (`OneNoteSections`). Okunamazsa
 * neden ve kod ekranda (`ErrorCause`). Kutu başlıkta, defter ve bölüm
 * adında süzer (istemcide; OneNote'un sunucu araması yok). Defter seçici başlıkta; dosya
 * listesinden gelen defter/bölüm süzgeci (`oneNoteFocus`) çip olarak görünür ve kaldırılır.
 * Satır sayfayı uygulamanın içinde, ortak okuyucuda açar (metin + görseller); TYRO satırda ve
 * okuyucuda. Bölüm dosyasından gelindiyse en yeni sayfası hemen açılır.
 */
export default function OneNoteFind({ text, now }) {
  const { t } = useLocale()
  const res = useOneNotePages()
  const focus = useSyncExternalStore(subscribeOneNoteFocus, getOneNoteFocus)
  const [reading, setReading] = useState(null)
  const [creating, setCreating] = useState(false)
  const mobile = useIsMobile()
  const ask = useAskPage()
  const pages = res.pages
  const notebooks = useMemo(() => notebooksOf(pages), [pages])
  const scoped = useMemo(() => (focus ? pagesOfTarget(pages, focus) : pages), [pages, focus])
  const shown = useMemo(
    () => searchPages(scoped, text).map((p) => ({ ...p, modified: p.edited?.toISOString() })),
    [scoped, text],
  )
  const groups = useMemo(() => groupBySection(shown), [shown])
  const ready = res.status === STATUS.ready
  const picked = focus?.notebook
    ? (notebooks.find((nb) => fold(nb.name) === fold(focus.notebook))?.id ?? "")
    : ""

  // Bölüm dosyasından gelindi (ya da defterin tek sayfası var): sayfa hemen okuyucuda. Bir kez.
  const autoOpen =
    ready && focus?.open
      ? focus.open === "latest" || scoped.length === 1
        ? scoped[0]
        : null
      : null
  useEffect(() => {
    if (!ready || !focus?.open) return
    setOneNoteFocus({ ...focus, open: null })
  }, [ready, focus])
  // Her basış yeni bir odak nesnesi: aynı bölüme ikinci kez basmak da açar.
  const [openedFor, setOpenedFor] = useState(null)
  if (autoOpen && openedFor !== focus) {
    setOpenedFor(focus)
    setReading(autoOpen)
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
  const pick = (id) => {
    const nb = notebooks.find((n) => n.id === id)
    setOneNoteFocus(nb ? { notebook: nb.name, section: "", open: null } : null)
  }

  // Yeni sayfa oluşturulunca: liste yenilenir (en üstte o), sayfa hemen okuyucuda.
  const onCreated = (page) => {
    setCreating(false)
    res.refresh()
    setReading(page)
  }

  const picker = ready && notebooks.length > 1
  // Defter seçicideyse yazılı; çip yalnız seçici yokken (tek defter) ya da bölüm için.
  const chips = [
    focus?.notebook && !(picker && picked) && { key: "nb", label: focus.notebook, clear: null },
    focus?.section && {
      key: "sec",
      label: t("onenote.find.section", { name: focus.section }),
      clear: { ...focus, section: "", open: null },
    },
  ].filter(Boolean)

  let body
  if (res.status === "loading")
    body = (
      <>
        <RowsSkeleton rows={6} />
        <SlowHint />
      </>
    )
  else if (res.status === STATUS.denied)
    body = (
      <StateRow
        icon={LockKeyIcon}
        tone="warn"
        title={t("onenote.denied")}
        body={t("onenote.deniedHint")}
      />
    )
  else if (!ready)
    body = (
      <StateRow
        tone="warn"
        title={t("onenote.error")}
        cause={res.detail}
        action={t("onenote.retry")}
        onAction={res.refresh}
      />
    )
  else if (!pages.length) body = <StateRow icon={NotebookTabsIcon} title={t("onenote.empty")} />
  else if (!scoped.length)
    body = (
      <StateRow
        icon={NotebookTabsIcon}
        title={t("onenote.find.notFound")}
        body={t("onenote.find.notFoundBody")}
        // Defter OneNote'un son 100 sayfasında yok: çare onu OneNote'ta açmak (adres dosyadan).
        action={t(focus.webUrl ? "onenote.open" : "onenote.find.showAll")}
        actionIcon={focus.webUrl ? ArrowUpRight01Icon : undefined}
        onAction={() =>
          focus.webUrl
            ? window.open(focus.webUrl, "_blank", "noopener,noreferrer")
            : setOneNoteFocus(null)
        }
      />
    )
  else if (!shown.length)
    body = (
      <StateRow
        icon={NotebookTabsIcon}
        title={t("onenote.find.noMatch")}
        body={t("onenote.find.noMatchBody")}
      />
    )
  // Defter ve bölüm bilgisi gelmediyse (sorgu `$expand`sız) gruplamak anlamsız: düz liste.
  else if (isUngrouped(groups))
    body = (
      <FileGroup>
        {shown.map((p) => (
          <OneNotePageRow key={p.id} page={p} now={now} query={text} onOpen={openPage} ask={ask} />
        ))}
      </FileGroup>
    )
  else
    body = (
      <OneNoteSections
        groups={groups}
        text={text}
        focusSection={focus?.section}
        // Defter seçiliyken adı seçicide/çipte yazılı: tek defterin başlığı tekrar etmez.
        notebookHeader={!(focus?.notebook && groups.length === 1)}
        now={now}
        row={{ query: text, onOpen: openPage, ask }}
      />
    )

  return (
    <section aria-labelledby="files-onenote-title" className="min-w-0">
      <h2 id="files-onenote-title" className="sr-only">
        {t("myfiles.source.onenote")}
      </h2>
      <SectionTitle
        count={ready ? `${shown.length}${res.hasMore ? "+" : ""}` : null}
        action={
          <div className="flex items-center gap-controls">
            {picker && (
              <NotebookPicker
                notebooks={notebooks}
                value={picked}
                total={pages.length}
                onPick={pick}
                onRefresh={res.refresh}
              />
            )}
            {ready && (
              <ActionButton
                tone="soft"
                size="inline"
                iconOnly={mobile}
                onClick={() => setCreating(true)}
                aria-label={mobile ? t("onenote.new.button") : undefined}
                title={mobile ? t("onenote.new.button") : undefined}
              >
                <HugeiconsIcon icon={NoteAddIcon} strokeWidth={2} aria-hidden="true" />
                {!mobile && t("onenote.new.button")}
              </ActionButton>
            )}
          </div>
        }
      >
        {t("myfiles.source.onenote")}
      </SectionTitle>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pb-3">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setOneNoteFocus(c.clear)}
              aria-label={t("myfiles.filter.remove", { label: c.label })}
              className="files-active-chip"
            >
              <HugeiconsIcon
                icon={NotebookTabsIcon}
                className="size-3.5 text-brand"
                strokeWidth={1.9}
              />
              <span dir="auto" className="truncate">
                {c.label}
              </span>
              <HugeiconsIcon icon={Cancel01Icon} className="size-3 opacity-70" strokeWidth={2.2} />
            </button>
          ))}
        </div>
      )}
      {body}
      {ready && (res.hasMore || res.moreError) && (
        <OneNoteMore
          hasMore={res.hasMore}
          loading={res.loadingMore}
          error={res.moreError}
          count={pages.length}
          // Aramada ve boş listede kendiliğinden sürmez: eşleşmeyen arama bütün notları çekmesin.
          auto={!text && shown.length > 0}
          onMore={res.loadMore}
        />
      )}
      <OneNoteReader page={reading} onClose={closeReader} />
      <OneNoteNewPage
        open={creating}
        pages={pages}
        focus={focus}
        onClose={() => setCreating(false)}
        onCreated={onCreated}
      />
    </section>
  )
}
