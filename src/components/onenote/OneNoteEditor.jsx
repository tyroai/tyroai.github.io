import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Image01Icon from "@hugeicons/core-free-icons/Image01Icon"
import Table01Icon from "@hugeicons/core-free-icons/Table01Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { worstMode } from "@/dev/worstCase/mode"
import { buildPatch, commandKind } from "@/lib/onenote/onenoteEdit"
import { patchPageContent } from "@/lib/onenote/onenoteSource"
import "./onenoteEditor.css"
import { EditorToolbar } from "./EditorToolbar"
import { imageFiles, pasteInto } from "./imageFile"
import { PendingImages } from "./PendingImages"
import { useImageInserts } from "./useImageInserts"
import { useEditablePage } from "./useEditablePage"
import { effectiveFormat, useFormatBar } from "./useFormatBar"

const RO_ICON = { image: Image01Icon, table: Table01Icon, file: Attachment01Icon }

/**
 * Yazı öğesi: yerinde düzenlenir (`contentEditable`). İçerik bir kez yazılır, sonra React ona
 * dokunmaz (imleç kaymasın); kayıtta `innerHTML` okunur. Biçimi değişince (başlık, madde) öğe
 * yazının o anki hâliyle yeniden çizilir (`format.html`). Yapıştırma düz yazı, Enter satır sonu
 * (yeni öğe değil: Graph öğeyi kimliğiyle değiştirir).
 */
const TextBlock = memo(function TextBlock({ block, format, register, onDirty, onImages }) {
  const { tag, list, dataTag } = effectiveFormat(block, format)
  const asItem = Boolean(list)
  const Tag = asItem ? "div" : tag
  return (
    <Tag
      ref={(el) => register(block.id, el)}
      data-ed={block.id}
      className={asItem ? (list === "ol" ? "on-ed-li on-ed-ol" : "on-ed-li") : "on-ed-text"}
      data-tag={dataTag || undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      dir="auto"
      onInput={onDirty}
      onPaste={(e) => pasteInto(e, onImages, block.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          document.execCommand("insertLineBreak")
        }
      }}
      dangerouslySetInnerHTML={{ __html: format?.html ?? block.html }}
    />
  )
})

/**
 * OneNote sayfasını uygulama içinde düzenleme (okuyucunun Düzenle kipi; `Notes.ReadWrite`).
 * Başlık, paragraflar, başlıklar ve maddeler yerinde düzenlenir; görsel, tablo ve ek salt okunur
 * kutu ("OneNote'ta düzenlenir"); en altta sayfanın sonuna eklenecek not. Kayıt yalnız değişen
 * öğeleri gönderir (`lib/onenote/onenoteEdit` › `buildPatch`). Dışarıya `ref` ile `save()`;
 * durum (`dirty`, `busy`) `onState` ile okuyucunun düğmelerine gider. `onSaved`: kayıt bitti.
 */
export function OneNoteEditor({ page, ref, onState, onSaved }) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const { status, doc } = useEditablePage(page.id)
  const nodes = useRef(new Map())
  const title = useRef(null)
  const append = useRef(null)
  const root = useRef(null)
  const bar = useRef(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const register = useCallback((id, el) => {
    if (el) nodes.current.set(id, el)
    else nodes.current.delete(id)
  }, [])
  const markDirty = useCallback(() => setDirty(true), [])
  const fmt = useFormatBar({ doc, root, bar, area: append, nodes, onChange: markDirty })
  const img = useImageInserts({ area: append, refocus: fmt.refocus, onChange: markDirty, t })
  const picker = useRef(null)
  const pickFor = useRef({ where: null, id: null })
  const addImages = img.add
  const onImages = useCallback(
    (files, id) => addImages(files, id ? { where: "block", id } : { where: "new", id: null }),
    [addImages],
  )
  const onRun = (key) => {
    if (key !== "image") return fmt.run(key)
    // Dosya penceresi odağı alır: hedef (imlecin yeri) şimdi saklanır.
    pickFor.current = { where: fmt.state.where, id: fmt.state.id }
    picker.current?.click()
  }
  const onDrop = (e) => {
    const files = imageFiles(e.dataTransfer.files)
    if (!files.length) return
    e.preventDefault()
    const id = e.target.closest?.("[data-ed]")?.dataset.ed
    onImages(files, id && id !== "new" ? id : null)
  }

  useEffect(() => onState?.({ dirty, busy, ready: Boolean(doc) }), [dirty, busy, doc, onState])

  async function save() {
    if (!doc || busy) return
    const edits = new Map([...nodes.current].map(([id, el]) => [id, el.innerHTML]))
    const commands = buildPatch(doc, {
      title: title.current?.value ?? doc.title,
      edits,
      formats: fmt.formats,
      images: img.images,
      append: append.current?.innerHTML ?? "",
    })
    if (!commands.length) {
      notify.info(t("onenote.edit.nothing"))
      onSaved(false)
      return
    }
    setBusy(true)
    // DEV: sahte sayfada yazma yok, başarı taklit edilir.
    const res =
      import.meta.env.DEV && worstMode()
        ? await new Promise((r) => setTimeout(() => r({ done: commands.length, failed: [] }), 500))
        : await patchPageContent(instance, accounts[0] ?? null, page.id, commands)
    setBusy(false)
    const { done, failed } = res
    if (!failed.length) {
      notify.success(t("onenote.edit.saved"))
      onSaved(true)
      return
    }
    // Neden kodu (HTTP · Graph kodu) kişisel veri taşımaz: destek için uyarıda gösterilir.
    const detail = [...new Set(failed.map((f) => f.detail).filter(Boolean))].join(" · ")
    const what = [...new Set(failed.map((f) => t(`onenote.edit.kind.${commandKind(f.command)}`)))]
    if (!done) {
      const denied = failed.every((f) => f.status === STATUS.denied)
      notify.error(t(denied ? "onenote.edit.denied" : "onenote.edit.failed"), {
        description: detail,
      })
      return
    }
    // Bir kısmı yazıldı: öğe kimlikleri değişmiş olabilir, düzenleyici sayfanın yeni hâliyle açılmalı.
    notify.warning(t("onenote.edit.partial", { what: what.join(", ") }), { description: detail })
    onSaved(true)
  }
  useImperativeHandle(ref, () => ({ save, dirty }))

  if (status === "loading")
    return (
      <div aria-hidden="true" className="on-reader-skeleton">
        <span className="ms-skeleton" />
        <span className="ms-skeleton" />
        <span className="ms-skeleton is-block" />
      </div>
    )
  if (!doc)
    return (
      <div className="on-reader-empty">
        <p className="on-reader-empty-title">
          {t(status === STATUS.denied ? "onenote.edit.denied" : "onenote.edit.loadError")}
        </p>
      </div>
    )
  return (
    <div
      ref={root}
      className="on-ed"
      onKeyDown={(e) => {
        // Cmd/Ctrl+S kaydeder (tarayıcının "sayfayı kaydet"i yerine).
        if (!(e.metaKey || e.ctrlKey) || e.altKey) return
        const key = e.key.toLowerCase()
        if (key === "s") {
          e.preventDefault()
          save()
        }
        // ⌘B/I/U yazıda biçimdir: kenar çubuğunun ⌘B kısayoluna (pencerede) ulaşmasın.
        const mark = { b: "bold", i: "italic", u: "underline" }[key]
        if (mark && e.target.closest?.("[data-ed]")) {
          e.preventDefault()
          e.stopPropagation()
          fmt.run(mark)
        }
      }}
    >
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
          if (files.length) addImages(files, pickFor.current)
        }}
      />
      <div
        className="on-ed-scroll"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault()
        }}
        onDrop={onDrop}
      >
        <label className="sr-only" htmlFor="on-ed-title">
          {t("onenote.edit.title")}
        </label>
        <input
          id="on-ed-title"
          ref={title}
          className="on-ed-title"
          defaultValue={doc.title}
          placeholder={t("onenote.untitled")}
          onInput={markDirty}
          dir="auto"
        />
        <div className="on-ed-doc">
          {doc.blocks.map((block, i) =>
            block.kind === "text" ? (
              <Fragment key={block.id}>
                <TextBlock
                  block={block}
                  format={fmt.formats.get(block.id)}
                  register={register}
                  onDirty={markDirty}
                  onImages={onImages}
                />
                <PendingImages
                  images={img.images.filter((i) => i.after === block.id)}
                  onRemove={img.remove}
                />
              </Fragment>
            ) : block.what ? (
              <p key={`ro-${i}`} className="on-ed-ro">
                <HugeiconsIcon icon={RO_ICON[block.what]} strokeWidth={1.8} aria-hidden="true" />
                {t(`onenote.edit.readonly.${block.what}`)}
              </p>
            ) : (
              <p
                key={`ro-${i}`}
                className="on-ed-text on-ed-locked"
                dir="auto"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            ),
          )}
        </div>
        <p className="on-ed-append-label" id="on-ed-append-label">
          {t("onenote.edit.append")}
        </p>
        <div
          ref={append}
          data-ed="new"
          role="textbox"
          aria-multiline="true"
          aria-labelledby="on-ed-append-label"
          className="on-ed-new"
          data-placeholder={t("onenote.edit.appendPlaceholder")}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          dir="auto"
          onPaste={(e) => pasteInto(e, onImages, null)}
          onKeyDown={fmt.onAreaKey}
          onInput={(e) => {
            // Boşaltılınca tarayıcının bıraktığı `<br>` gitsin: yer tutucu yeniden görünsün.
            const el = e.currentTarget
            if (!el.textContent && !el.querySelector("li,[data-tag],img")) el.innerHTML = ""
            markDirty()
          }}
        />
      </div>
    </div>
  )
}
