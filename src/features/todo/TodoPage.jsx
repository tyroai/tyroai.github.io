import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshButton } from "@/components/common/RefreshButton"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { OverlayScrollbar } from "@/components/common/OverlayScrollbar"
import { DestructiveDialog } from "@/features/security/dialogs"
import { useFlaggedLeftovers } from "@/hooks/useFlaggedLeftovers"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useTodoBoard } from "@/hooks/useTodoBoard"
import { worstBoard } from "@/dev/worstCase/calendarEvents"
import { causeText, withCause } from "@/lib/causeText"
import { STATUS } from "@/lib/graph"
import { showResultToast } from "@/lib/refreshToast"
import { localDayKey } from "@/lib/todo"
import { VIEWS, boardSummary } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { PageHeading } from "@/components/common/SectionHeading"
import { PageShell } from "@/components/layout/PageShell"
import "./ChecklistOrb.css"
import { FlaggedLeftovers } from "./FlaggedLeftovers"
import { TodoBoard } from "./TodoBoard"
import { TodoDetail } from "./TodoDetail"
import { Tour } from "@/components/tour/Tour"
import { TodoPhoneCard } from "./TodoPhoneCard"
import { TodoSummaryCard } from "./TodoSummaryCard"
import { useOpenTask } from "./useOpenTask"
import { useQuickAdd } from "./useQuickAdd"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  To-Do (`/todo`) — Microsoft To Do, TYRO'nun içinde
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Başta tek kart (karşılama + durum), altında filtreli liste. İstek ve kararlar
 * `docs/features/todo.md`te.
 *
 * | dosya | işi |
 * |---|---|
 * | `lib/todoBoard.js` | MEKANİZMA: listeler, görevler, adımlar, bağlı içerik, yazma |
 * | `lib/todoInsights.js` | SAF HESAP: görünümler, gruplar, sıralama, özet |
 * | `hooks/useTodoBoard.js` | önbellek, iyimser değişiklik, Anasayfa'yla eşitleme |
 * | `TodoSummaryCard.jsx` | tek kart: düzen (geniş · tablet · telefon), çubuk ve çekmece |
 * | `TodoGreeting.jsx` · `ChecklistOrb` | karşılama: panolu maskot, günün cümlesi, bugüne ekleme |
 * | `TodoStatusTray.jsx` · `TodoStatusTiles.jsx` | beyaz tepsi: dört durum + çekmecenin içi |
 * | `TodoProgress.jsx` · `TodoKpiBar.jsx` | ilerleme halkası (kartın sonu) · telefonun tek satırı |
 * | `useQuickAdd.js` | bugüne hızlı ekleme (kart ve To-Do widget'ı aynı kural) |
 * | `TodoBoard.jsx` · `TodoDetail.jsx` · `DuePicker.jsx` | liste, ayrıntı paneli, tarih seçici |
 * | `TodoPhoneCard.jsx` · `TodoMobileBar.jsx` · `TodoAddFab.jsx` | telefon: Self Servis boyunda kart, tek araç satırı, yüzen ekleme |
 *
 * ⚠️ **KAPI ROTADA** (`App.jsx` › `access.todo`, kitle `lib/todoPolicy.js`).
 * Kapıda kalan kişiye bu parça hiç inmiyor.
 *
 * ⚠️ **"BUGÜN" ANASAYFA'NIN BUGÜNÜ** (`isFocus`) ve ekleme iki yüzeyde de aynı
 * kurala gidiyor; yazılan her şey `lib/todoSync.js` ile öteki yüzeyin
 * önbelleğini bayat sayıyor.
 *
 * ⚠️ **GÖRÜNÜM ADRESTE** (`?view=today|important|planned|all|done|list:<id>`),
 * `replace: true` — Keşfet'in `?sec=`i gibi. Tanınmayan değer Bugün'e düşer.
 *
 * ⚠️ **DÜZEN ANASAYFA'NIN** (`myspace-gutter` oluğu çentik için, `@container`
 * kapsayıcı sorguları rıhtım için, `OverlayScrollbar` çentiğin arkasından
 * geçmeyen çubuk için) — gerekçeleri o sayfada.
 */

function Notice({ tone = "muted", children }) {
  return (
    <p
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-[0.75rem] leading-snug",
        tone === "warn"
          ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "bg-muted/60 text-muted-foreground",
      )}
    >
      {children}
    </p>
  )
}

export function TodoPage() {
  const { t } = useLocale()
  // Postası artık bayraklı olmayan işaretli e-posta görevleri tablodan düşer.
  const realBoard = useFlaggedLeftovers(useTodoBoard())
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstBoard() : null
  const board = worst ? { ...realBoard, ...worst } : realBoard
  const [params, setParams] = useSearchParams()
  const [today, setToday] = useState(localDayKey)
  const [openId, setOpenId, closeTask] = useOpenTask(params, setParams)
  const [celebrate, setCelebrate] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const scrollRef = useRef(null)
  const boardRef = useRef(null)
  const addRef = useRef(null)
  const celebrateTimer = useRef(0)

  // Gün döndüyse "bugün" de dönsün (sekme gece açık kalınca). Dakikada bir.
  useEffect(() => {
    const id = setInterval(
      () => setToday((cur) => (cur === localDayKey() ? cur : localDayKey())),
      60_000,
    )
    return () => {
      clearInterval(id)
      clearTimeout(celebrateTimer.current)
    }
  }, [])

  const raw = params.get("view") ?? "today"
  const view =
    VIEWS.includes(raw) ||
    (raw.startsWith("list:") && board.lists.some((l) => `list:${l.id}` === raw))
      ? raw
      : "today"
  // Liste görünümü listeler inene kadar bekler — yer imiyle gelen `list:…`
  // ilk karede Bugün'e düşüp adresini kaybetmesin.
  const effectiveView = raw.startsWith("list:") && board.status === "loading" ? raw : view

  function setView(next, scroll = false) {
    const p = new URLSearchParams(params)
    if (next === "today") p.delete("view")
    else p.set("view", next)
    setParams(p, { replace: true })
    if (scroll)
      requestAnimationFrame(() =>
        boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      )
  }

  const summary = useMemo(() => boardSummary(board.tasks, today), [board.tasks, today])
  const ready = board.status === "ready"
  const { busy, quickAdd } = useQuickAdd(board, today)
  // Telefon (yatay da): masaüstü kartın yerine Self Servis boyunda telefon kartı (`docs/features/todo.md`).
  const phone = useIsMobile()
  const listShown = ![STATUS.denied, "denied", "error", STATUS.unauthenticated].includes(
    board.status,
  )

  function cheer() {
    setCelebrate(true)
    clearTimeout(celebrateTimer.current)
    celebrateTimer.current = setTimeout(() => setCelebrate(false), 1800)
  }

  /** Yenile — `true` başarılı (düğme onay işareti gösterir), değilse `false`. */
  async function onRefresh() {
    if (board.refreshing) return false
    const result = await board.refresh()
    if (!result) return false
    if (result.status === STATUS.ready) {
      showResultToast(
        result.added
          ? {
              title: t("todo.refreshedTitle"),
              detail: t("todo.refreshedNew", { count: result.added }),
            }
          : { title: t("todo.refreshedSameTitle"), detail: t("todo.refreshedSame") },
      )
    } else if (result.kept) {
      showResultToast({
        state: "error",
        title: t("todo.refreshFailed"),
        detail: withCause(t("todo.refreshFailedBody"), causeText(t, result.detail)),
      })
    }
    return result.status === STATUS.ready
  }

  const strip = phone && (
    <TodoPhoneCard
      board={board}
      summary={summary}
      today={today}
      celebrate={celebrate}
      busy={busy}
      onView={(v) => setView(v)}
    />
  )

  const deletingCount = deleting ? board.tasks.filter((x) => x.listId === deleting.id).length : 0

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <PageShell className={phone ? "pb-28" : "pb-16"}>
          <div className="@container/todo">
            {/* Sayfa başlığı en üstte (öteki sayfalar gibi); telefonda üst çubuk sayfanın adını taşır. */}
            {phone ? (
              <h1 className="sr-only">{t("nav.todo")}</h1>
            ) : (
              <PageHeading
                eyebrow={t("todo.board.eyebrow")}
                title={t("todo.board.title")}
                className="mb-6"
              />
            )}

            {/* ── Tek kart: karşılama + durum (düzen `TodoSummaryCard`ta) ─── */}
            {!phone && (
              <TodoSummaryCard
                board={board}
                summary={summary}
                today={today}
                celebrate={celebrate}
                busy={busy}
                onQuickAdd={quickAdd}
                onView={(v) => setView(v, true)}
              />
            )}
            {phone && !listShown && strip}

            {/* ── Liste ─────────────────────────────────────────────────── */}
            <section
              ref={boardRef}
              aria-labelledby="todo-board-title"
              className={cn(
                "scroll-mt-6",
                phone ? (listShown ? "" : "mt-4") : "mt-8 shortest:mt-6",
              )}
            >
              <h2 id="todo-board-title" className="sr-only">
                {t("todo.board.title")}
              </h2>

              {/* Eksik tabloyu SÖYLE — "soramadık ≠ veri yok". */}
              {ready && (board.skipped > 0 || board.doneMissing || board.truncated) && (
                <div className="mb-5 space-y-2">
                  {board.skipped > 0 && (
                    <>
                      <Notice tone="warn">{t("todo.partial", { n: board.skipped })}</Notice>
                      <ErrorCause detail={board.detail} className="mt-1" />
                    </>
                  )}
                  {board.doneMissing && <Notice tone="warn">{t("todo.doneMissing")}</Notice>}
                  {board.truncated && effectiveView === "done" && (
                    <Notice>{t("todo.truncated")}</Notice>
                  )}
                </div>
              )}

              <FlaggedLeftovers flagged={board.flagged} view={effectiveView} today={today} />

              {board.status === "denied" || board.status === STATUS.denied ? (
                <div className="rounded-[1.5rem] border border-border bg-card px-6 py-12 text-center">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="mx-auto mb-3 size-8 text-muted-foreground/40"
                    strokeWidth={1.5}
                  />
                  <p className="text-[0.9375rem] font-medium">{t("todo.denied")}</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {t("todo.deniedBody")}
                  </p>
                  <ErrorCause detail={board.detail} className="mx-auto" />
                  <button
                    type="button"
                    onClick={board.connect}
                    className="mt-4 rounded-full bg-brand-fill-deep px-4 py-2 text-[0.8125rem] font-semibold text-brand-on-brand"
                  >
                    {t("todo.connect")}
                  </button>
                </div>
              ) : board.status === "error" ? (
                <div className="rounded-[1.5rem] border border-border bg-card px-6 py-12 text-center">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="mx-auto mb-3 size-8 text-muted-foreground/40"
                    strokeWidth={1.5}
                  />
                  <p className="text-[0.9375rem] font-medium">{t("todo.error")}</p>
                  <ErrorCause detail={board.detail} className="mx-auto mt-1.5" />
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="bg-muted mt-4 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition hover:bg-accent"
                  >
                    {t("todo.retry")}
                  </button>
                </div>
              ) : board.status === STATUS.unauthenticated ? (
                <Notice>{t("todo.signedOutBody")}</Notice>
              ) : (
                <TodoBoard
                  board={board}
                  today={today}
                  view={effectiveView}
                  onView={(v) => setView(v)}
                  onOpenTask={(task) => setOpenId(task.id)}
                  onDeleteList={setDeleting}
                  onCompleted={cheer}
                  addRef={addRef}
                  compact={phone}
                  lead={strip}
                  onRefresh={ready ? onRefresh : undefined}
                  actions={
                    ready && (
                      // Yenile — ortak `RefreshButton`, aramanın ve sıralamanın sağında.
                      <RefreshButton busy={board.refreshing} onRefresh={onRefresh} />
                    )
                  }
                />
              )}
            </section>

            <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-brand">
                  ✦
                </span>
                {t("todo.footer")}
              </span>
              <span>
                {t("nav.todo")} · <strong className="font-semibold text-foreground/80">tyro</strong>
              </span>
            </footer>
          </div>
        </PageShell>
      </div>
      <OverlayScrollbar targetRef={scrollRef} avoidNotch />

      <TodoDetail
        board={board}
        taskId={openId}
        // Liste inmeden boş panel açılmasın: iş bulununca açılır.
        open={Boolean(openId) && board.tasks.some((x) => x.id === openId)}
        onOpenChange={(next) => !next && closeTask()}
        onCompleted={cheer}
      />

      <DestructiveDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        icon={Delete02Icon}
        title={t("todo.lists.deleteTitle")}
        description={t("todo.lists.deleteBody", { n: deletingCount })}
        subject={deleting?.name}
        consequences={[{ kind: "gone", text: t("todo.lists.deleteGone") }]}
        confirmLabel={t("todo.lists.deleteConfirm")}
        cancelLabel={t("todo.cancel")}
        onConfirm={async () => {
          const list = deleting
          setDeleting(null)
          if (view === `list:${list.id}`) setView("today")
          await board.removeList(list.id)
        }}
      />
      {/* İlk ziyarette kısa tur — pano okununca (hedefler ancak o zaman var). */}
      <Tour id="todo" page when={ready} />
    </div>
  )
}
