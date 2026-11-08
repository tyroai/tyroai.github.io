import "@/lib/i18n/onenote"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import StickyNote02Icon from "@hugeicons/core-free-icons/StickyNote02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graphRequest"
import { notify } from "@/lib/notify"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { StickyCard } from "./StickyCard"
import { StickyComposer } from "./StickyComposer"
import {
  addStickyNote,
  colorStickyNote,
  editStickyNote,
  loadStickyNotes,
  removeStickyNote,
  useStickyNotes,
} from "./stickyStore"
import "./sticky.css"

/**
 * Yapışkan notlar — kişinin OneNote'undaki "TYRO Notlar" bölümü (`lib/stickySource`). Panoda kart,
 * çentikte ve header tepsisinde aynı bileşen (tepsinin penceresi `renderWidget`le çizer). Notlar
 * renkli kâğıtlar: "+" yeni not, nota basınca yerinde düzenleme, ⋯ menüsünde renk, paylaşma, sil.
 */
export default function StickyWidget({ className }) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const ctx = useMemo(() => ({ instance, account }), [instance, account])
  const st = useStickyNotes()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  // Tepside/çentikte (`WidgetPanel` › `data-panel`) kendi görünümü: üstte hep açık hızlı not,
  // altında tek sütun liste. Panodaki kart "+" ile yazar.
  const probe = useRef(null)
  const [panel, setPanel] = useState(false)
  useLayoutEffect(() => {
    setPanel(Boolean(probe.current?.closest("[data-panel]")))
  }, [])
  // Pencereyi genişlet (yalnız tepsi/çentik): tercih bu tarayıcıda hatırlanır.
  const [wide, setWide] = useState(readWide)
  const toggleWide = () =>
    setWide((w) => {
      writeWide(!w)
      return !w
    })

  useEffect(() => {
    loadStickyNotes(ctx)
  }, [ctx])

  const report = (o) => {
    if (o.ok || o.status === "empty") return
    notify.error(
      t(o.status === STATUS.denied ? "widgets.sticky.denied" : "widgets.sticky.saveFailed"),
      { description: o.detail },
    )
  }
  const add = async (text, color) => {
    if (!panel) setAdding(false)
    report(await addStickyNote(ctx, text, color))
  }
  const save = async (id, text) => {
    setEditing(null)
    report(await editStickyNote(ctx, id, text))
  }
  const remove = (id) => {
    const undo = removeStickyNote(ctx, id, { onFail: report })
    notify.success(t("widgets.sticky.deleted"), {
      action: { label: t("widgets.undo"), onClick: undo },
      duration: 5000,
    })
  }

  const notes = st.notes
  const loading = st.status === "loading" || st.status === "idle"
  const failed = !loading && st.status !== STATUS.ready && !notes.length
  const addButton = (
    <ActionButton
      tone="plain"
      iconOnly
      onClick={() => {
        setEditing(null)
        setAdding(true)
      }}
      disabled={adding || failed}
      aria-label={t("widgets.sticky.add")}
      title={t("widgets.sticky.add")}
    >
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
    </ActionButton>
  )

  const renderNote = (n) =>
    editing === n.id ? (
      <StickyComposer
        key={n.id}
        initial={n.text}
        color={n.color}
        onSave={(text) => save(n.id, text)}
        onCancel={() => setEditing(null)}
      />
    ) : (
      <StickyCard
        key={n.id}
        note={n}
        onEdit={() => {
          setAdding(false)
          setEditing(n.id)
        }}
        onColor={(c) => colorStickyNote(n.id, c)}
        onDelete={() => remove(n.id)}
      />
    )

  return (
    <WidgetFrame
      id="sticky"
      title={t("widgets.sticky.title")}
      shortTitle={t("widgets.sticky.titleShort")}
      icon={StickyNote02Icon}
      action={
        panel ? (
          <ActionButton
            tone="plain"
            iconOnly
            onClick={toggleWide}
            aria-pressed={wide}
            aria-label={t(wide ? "widgets.sticky.narrow" : "widgets.sticky.widen")}
            title={t(wide ? "widgets.sticky.narrow" : "widgets.sticky.widen")}
          >
            <HugeiconsIcon
              icon={wide ? ArrowShrink01Icon : ArrowExpand01Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
          </ActionButton>
        ) : (
          addButton
        )
      }
      busy={loading}
      className={panel ? `${className ?? ""} st-panel${wide ? " st-wide" : ""}` : className}
    >
      <span ref={probe} hidden />
      {failed ? (
        <WidgetEmpty
          icon={StickyNote02Icon}
          action={
            <span className="flex flex-col items-center gap-1.5">
              <ActionButton tone="soft" size="inline" onClick={() => loadStickyNotes(ctx, true)}>
                {t("widgets.sticky.retry")}
              </ActionButton>
              <ErrorCause detail={st.detail} />
            </span>
          }
        >
          {t(st.status === STATUS.denied ? "widgets.sticky.denied" : "widgets.sticky.loadFailed")}
        </WidgetEmpty>
      ) : loading && !notes.length ? (
        <div className="st-grid mt-3" aria-hidden="true">
          <span className="ms-skeleton st-skeleton" />
          <span className="ms-skeleton st-skeleton" />
        </div>
      ) : panel ? (
        <div className="st-scroll mt-3">
          <StickyComposer quick pickColor onSave={add} onCancel={() => {}} />
          {notes.length ? (
            <div className="st-grid mt-3">{notes.map(renderNote)}</div>
          ) : (
            <p className="st-panel-empty">{t("widgets.sticky.emptyHint")}</p>
          )}
        </div>
      ) : !notes.length && !adding ? (
        <WidgetEmpty
          icon={StickyNote02Icon}
          hint={t("widgets.sticky.emptyHint")}
          action={
            <ActionButton tone="soft" size="inline" onClick={() => setAdding(true)}>
              {t("widgets.sticky.add")}
            </ActionButton>
          }
        >
          {t("widgets.sticky.empty")}
        </WidgetEmpty>
      ) : (
        <div className="st-scroll mt-3">
          <div className="st-grid">
            {adding && <StickyComposer pickColor onSave={add} onCancel={() => setAdding(false)} />}
            {notes.map(renderNote)}
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}

const WIDE_KEY = "tyro-widgets-sticky-wide-v1"
function readWide() {
  try {
    return window.localStorage.getItem(WIDE_KEY) === "1"
  } catch {
    return false
  }
}
function writeWide(on) {
  try {
    if (on) window.localStorage.setItem(WIDE_KEY, "1")
    else window.localStorage.removeItem(WIDE_KEY)
  } catch {
    // Depo kapalı: bu oturumda kalır.
  }
}
