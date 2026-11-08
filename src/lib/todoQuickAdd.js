import { STATUS } from "@/lib/graph"
import { createFocusTask, getPages, localDayKey } from "@/lib/todo"
import { peekFocusTasks } from "@/hooks/useFocusTasks"
import { notifyTodoChanged } from "@/lib/todoSync"

/**
 * Hızlı görev (Denetim Merkezi): başlığı To Do'nun varsayılan listesine bugünün tarihiyle yazar —
 * Anasayfa'nın "Bugünün odağı"na ve To-Do'nun Bugün'üne düşer. Varsayılan liste bellekteki son
 * okumadan (`peekFocusTasks`), yoksa listelerden bulunur. Yazınca öteki ekranlar haber alır
 * (`notifyTodoChanged`). Dönen: `{ status, task? }` (Graph'ın sonucu).
 */
export async function addQuickTask(instance, account, title) {
  const text = String(title ?? "").trim()
  if (!text) return { status: STATUS.error }
  let listId = peekFocusTasks()?.defaultListId ?? null
  if (!listId) {
    const lists = await getPages(instance, account, "/me/todo/lists", 2)
    if (lists.status !== STATUS.ready) return lists
    const all = lists.data ?? []
    listId = (all.find((l) => l.wellknownListName === "defaultList") ?? all[0])?.id ?? null
    if (!listId) return { status: STATUS.error }
  }
  const res = await createFocusTask(instance, account, {
    listId,
    title: text,
    today: localDayKey(),
  })
  if (res.status === STATUS.ready) notifyTodoChanged("control")
  return res
}
