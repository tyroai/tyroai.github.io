import "./tasks/tasks.css"
import "./tasks/tasksForm.css"
import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useScrollFade } from "@/hooks/useScrollFade"
import { rowKey, shownOrder } from "@/lib/focusAdopt"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { suggestCount } from "@/features/myspace/lib/todoSuggest"
import { Card, CardTitle } from "./CardShell"
import { FocusEmpty } from "./FocusEmpty"
import { TaskAdd } from "./tasks/TaskAdd"
import { TaskDetail } from "./tasks/TaskDetail"
import { TaskRow } from "./tasks/TaskRow"
import { TaskSuggestions } from "./tasks/TaskSuggestions"
import { TasksNote } from "./tasks/TasksNote"
import { useSettling } from "./tasks/useSettling"
import { useTaskSuggestions } from "./tasks/useTaskSuggestions"

const OPTS_DAY_MONTH = { day: "numeric", month: "short" }

/**
 * BUGÜNÜN GÖREVLERİ — To Do'nun bugünü (yoksa bu tarayıcının listesi; tek kapı `useFocusTasks`).
 *
 * Düzen: başlık (ilerleme kapsülü "2/5" — halka yok, bilgi bir kez) · TEK kaydırma alanı (açık işler,
 * öneriler, bitenler) · dipte sabit ekleme alanı. Kaydırma alanı kartın boyuna göre büyür ya da
 * küçülür (`flex-basis` en çok ~3 satır): sabit boylu pano satırında ekleme alanı çerçeveye taşmaz.
 * Başlığa basınca ayrıntı açılır (masaüstünde balon, telefonda alttan çekmece). Biten iş bir an
 * yerinde kalır, sonra bitenlerin arasına kayar (`useSettling`). Öneriden "Bugüne al" işi hemen
 * listeye taşır (`useTaskSuggestions`). Ayrıntı: `docs/features/anasayfa-odak.md`.
 */
export function FocusCard({ focus, board = null, canOpenTodo = false, className }) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const scroll = useRef(null)
  useScrollFade(scroll, "y", 16)
  const [openId, setOpenId] = useState(null)
  const [shownId, setShownId] = useState(null)
  const [settling, hold] = useSettling()
  const { tasks, mode } = focus
  const todo = mode === "todo"
  const done = tasks.filter((x) => x.done).length
  const total = tasks.length
  const blocked = focus.loading || focus.status === "error"
  const dayFmt = getDateTimeFormat(locale, OPTS_DAY_MONTH)
  const suggest = useTaskSuggestions(todo ? board : null, suggestCount(total - done), focus)
  const rows = useMemo(() => shownOrder(tasks, settling), [tasks, settling])
  // Öneriler açık işlerin hemen altında, bitenlerin üstünde: kaydırmadan görünsünler.
  const openCount = rows.findIndex((x) => x.done && !settling.has(x.id))
  const cut = openCount < 0 ? rows.length : openCount
  const boardTasks = board?.tasks
  const metaOf = useMemo(() => new Map((boardTasks ?? []).map((x) => [x.id, x])), [boardTasks])
  const empty = total === 0 && !suggest.picks.length
  // Kaydırma alanının doğal boyu kaç satırlık (öneriler başlığıyla); boşken boş hâle yer.
  const fit = empty ? 3 : total + (suggest.picks.length ? suggest.picks.length + 1 : 0)

  const toggle = (task) => {
    if (!task.done) hold(task.id)
    focus.toggle(task.id)
  }
  const show = (id) => (open) => {
    setOpenId(open ? id : null)
    if (open) setShownId(id)
  }
  const close = () => setOpenId(null)
  const detailOf = (task) => (
    <TaskDetail
      task={task}
      meta={metaOf.get(task.id)}
      todo={todo}
      canOpenTodo={canOpenTodo}
      onToggle={toggle}
      onRemove={focus.remove}
      onClose={close}
    />
  )
  const sheetTask = mobile ? tasks.find((x) => x.id === shownId) : null
  const rowOf = (task) => (
    <TaskRow
      key={rowKey(task)}
      task={task}
      todo={todo}
      meta={metaOf.get(task.id)}
      dayFmt={dayFmt}
      mobile={mobile}
      open={openId === task.id}
      onOpenChange={show(task.id)}
      detail={!mobile && openId === task.id ? detailOf(task) : null}
      onToggle={toggle}
      onRemove={focus.remove}
    />
  )

  return (
    <Card
      data-tour="focus"
      className={cn("@container/widget", className)}
      aria-busy={focus.loading ? true : undefined}
    >
      <div className="tasks">
        <CardTitle
          leadingIcon={CheckmarkCircle02Icon}
          action={
            todo && canOpenTodo ? (
              <Link
                to="/todo"
                aria-label={t("myspace.focus.openTodoPage")}
                title={t("myspace.focus.openTodoPage")}
                className="tasks-open"
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
              </Link>
            ) : null
          }
        >
          {/* Dar kartta (içerik < 16rem) kısa ad: sayaç ve okun yanında "Bugünün gö…" kalıyordu. */}
          <span className="truncate @max-[16rem]/widget:hidden">{t("myspace.tasks.title")}</span>
          <span className="hidden truncate @max-[16rem]/widget:inline">
            {t("myspace.tasks.titleShort")}
          </span>
          {!blocked && total > 0 && (
            <span
              className="tasks-progress"
              data-all={done === total || undefined}
              style={{ "--p": done / total }}
            >
              {done === total && (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} aria-hidden="true" />
              )}
              <span aria-hidden="true">
                {done}/{total}
              </span>
              <span className="sr-only">
                {done === total
                  ? t("myspace.tasks.allDone")
                  : t("myspace.progress.count", { done, total })}
              </span>
            </span>
          )}
        </CardTitle>

        {focus.loading ? (
          <>
            <span className="sr-only">{t("myspace.loading")}</span>
            <div aria-hidden="true" className="mt-2 space-y-2.5">
              {["82%", "64%", "74%"].map((w) => (
                <div key={w} className="flex items-center gap-2.5 py-0.5">
                  <span className="ms-skeleton size-4 shrink-0 rounded-full" />
                  <span className="ms-skeleton h-3 rounded-full" style={{ width: w }} />
                </div>
              ))}
            </div>
          </>
        ) : focus.status === "error" ? (
          // ⚠️ Ağ/sunucu hatası YEREL LİSTEYE DÜŞMEZ (gerekçe `useFocusTasks`).
          <div className="mt-3 space-y-2">
            <p className="text-[0.8125rem] leading-snug text-muted-foreground">
              {t("myspace.todo.error")}
            </p>
            <ErrorCause detail={focus.detail} className="mt-0" />
            <button
              type="button"
              onClick={focus.retry}
              className="rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition hover:bg-accent [@media(pointer:coarse)]:min-h-10"
            >
              {t("calendar.retry")}
            </button>
          </div>
        ) : (
          <>
            <div ref={scroll} className="tasks-scroll" style={{ "--tasks-rows": fit }}>
              <ul className="tasks-rows">
                <AnimatePresence initial={false} mode="popLayout">
                  {rows.slice(0, cut).map(rowOf)}
                  {suggest.picks.length > 0 && (
                    <motion.li
                      key="tasks-suggest"
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.14 } }}
                    >
                      <TaskSuggestions
                        picks={suggest.picks}
                        today={suggest.today}
                        canOpenTodo={canOpenTodo}
                        onTake={suggest.take}
                      />
                    </motion.li>
                  )}
                  {rows.slice(cut).map(rowOf)}
                </AnimatePresence>
              </ul>
              {empty && <FocusEmpty />}
            </div>
            <TaskAdd focus={focus} />
          </>
        )}

        <TasksNote focus={focus} todo={todo} blocked={blocked} />
      </div>

      {mobile && (
        <BottomSheet
          open={Boolean(openId && sheetTask)}
          onOpenChange={(open) => !open && close()}
          title={t("myspace.tasks.title")}
        >
          {sheetTask && <div className="tasks-sheet">{detailOf(sheetTask)}</div>}
        </BottomSheet>
      )}
    </Card>
  )
}
