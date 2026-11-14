import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { SORTS, groupTasks, keyToDate, searchTasks, tasksForView } from "@/lib/todoInsights"
import { FIRST_DAY } from "@/lib/weekStart"
import { cn } from "@/lib/utils"
import { EmptyState, RowsSkeleton } from "./BoardStates"
import { SelectionBar } from "./SelectionBar"
import { TaskRow } from "./TaskRow"
import { TodoAddBar } from "./TodoAddBar"
import { ChipStrip } from "./TodoChipStrip"
import { Rail } from "./TodoRail"
import { TodoAddFab } from "./TodoAddFab"
import { TodoMobileBar } from "./TodoMobileBar"
import { CountText } from "./CountText"
import { useTaskSelection } from "./useTaskSelection"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  To-Do'nun LİSTE bölümü — görünümler · listeler · ekleme · gruplar
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Microsoft To Do'nun kendi iskeleti: solda akıllı görünümler (Bugün ·
 * Önemli · Planlanan · Tümü · Tamamlanan) ve kişinin listeleri, sağda seçili
 * görünümün grupları. "Günüm" (My Day) YOK — Graph o görünümü vermiyor;
 * "Bugün" teslim tarihiyle tanımlı ve Akışım'ın "Bugünün odağı"nın aynısı
 * (`lib/todoInsights.js` › `isFocus`).
 *
 * ⚠️ **DÜZEN KAPSAYICIYLA** (`@container/board`): sohbet rıhtımı açılınca
 * sayfa daralıyor ama görüntü alanı aynı kalıyor (Keşfet'in dersi). Dar
 * kapsayıcıda ray yatay bir çip şeridine iniyor — görünümler aynı anda iki
 * yerde çizilmiyor.
 *
 * ⚠️ **İŞARETLENEN SATIR BİR AN YERİNDE KALIR** (`keepOpen`, 1,1 sn): To
 * Do'nun kendi davranışı. Anında yok olan satır "yanlışlıkla mı bastım?"
 * dedirtiyordu; üstü çizili hâli görünüp sonra tamamlananlara kayıyor.
 */

const KEEP_MS = 1100
const OPTS_GROUP_DAY = { weekday: "long", day: "numeric", month: "long" }

/* ─── Gruplar ─────────────────────────────────────────────────────────── */

function GroupHead({ group, count, collapsed, onToggle }) {
  const { t, locale } = useLocale()
  const label = group.label
    ? t(group.label)
    : (group.raw ??
      (group.dateKey
        ? getDateTimeFormat(locale, OPTS_GROUP_DAY).format(keyToDate(group.dateKey))
        : null))
  if (!label) return null
  const cls = cn(
    "flex items-center gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em]",
    group.tone === "overdue" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
  )
  if (!group.collapsible) {
    return (
      <h4 className={cls} lang={locale}>
        <span className="[&::first-letter]:uppercase">{label}</span>
        <span className="tabular-nums font-medium">
          <CountText n={count} />
        </span>
      </h4>
    )
  }
  return (
    <h4 className="px-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className={cn(
          cls,
          "rounded-lg outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/30 pointer-coarse:min-h-11",
        )}
        lang={locale}
      >
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={cn("size-3.5 transition-transform", collapsed && "-rotate-90")}
          strokeWidth={2.2}
        />
        {label}
        <span className="tabular-nums font-medium">
          <CountText n={count} />
        </span>
      </button>
    </h4>
  )
}

/* ─── Bölüm ───────────────────────────────────────────────────────────── */

export function TodoBoard({
  board,
  today,
  view,
  onView,
  onOpenTask,
  onDeleteList,
  onCompleted,
  addRef,
  actions,
  compact = false,
  lead,
  onRefresh,
}) {
  const { t, locale } = useLocale()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("smart")
  const [keepOpen, setKeepOpen] = useState(() => new Set())
  const [fresh, setFresh] = useState(() => new Set())
  const [collapsed, setCollapsed] = useState(() => new Set(["done"]))
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const listById = useMemo(() => new Map(board.lists.map((l) => [l.id, l])), [board.lists])
  const counts = useMemo(() => {
    const open = board.tasks.filter((x) => !x.done)
    const c = {
      today: open.filter((x) => x.dueKey && x.dueKey <= today).length,
      important: open.filter((x) => x.importance === "high").length,
      planned: open.filter((x) => x.dueKey).length,
      all: open.length,
    }
    for (const l of board.lists) c[`list:${l.id}`] = open.filter((x) => x.listId === l.id).length
    return c
  }, [board.tasks, board.lists, today])

  const firstDay = FIRST_DAY[locale] ?? 1
  const scoped = useMemo(
    () => searchTasks(tasksForView(board.tasks, view, today), query),
    [board.tasks, view, today, query],
  )
  const groups = useMemo(
    () => groupTasks(scoped, view, { today, lists: board.lists, sort, locale, firstDay, keepOpen }),
    [scoped, view, today, board.lists, sort, locale, firstDay, keepOpen],
  )
  const showList = !view?.startsWith("list:") && board.lists.length > 1
  const title = view?.startsWith("list:")
    ? (listById.get(view.slice(5))?.name ?? "")
    : t(`todo.view.${view}`)
  const activeList = view?.startsWith("list:") ? listById.get(view.slice(5)) : null
  const openCount = scoped.filter((x) => !x.done).length
  const selection = useTaskSelection(groups, collapsed, view)
  const loading = board.status === "loading"
  const canAdd =
    !loading &&
    !selection.active &&
    view !== "done" &&
    activeList?.kind !== "flagged" &&
    board.status === "ready"
  const tools = <>{actions}</>

  function toggle(task) {
    const next = !task.done
    board.updateTask(task.id, { done: next })
    if (next) {
      onCompleted?.()
      setKeepOpen((s) => new Set(s).add(task.id))
      timers.current.push(
        setTimeout(() => {
          setKeepOpen((s) => {
            const n = new Set(s)
            n.delete(task.id)
            return n
          })
        }, KEEP_MS),
      )
    }
  }

  function added(task, replaces) {
    setFresh((s) => {
      const n = new Set(s)
      if (replaces) n.delete(replaces)
      n.add(task.id)
      return n
    })
    timers.current.push(
      setTimeout(() => {
        setFresh((s) => {
          const n = new Set(s)
          n.delete(task.id)
          return n
        })
      }, 1700),
    )
  }

  return (
    <div className="@container/board">
      <div className="grid gap-6 @[52rem]/board:grid-cols-[14.5rem_minmax(0,1fr)] @[52rem]/board:gap-10">
        <aside className="hidden @[52rem]/board:block">
          <div data-tour="todo-views" className="sticky top-4">
            {loading ? (
              <div aria-hidden="true" className="space-y-2 px-3 pt-1">
                {[70, 55, 62, 40, 58].map((w) => (
                  <span
                    key={w}
                    className="ms-skeleton block h-4 rounded-full"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : (
              <Rail
                board={board}
                view={view}
                counts={counts}
                today={today}
                onView={onView}
                onDeleteList={onDeleteList}
              />
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {compact ? (
            // Telefon: şerit + tek araç satırı (yatay telefonda yan yana), ekleme yüzen düğmede.
            <div className="todo-mhead">
              {lead}
              <TodoMobileBar
                board={board}
                view={view}
                title={title}
                count={!loading && view !== "done" ? openCount : null}
                counts={counts}
                today={today}
                onView={onView}
                onDeleteList={onDeleteList}
                query={query}
                onQuery={setQuery}
                sort={sort}
                onSort={setSort}
                onRefresh={onRefresh}
              />
            </div>
          ) : (
            !loading && (
              <div data-tour="todo-views-strip" className="mb-4 @[52rem]/board:hidden">
                <ChipStrip board={board} view={view} counts={counts} onView={onView} />
              </div>
            )
          )}

          <div
            className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3"
            hidden={compact}
          >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className="flex min-w-0 items-center gap-2 text-[1.375rem] font-semibold tracking-[-0.02em]"
                  lang={locale}
                >
                  <span className="truncate">{title}</span>
                  {!loading && view !== "done" && (
                    <span className="text-[0.875rem] font-medium tabular-nums text-muted-foreground">
                      {openCount}
                    </span>
                  )}
                </h3>
                {activeList?.isShared && (
                  <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                    {t("todo.lists.shared")}
                  </p>
                )}
              </div>
              {/* Dar panoda Yenile başlığın yanında: arama satırda yer bulsun ("Gör…" diye kesilmesin). */}
              <span className="flex shrink-0 items-center gap-2 @[40rem]/board:hidden">
                {tools}
              </span>
            </div>
            <div className="flex w-full items-center gap-2 @[40rem]/board:w-auto">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder={t("todo.search.placeholder")}
                label={t("todo.search.aria")}
                shortcut
                className="flex-1 @[40rem]/board:w-60 @[40rem]/board:flex-none"
              />
              {view !== "done" && (
                <select
                  aria-label={t("todo.sort.label")}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  // Araç çubuğu standardı: açılır seçim de gri kapsül (macOS açılır düğmesi).
                  className="h-control max-w-[8.5rem] shrink-0 truncate rounded-full border-0 bg-muted px-3 text-callout text-foreground outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/40 @[40rem]/board:max-w-none"
                >
                  {SORTS.map((s) => (
                    <option key={s} value={s}>
                      {t(`todo.sort.${s}`)}
                    </option>
                  ))}
                </select>
              )}
              <span className="hidden @[40rem]/board:contents">{tools}</span>
            </div>
          </div>

          {canAdd && compact && (
            <TodoAddFab board={board} view={view} today={today} onAdded={added} inputRef={addRef} />
          )}
          {canAdd && !compact && (
            <div className="mt-5">
              {/* Anahtar görünüm: görünüm değişince varsayılanlar (bugünün
                  tarihi, yıldız, liste) o görünümünkine döner — efekt içinde
                  `setState` yerine yeniden kurulum (deponun lint kuralı). */}
              <TodoAddBar
                key={view}
                board={board}
                view={view}
                today={today}
                onAdded={added}
                inputRef={addRef}
              />
            </div>
          )}

          <div data-tour="todo-list" className={cn("mt-6 space-y-6", compact && "mt-4 space-y-4")}>
            {loading && <RowsSkeleton />}
            {!loading && board.status === "ready" && !groups.length && (
              <EmptyState view={view} searching={Boolean(query.trim())} />
            )}
            {groups.map((g) => {
              const isCollapsed = g.collapsible && collapsed.has(g.id)
              return (
                <section key={g.id} aria-label={g.label ? t(g.label) : (g.raw ?? undefined)}>
                  <GroupHead
                    group={g}
                    count={g.tasks.length}
                    collapsed={isCollapsed}
                    onToggle={() =>
                      setCollapsed((s) => {
                        const n = new Set(s)
                        if (n.has(g.id)) n.delete(g.id)
                        else n.add(g.id)
                        return n
                      })
                    }
                  />
                  {!isCollapsed && (
                    <ul className="ms-surface rounded-[1.5rem] p-1.5">
                      {g.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          list={listById.get(task.listId)}
                          today={today}
                          showList={showList}
                          onToggle={toggle}
                          onStar={(x) =>
                            board.updateTask(x.id, {
                              importance: x.importance === "high" ? "normal" : "high",
                            })
                          }
                          onOpen={onOpenTask}
                          fresh={fresh.has(task.id)}
                          board={board}
                          selecting={selection.active}
                          selected={selection.ids.has(task.id)}
                          onSelect={(x, e) => selection.toggle(x.id, e?.shiftKey)}
                          onStartSelect={(x) => selection.start(x.id)}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
          {selection.active && (
            <SelectionBar
              selection={selection}
              board={board}
              listById={listById}
              onCompleted={onCompleted}
            />
          )}
        </div>
      </div>
    </div>
  )
}
