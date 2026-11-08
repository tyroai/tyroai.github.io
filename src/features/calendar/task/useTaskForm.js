import { useCallback, useId, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { keyToDay } from "@/features/calendar/lib/range"
import {
  createStepsInOrder,
  initialTask,
  stepTitles,
  taskArgs,
  taskErrors,
} from "@/features/calendar/lib/task"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { dayMonth } from "../format"

/**
 * Yeni görev formunun durumu ve gönderimi. `target`: `{ day, initial? }` (son tarih tıklanan gün),
 * `board`: `useTodoBoard` (liste, `addTask`, `createStep`), `onDone`: eklenince. Gönderim önce
 * görevi (`addTask`: iyimser, takvimde hemen görünür; reddedilirse geri alınır), sonra adımları
 * SIRAYLA ekler (To Do aynı anda 2 istek ister). Başarısızlıkta form olduğu gibi kalır, nedeni
 * `failure`da (`failed` görev yazılamadı · `steps` görev yazıldı ama bazı adımlar yazılamadı).
 * İkincisinde görev bir daha yaratılmaz: form kilitlenir (`saved`) ve yeniden deneme yalnız kalan
 * adımları yazar. Zorunlu alan (başlık) ancak ilk denemeden sonra kırmızı yanar (`attempted`).
 */
export function useTaskForm({ target, board, onDone }) {
  const { t, locale } = useLocale()
  const idBase = useId().replace(/:/g, "")
  const [start] = useState(() => initialTask(target))
  const [v, setV] = useState(start)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  // Görev yazıldı, adımlardan bazıları yazılamadı: `{ task, titles, steps }` (yazılmış adımlar).
  const [saved, setSaved] = useState(null)
  const errors = useMemo(() => taskErrors(v), [v])
  // İşaretli e-posta listesine görev yazılmaz (To-Do'nun hızlı ekleme çubuğuyla aynı kural).
  const lists = useMemo(() => board.lists.filter((l) => l.kind !== "flagged"), [board.lists])
  const listId = v.listId ?? board.defaultListId

  const set = useCallback((patch) => {
    setV((cur) => ({ ...cur, ...patch }))
    setFailure(null)
  }, [])

  async function submit(e) {
    e?.preventDefault()
    if (busy) return
    setAttempted(true)
    if (!saved && errors.title) {
      requestAnimationFrame(() => document.getElementById(`${idBase}-title`)?.focus())
      return
    }
    setBusy(true)
    setFailure(null)
    try {
      let task = saved?.task ?? null
      if (!task) {
        // `null`: pano hazır değil. Reddedilirse `addTask` geçici satırı kendisi geri alır.
        const added = board.addTask(taskArgs(v, board.defaultListId))
        task = added ? await added.promise : null
        if (!task) {
          setBusy(false)
          setFailure({ kind: "failed" })
          return
        }
      }
      const titles = saved?.titles ?? stepTitles(v.steps)
      const done = saved?.steps ?? []
      const out = await createStepsInOrder(
        async (title) => {
          const res = await board.createStep(task, title)
          return res.status === STATUS.ready ? res.step : null
        },
        titles,
        done.length,
      )
      const steps = [...done, ...out.created]
      // Pano görevin adımlarını bilsin (To-Do sayfasındaki satır ek istek atmasın).
      if (out.created.length) board.setTaskSteps(task.id, steps)
      if (out.failedAt !== null) {
        setSaved({ task, titles, steps })
        setBusy(false)
        setFailure({ kind: "steps", done: steps.length, total: titles.length })
        return
      }
      const list = lists.find((l) => l.id === task.listId)
      const due = v.dueKey ? dayMonth(keyToDay(v.dueKey), locale) : ""
      notify.success(t("calendar.page.taskAdded"), {
        description: [list?.name, due].filter(Boolean).join(" · "),
      })
      onDone()
    } catch {
      // Beklenmedik hata: düğme takılı kalmasın, form olduğu gibi kalır.
      setBusy(false)
      setFailure({ kind: "failed" })
    }
  }

  const dirty = Boolean(
    v.title.trim() ||
    v.note.trim() ||
    v.important ||
    stepTitles(v.steps).length ||
    v.dueKey !== start.dueKey ||
    v.listId !== start.listId,
  )
  return {
    v,
    set,
    errors,
    attempted,
    busy,
    failure,
    dirty,
    lists,
    listId,
    saved: Boolean(saved),
    submit,
    idBase,
  }
}
