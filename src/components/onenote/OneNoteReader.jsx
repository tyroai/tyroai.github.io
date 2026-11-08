import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { actionButtonClass } from "@/components/common/actionButtonClass"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { isolate } from "@/lib/bidi"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { PaletteContext } from "@/providers/PaletteProvider"
import { ThemeContext } from "@/providers/ThemeProvider"
import { stripNetworkHints } from "@/lib/mailHtml"
import { usePageContent } from "./usePageContent"
import { OneNoteAsk } from "./OneNoteAsk"
import { OneNoteEditor } from "./OneNoteEditor"
import { OneNoteShare } from "./OneNoteShare"
import { crumbOf } from "@/lib/onenote/onenotePages"
import { editedStamp } from "@/lib/onenote/onenoteStamp"
import { oneNoteFrameDoc } from "@/lib/onenote/onenoteFrame"
import { placeholdImages } from "@/lib/onenote/onenoteImages"
import "./onenoteReader.css"

/**
 * Sayfa okuyucu — masaüstünde sağdan bölme, telefonda tam ekran (posta okuyucusunun kabuğu):
 * defter yolu, başlık, düzenlenme damgası; sağda tek boy araç satırı (TYRO, "OneNote'ta aç",
 * Paylaş, Kapat — `docs/design-system.md` › Araç çubuğu standardı) ve kilitli çerçevede sayfa
 * (`lib/onenote/onenoteFrame`: uygulamanın temasında okuma yüzeyi; betik, form, aynı köken
 * kapalı; görsel yalnız `data:`). İndirilemeyen görsel yer tutucu kutu olur ve dipnotta
 * söylenir. Escape, dışarı tıklama ve telefonda Geri kapatır.
 */
export function OneNoteReader({ page, onClose }) {
  const open = Boolean(page)
  useBackToClose(open, onClose)
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      {page && <ReaderPane key={page.id} page={page} onClose={onClose} />}
    </Sheet>
  )
}

function OpenLink({ href, size = "toolbar", className }) {
  const { t } = useLocale()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={actionButtonClass({ tone: "soft", size, className })}
    >
      {t("onenote.open")}
      <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} aria-hidden="true" />
    </a>
  )
}

/** Paletin bağlantı mürekkebi, çözülmüş (`:root`ta `var()` yerine konmuş hâli). */
const brandInk = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--brand-ink").trim() || null

/**
 * Çerçevenin teması ve bağlantı rengi. Tema sınıfını sağlayıcı yerleşim efektinde koyar: değişince
 * okuma bir kare sonra yapılır (sınıf yerinde), açılışta doğrudan.
 */
function useFrameInk() {
  // Sağlayıcısız (bileşen testi) da çalışır: tema o zaman kök sınıftan okunur.
  const theme = useContext(ThemeContext)?.theme
  const palette = useContext(PaletteContext)?.palette
  const [link, setLink] = useState(brandInk)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLink(brandInk()))
    return () => cancelAnimationFrame(frame)
  }, [theme, palette])
  const dark = theme ? theme === "dark" : document.documentElement.classList.contains("dark")
  return { dark, link }
}

/** Düzenle kipinin düğmeleri: Vazgeç (değişiklikleri bırakır) · Kaydet (birincil). */
function EditActions({ edit, editor, onCancel, className }) {
  const { t } = useLocale()
  return (
    <>
      <ActionButton
        tone="soft"
        size="toolbar"
        onClick={onCancel}
        disabled={edit.busy}
        className={className}
      >
        {t("onenote.edit.cancel")}
      </ActionButton>
      <ActionButton
        tone="prominent"
        size="toolbar"
        onClick={() => editor.current?.save()}
        disabled={edit.busy || !edit.ready}
        className={className}
      >
        {t(edit.busy ? "onenote.edit.saving" : "onenote.edit.save")}
      </ActionButton>
    </>
  )
}

function ReaderPane({ page, onClose }) {
  const { t, locale } = useLocale()
  const { dark, link } = useFrameInk()
  const content = usePageContent(page.id)
  // Düzenle kipi (`OneNoteEditor`, `Notes.ReadWrite`): okuma çerçevesinin yerinde düzenleyici;
  // araç satırı Vazgeç · Kaydet olur. Kayıt bitince okuyucu sayfanın yeni hâlini çeker.
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({ dirty: false, busy: false, ready: false })
  const editor = useRef(null)
  const onEditState = useCallback((s) => setEdit(s), [])
  const onSaved = (changed) => {
    setEditing(false)
    if (changed) content.retry()
  }
  const title = page.title || t("onenote.untitled")
  const crumb = crumbOf(page)
  const ready = content.status === STATUS.ready
  const doc = useMemo(() => {
    if (!ready || !content.html) return ""
    const { html, missing } = placeholdImages(
      stripNetworkHints(content.html),
      t("onenote.imageMissing"),
    )
    const note = missing ? t("onenote.imagesHidden", { n: missing }) : ""
    return oneNoteFrameDoc(html, { note, dark, link })
  }, [ready, content.html, t, dark, link])
  return (
    <SheetContent
      side="right"
      showCloseButton={false}
      // Sohbet rıhtımı da Escape dinliyor: bölmeyi kapatan Escape rıhtımı kapatmasın. Düzenleme
      // kaydedilmemişse Escape ve dışarı tıklama kapatmaz (değişiklik kaybolmasın), uyarır.
      onEscapeKeyDown={(e) => {
        e.stopPropagation()
        if (editing && edit.dirty) {
          e.preventDefault()
          notify.info(t("onenote.edit.unsaved"))
        }
      }}
      onInteractOutside={(e) => {
        if (editing && edit.dirty) e.preventDefault()
      }}
      className="on-reader gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
    >
      <div className="on-reader-head">
        <div className="min-w-0 flex-1">
          {crumb && (
            <p dir="auto" className="on-reader-crumb">
              {isolate(crumb)}
            </p>
          )}
          <SheetTitle dir="auto" data-private="" className="on-reader-title">
            {title}
          </SheetTitle>
          <SheetDescription className="on-reader-stamp">
            {page.edited ? t("onenote.edited", { when: editedStamp(page.edited, locale) }) : ""}
          </SheetDescription>
        </div>
        <div className="on-reader-actions">
          {editing ? (
            <EditActions
              edit={edit}
              onCancel={() => setEditing(false)}
              editor={editor}
              className="on-reader-open-top"
            />
          ) : (
            <>
              <OneNoteAsk
                page={page}
                title={title}
                crumb={crumb}
                html={ready ? content.html : ""}
                onDone={onClose}
                size="toolbar"
                className="on-reader-open-top"
              />
              {page.webUrl && (
                <OpenLink href={page.webUrl} size="toolbar" className="on-reader-open-top" />
              )}
              <ActionButton
                tone="soft"
                size="toolbar"
                onClick={() => setEditing(true)}
                className="on-reader-open-top"
              >
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} aria-hidden="true" />
                {t("onenote.edit.button")}
              </ActionButton>
              <OneNoteShare
                page={page}
                title={title}
                crumb={crumb}
                html={ready ? content.html : ""}
                className="on-reader-open-top"
              />
            </>
          )}
          <ActionButton
            tone="plain"
            iconOnly
            onClick={onClose}
            aria-label={t("onenote.close")}
            title={t("onenote.close")}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </ActionButton>
        </div>
      </div>
      <div data-private="" className="on-reader-body">
        {content.status === "loading" && (
          <div aria-hidden="true" className="on-reader-skeleton">
            <span className="ms-skeleton" />
            <span className="ms-skeleton" />
            <span className="ms-skeleton" />
            <span className="ms-skeleton is-block" />
          </div>
        )}
        {editing && (
          <OneNoteEditor page={page} ref={editor} onState={onEditState} onSaved={onSaved} />
        )}
        {!editing && doc && (
          <iframe
            title={title}
            // Bağlantılar yeni sekmede; betik, form ve aynı köken KAPALI (`lib/mailFrame`).
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="on-reader-frame"
            srcDoc={doc}
          />
        )}
        {!editing && content.status !== "loading" && !doc && (
          <div className="on-reader-empty">
            <p className="on-reader-empty-title">
              {t(
                ready
                  ? "onenote.noContent"
                  : content.status === STATUS.denied
                    ? "onenote.denied"
                    : "onenote.readerError",
              )}
            </p>
            {!ready && content.status !== STATUS.denied && (
              <>
                <button type="button" onClick={content.retry} className="on-text-btn">
                  {t("onenote.retry")}
                </button>
                {/* Açılmayan sayfanın nedeni ve kodu (BT'ye iletilir). */}
                <ErrorCause detail={content.detail} className="mt-2" />
              </>
            )}
          </div>
        )}
      </div>
      {/* Telefonda eylemler başparmağın altında, başlık tam genişlik kalsın. */}
      <div className="on-reader-foot">
        {editing ? (
          <EditActions
            edit={edit}
            editor={editor}
            onCancel={() => setEditing(false)}
            className="flex-1"
          />
        ) : (
          <>
            <OneNoteAsk
              page={page}
              title={title}
              crumb={crumb}
              html={ready ? content.html : ""}
              onDone={onClose}
              size="toolbar"
              align="start"
              className="flex-1"
            />
            {page.webUrl && <OpenLink href={page.webUrl} size="toolbar" className="flex-1" />}
            <ActionButton
              tone="soft"
              size="toolbar"
              iconOnly
              onClick={() => setEditing(true)}
              aria-label={t("onenote.edit.button")}
              title={t("onenote.edit.button")}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} aria-hidden="true" />
            </ActionButton>
            <OneNoteShare
              page={page}
              title={title}
              crumb={crumb}
              html={ready ? content.html : ""}
              iconOnly
            />
          </>
        )}
      </div>
    </SheetContent>
  )
}
