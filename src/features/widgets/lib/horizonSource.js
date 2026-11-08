import { STATUS } from "@/lib/graph"
import { toMilestone } from "@/lib/horizon"
import { describeFailure, getPages, isPermanent, warnFailure } from "@/lib/todo"
import { LIST_KIND, toBoardTask } from "@/lib/todoBoard"

/**
 * Ufukta'nın To Do okuması — yalnız SEÇİLEN listeler. Kurallar To-Do sayfasıyla ortak
 * (`lib/todo.js`, `lib/todoBoard.js`): `$select` yok; açık görevler önce adımlarıyla
 * (`$expand=checklistItems`) istenir, kalıcı bir retle oturum boyunca adımsız sorguya inilir;
 * süzgeçli sorgu da reddedilirse süzgeçsiz yedek. Tamamlananlar yalnız istenince (tek sayfa).
 */
const enc = encodeURIComponent
const OPEN_PAGES = 3
const FALLBACK_PAGES = 10
let expandSteps = true

/** Çıkışta — bir sonraki oturum tam sorguyla başlasın. */
export function resetHorizonQuery() {
  expandSteps = true
}

export async function fetchTodoLists(instance, account) {
  const res = await getPages(instance, account, "/me/todo/lists", 3)
  if (res.status !== STATUS.ready) {
    warnFailure("listeler", res)
    return { ...res, detail: describeFailure(res, "lists") }
  }
  return {
    status: STATUS.ready,
    lists: res.data.map((l) => ({
      id: l.id,
      name: String(l.displayName ?? ""),
      kind: LIST_KIND[l.wellknownListName] ?? "custom",
      isShared: Boolean(l.isShared),
    })),
  }
}

async function readOpen(instance, account, base, label) {
  const open = `${base}?$filter=${enc("status ne 'completed'")}`
  if (expandSteps) {
    const res = await getPages(
      instance,
      account,
      `${open}&$expand=checklistItems&$top=100`,
      OPEN_PAGES,
    )
    if (res.status === STATUS.ready || !isPermanent(res)) return res
    warnFailure(`"${label}" adımlı sorgu`, res)
    expandSteps = false
  }
  const res = await getPages(instance, account, `${open}&$top=100`, OPEN_PAGES)
  if (!isPermanent(res)) return res
  warnFailure(`"${label}" süzgeçli sorgu`, res)
  return getPages(instance, account, base, FALLBACK_PAGES)
}

/** Bir listenin tarihli görevleri: `{ tasks }` ya da `{ failed }`. */
export async function fetchListMilestones(instance, account, list, { done = false } = {}) {
  const base = `/me/todo/lists/${enc(list.id)}/tasks`
  const open = await readOpen(instance, account, base, list.name || list.id)
  if (open.status !== STATUS.ready) return { failed: open }
  let raw = open.data
  if (done) {
    const res = await getPages(
      instance,
      account,
      `${base}?$filter=${enc("status eq 'completed'")}&$top=100`,
      1,
    )
    if (res.status === STATUS.ready) raw = [...raw, ...res.data]
    else warnFailure(`"${list.name || list.id}" tamamlananlar`, res)
  }
  const seen = new Set()
  const tasks = []
  for (const item of raw) {
    if (seen.has(item?.id)) continue
    seen.add(item?.id)
    const milestone = toMilestone(toBoardTask(item, list.id), list.name)
    // Süzgeçsiz yedek tamamlananları da getirir: istenmediyse düşer.
    if (milestone && (done || !milestone.done)) tasks.push(milestone)
  }
  return { tasks }
}
