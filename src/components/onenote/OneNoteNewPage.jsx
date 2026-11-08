import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { ActionButton } from "@/components/common/ActionButton"
import { SheetSelect } from "@/components/common/SheetSelect"
import { MorphSelect } from "@/components/ui/morph-select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { worstMode } from "@/dev/worstCase/mode"
import { defaultSection, newPageHtml, sectionsFromPages } from "@/lib/onenote/onenoteNewPage"
import { createPage, fetchSections } from "@/lib/onenote/onenoteSource"
import { EditorToolbar } from "./EditorToolbar"
import { imageFiles, pasteInto } from "./imageFile"
import { useFormatBar } from "./useFormatBar"
import { useImageInserts } from "./useImageInserts"
import "./onenoteReader.css"
import "./onenoteEditor.css"

/**
 * Yeni OneNote sayfası — okuyucunun kabuğunda (masaüstünde sağdan bölme, telefonda tam ekran):
 * bölüm seçici (defter › bölüm; açılışta süzülen ya da son düzenlenen sayfanın bölümü), başlık
 * ve düzenleyicinin biçim çubuğuyla yazı alanı (liste, yapılacak, resim). Oluştur sayfayı seçilen
 * bölüme yazar (`lib/onenote/onenoteNewPage`), `onCreated(page)` listeyi yeniler ve sayfayı açar.
 * Yazı varken Escape, dışarı tıklama ve Geri kapatmaz (yazılan kaybolmasın).
 */
export function OneNoteNewPage({ open, pages, focus, onClose, onCreated }) {
  useBackToClose(open, onClose)
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      {open && <NewPagePane pages={pages} focus={focus} onClose={onClose} onCreated={onCreated} />}
    </Sheet>
  )
}

/** Bölüm listesi: Graph'tan tümü; gelmezse son sayfalardan çıkarılanlar. */
function useSections(pages) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [fetched, setFetched] = useState(null)
  const fake = import.meta.env.DEV && worstMode()
  useEffect(() => {
    if (fake) return undefined
    let live = true
    fetchSections(instance, account).then((r) => live && setFetched(r.sections))
    return () => {
      live = false
    }
  }, [fake, instance, account])
  return useMemo(() => {
    if (fake) return sectionsFromPages(pages)
    if (!fetched) return null
    return fetched.length ? fetched : sectionsFromPages(pages)
  }, [fake, fetched, pages])
}

function NewPagePane({ pages, focus, onClose, onCreated }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const { instance, accounts } = useMsal()
  const sections = useSections(pages)
  const [picked, setPicked] = useState(null)
  const section = picked ?? (sections ? defaultSection(sections, pages, focus) : "")
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const root = useRef(null)
  const bar = useRef(null)
  const area = useRef(null)
  const title = useRef(null)
  const nodes = useRef(new Map())
  const picker = useRef(null)
  const markDirty = useCallback(() => setDirty(true), [])
  const fmt = useFormatBar({ doc: null, root, bar, area, nodes, onChange: markDirty })
  const img = useImageInserts({ area, refocus: fmt.refocus, onChange: markDirty, t })
  const addImages = img.add

  const items = useMemo(() => {
    const groups = new Map()
    for (const s of sections ?? []) {
      const key = s.notebook || ""
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push({ value: s.id, label: s.name || t("onenote.untitled") })
    }
    return [...groups].map(([label, options]) => (label ? { label, options } : options)).flat()
  }, [sections, t])
  const strings = useMemo(
    () => ({
      clear: t("onenote.new.clear"),
      close: t("onenote.close"),
      empty: (q) => t("onenote.new.noMatch", { q }),
      count: (n) => t("onenote.new.count", { n }),
    }),
    [t],
  )

  async function create() {
    if (busy) return
    if (!section) {
      notify.info(t("onenote.new.noSections"))
      return
    }
    const name = title.current?.value.trim() ?? ""
    const body = area.current?.innerHTML ?? ""
    if (!name && !area.current?.textContent.trim() && !area.current?.querySelector("img")) {
      notify.info(t("onenote.new.empty"))
      title.current?.focus()
      return
    }
    const sec = sections?.find((s) => s.id === section)
    setBusy(true)
    const res =
      import.meta.env.DEV && worstMode()
        ? await new Promise((r) =>
            setTimeout(
              () => r({ status: STATUS.ready, page: { id: `dev-new-${Date.now()}`, title: name } }),
              500,
            ),
          )
        : await createPage(
            instance,
            accounts[0] ?? null,
            section,
            newPageHtml(name, body, new Date()),
          )
    setBusy(false)
    if (res.status !== STATUS.ready || !res.page) {
      notify.error(t(res.status === STATUS.denied ? "onenote.edit.denied" : "onenote.new.failed"), {
        description: res.detail,
      })
      return
    }
    notify.success(t("onenote.new.created"))
    onCreated({
      ...res.page,
      title: res.page.title || name,
      edited: res.page.edited ?? new Date(),
      sectionId: section,
      section: sec?.name ?? res.page.section ?? "",
      notebookId: sec?.notebookId ?? res.page.notebookId ?? null,
      notebook: sec?.notebook ?? res.page.notebook ?? "",
    })
  }

  const onKeyDown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return
    const key = e.key.toLowerCase()
    if (key === "s" || key === "enter") {
      e.preventDefault()
      create()
    }
    // ⌘B/I/U yazıda biçimdir: kenar çubuğunun ⌘B kısayoluna ulaşmasın.
    const mark = { b: "bold", i: "italic", u: "underline" }[key]
    if (mark && e.target.closest?.("[data-ed]")) {
      e.preventDefault()
      e.stopPropagation()
      fmt.run(mark)
    }
  }
  const onRun = (key) => {
    if (key === "image") picker.current?.click()
    else fmt.run(key)
  }
  const actions = (className) => (
    <>
      <ActionButton
        tone="soft"
        size="toolbar"
        onClick={onClose}
        disabled={busy}
        className={className}
      >
        {t("onenote.edit.cancel")}
      </ActionButton>
      <ActionButton
        tone="prominent"
        size="toolbar"
        onClick={create}
        disabled={busy || !sections}
        className={className}
      >
        {t(busy ? "onenote.new.creating" : "onenote.new.create")}
      </ActionButton>
    </>
  )
  const select = {
    id: "on-new-section",
    label: t("onenote.new.section"),
    labelledBy: "on-new-section-label",
    items,
    value: section || null,
    onValueChange: setPicked,
    placeholder: t(sections ? "onenote.new.choose" : "onenote.new.loading"),
    searchPlaceholder: t("onenote.new.search"),
    strings,
    className: "on-new-select",
  }

  return (
    <SheetContent
      side="right"
      showCloseButton={false}
      onEscapeKeyDown={(e) => {
        e.stopPropagation()
        if (dirty) {
          e.preventDefault()
          notify.info(t("onenote.edit.unsaved"))
        }
      }}
      onInteractOutside={(e) => {
        if (dirty) e.preventDefault()
      }}
      className="on-reader gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
    >
      <div className="on-reader-head">
        <div className="min-w-0 flex-1">
          <SheetTitle className="on-reader-title">{t("onenote.new.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("onenote.new.desc")}</SheetDescription>
        </div>
        <div className="on-reader-actions">{actions("on-reader-open-top")}</div>
      </div>
      <div className="on-reader-body">
        <div ref={root} className="on-ed" onKeyDown={onKeyDown}>
          <EditorToolbar ref={bar} state={fmt.state} onRun={onRun} />
          <input
            ref={picker}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = imageFiles(e.target.files)
              e.target.value = ""
              if (files.length) addImages(files, { where: "new", id: null })
            }}
          />
          <div
            className="on-ed-scroll"
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) e.preventDefault()
            }}
            onDrop={(e) => {
              const files = imageFiles(e.dataTransfer.files)
              if (!files.length) return
              e.preventDefault()
              addImages(files, { where: "new", id: null })
            }}
          >
            <div className="on-new-where">
              <p id="on-new-section-label" className="on-new-where-label">
                {t("onenote.new.section")}
              </p>
              {mobile ? <SheetSelect {...select} /> : <MorphSelect {...select} panelWidth={320} />}
            </div>
            <label className="sr-only" htmlFor="on-new-title">
              {t("onenote.edit.title")}
            </label>
            <input
              id="on-new-title"
              ref={title}
              className="on-ed-title"
              placeholder={t("onenote.new.titlePlaceholder")}
              onInput={markDirty}
              dir="auto"
              // Yeni sayfada ilk iş başlık.
              autoFocus={!mobile}
            />
            <div
              ref={area}
              data-ed="new"
              role="textbox"
              aria-multiline="true"
              aria-label={t("onenote.new.body")}
              className="on-ed-new on-ed-new--page"
              data-placeholder={t("onenote.new.bodyPlaceholder")}
              contentEditable
              suppressContentEditableWarning
              spellCheck
              dir="auto"
              onPaste={(e) =>
                pasteInto(e, (files) => addImages(files, { where: "new", id: null }), null)
              }
              onKeyDown={fmt.onAreaKey}
              onInput={(e) => {
                const el = e.currentTarget
                if (!el.textContent && !el.querySelector("li,[data-tag],img")) el.innerHTML = ""
                markDirty()
              }}
            />
          </div>
        </div>
      </div>
      <div className="on-reader-foot">{actions("flex-1")}</div>
    </SheetContent>
  )
}
