import { useState } from "react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { RecordFrame } from "@/components/record-window/RecordFrame"
import { DestructiveDialog } from "@/features/security/dialogs"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe"
import { useLocale } from "@/hooks/useLocale"
import { localDayKey } from "@/lib/todo"
import { AutoText } from "./detail/AutoText"
import { DetailBar } from "./detail/DetailBar"
import { DetailHead } from "./detail/DetailHead"
import { LinksSection } from "./detail/LinksSection"
import { StepsSection } from "./detail/StepsSection"
import { TaskHero } from "./detail/TaskHero"
import { TimingRows } from "./detail/TimingRows"
import "./detail/todoDetail.css"

/**
 * Görev ayrıntısı — To Do'nun sağ paneli, kayıt penceresi kalıbında (`components/record-window`,
 * `docs/design-system.md`): şerit (kapat · liste · yıldız · ⋯ Sil), başlık (tamamla kutusu · ad ·
 * etiketler), tek sayının kartı (kalan gün, gecikme ya da bitiş), zamanlama satırları, adımlar,
 * not, bağlı içerik. Parçalar `detail/` altında.
 *
 * ⚠️ **ADIMLAR VE BAĞLI İÇERİK PANEL AÇILINCA OKUNUR** (gerekçe `lib/todoBoard.js`: `$expand` bu
 * kiracıda denenmedi). İskelet bu yüzden yalnız o iki bölümde; görevin kendi alanları listede.
 *
 * ⚠️ **BAŞLIK VE NOT ODAK ÇIKINCA KAYDEDİLİR**, her tuşta değil (`AutoText`). Değişmediyse hiç
 * yazılmaz.
 *
 * ⚠️ **SİLME ONAYLI** (`DestructiveDialog`, `/security`nin kutusu): To Do'da geri alma yok. Kutuda
 * neyin GİDECEĞİ (adımlar, not) ve neyin KALACAĞI (işaretli e-postanın kendisi Outlook'ta) ayrı.
 */
function DetailBody({ board, task, list, onCompleted, onClose }) {
  const { t } = useLocale()
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note)
  const [confirm, setConfirm] = useState(false)
  const locked = Boolean(task.pending)
  const update = (changes) => board.updateTask(task.id, changes)

  function commitTitle() {
    const clean = title.trim().slice(0, 255)
    if (!clean) {
      setTitle(task.title)
      return
    }
    if (clean !== task.title) update({ title: clean })
  }
  function toggle() {
    const next = !task.done
    update({ done: next })
    if (next) onCompleted?.()
  }

  return (
    <>
      <SheetTitle className="sr-only">{t("todo.detail.title")}</SheetTitle>
      <SheetDescription className="sr-only">{task.title}</SheetDescription>
      <RecordFrame
        className="td-detail"
        bar={
          <DetailBar
            task={task}
            list={list}
            locked={locked}
            onClose={onClose}
            onToggleStar={() =>
              update({ importance: task.importance === "high" ? "normal" : "high" })
            }
            onDelete={() => setConfirm(true)}
          />
        }
      >
        <DetailHead
          task={task}
          title={title}
          onTitle={setTitle}
          onCommitTitle={commitTitle}
          locked={locked}
          onToggle={toggle}
        />
        <TaskHero task={task} today={localDayKey()} />
        <TimingRows task={task} onChange={update} />
        {!locked && <StepsSection board={board} task={task} />}
        <section className="td-section">
          <h3 className="rw-section">{t("todo.detail.note")}</h3>
          <AutoText
            value={note}
            onChange={setNote}
            onCommit={() => note !== task.note && update({ note })}
            disabled={locked}
            label={t("todo.detail.note")}
            placeholder={t("todo.detail.notePlaceholder")}
            className="no-ios-zoom td-note"
          />
        </section>
        {!locked && <LinksSection board={board} task={task} />}
      </RecordFrame>

      <DestructiveDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={Delete02Icon}
        title={t("todo.detail.deleteTitle")}
        description={t("todo.detail.deleteBody")}
        subject={task.title}
        consequences={[
          { kind: "gone", text: t("todo.detail.deleteGone") },
          ...(list?.kind === "flagged"
            ? [{ kind: "keep", text: t("todo.detail.deleteKeepMail") }]
            : []),
        ]}
        confirmLabel={t("todo.detail.deleteConfirm")}
        cancelLabel={t("todo.cancel")}
        onConfirm={() => {
          setConfirm(false)
          onClose()
          board.removeTask(task.id)
        }}
      />
    </>
  )
}

/**
 * Escape paneli odak çıkmadan kapatır: başlık ve not yalnız odak çıkınca kaydedildiği için
 * (`AutoText`) yazılan son metin kaybolurdu. Kapanmadan önce alanı bırakmak kaydı tetikler —
 * Kapat düğmesi ve dış tık bunu zaten yapıyor.
 */
function flushOnEscape() {
  const el = document.activeElement
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.blur()
}

export function TodoDetail({ board, taskId, open, onOpenChange, onCompleted }) {
  const task = board.tasks.find((x) => x.id === taskId) ?? null
  const list = task ? board.lists.find((l) => l.id === task.listId) : null
  const shown = open && Boolean(task)
  // Telefonda tam ekran: Geri tuşu ve sol kenardan sağa kaydırma kapatır (iOS geri hareketi gibi).
  const phone = useIsMobile()
  const close = () => {
    flushOnEscape()
    onOpenChange(false)
  }
  useBackToClose(shown && phone, close)
  const { contentRef, overlayRef, edge } = useEdgeSwipe(close)
  return (
    <Sheet open={shown} onOpenChange={onOpenChange}>
      {/* ⚠️ Genişlik `data-[side=right]:` ÖNEKİYLE: taban sınıf öyle yazılı
          (`w-3/4`, `sm:max-w-sm`) ve öneksiz `w-full` onu ezmiyordu — panel
          telefonda ekranın dörtte üçünde, masaüstünde 24rem'de kalıyordu.
          Kapat düğmesi şeritte (`RecordBar`); kabuğunki kapalı. */}
      <SheetContent
        ref={contentRef}
        overlayRef={overlayRef}
        side="right"
        showCloseButton={false}
        onEscapeKeyDown={flushOnEscape}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {phone && <div {...edge} />}
        {task && (
          <DetailBody
            key={task.id}
            board={board}
            task={task}
            list={list}
            onCompleted={onCompleted}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
