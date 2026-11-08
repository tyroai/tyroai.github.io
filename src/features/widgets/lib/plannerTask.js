import { STATUS, graphGet, graphPatch } from "@/lib/graph"

const TASKS = ["Tasks.ReadWrite"]
const pathOf = (id) => `/planner/tasks/${encodeURIComponent(id)}`

/**
 * Planner işinin ilerlemesini yazar (100 = tamam; geri alırken eski değer). Planner güncellemesi
 * işin son sürümünü ister (`If-Match`): başkası arada değiştirdiyse (412) iş yeniden okunur ve bir
 * kez daha denenir; iş zaten o durumdaysa başarı sayılır. Dönüş `{ status, etag }`; iş silinmişse
 * `status: "gone"`.
 */
export async function setPlannerPercent(instance, account, { id, etag }, percent) {
  const read = async () => {
    const res = await graphGet(instance, account, { path: pathOf(id), scopes: TASKS })
    if (res.status === STATUS.ready) return { status: STATUS.ready, task: res.data }
    return { status: res.httpStatus === 404 ? "gone" : res.status }
  }
  const write = (tag) =>
    graphPatch(instance, account, {
      path: pathOf(id),
      scopes: TASKS,
      headers: { "If-Match": tag, Prefer: "return=representation" },
      body: { percentComplete: percent },
    })

  let tag = etag
  if (!tag) {
    const fresh = await read()
    if (fresh.status !== STATUS.ready) return { status: fresh.status }
    tag = fresh.task["@odata.etag"]
  }
  let res = await write(tag)
  if (res.status === STATUS.error && res.httpStatus === 412) {
    const fresh = await read()
    if (fresh.status !== STATUS.ready) return { status: fresh.status }
    if ((fresh.task.percentComplete ?? 0) === percent)
      return { status: STATUS.ready, etag: fresh.task["@odata.etag"] ?? null }
    res = await write(fresh.task["@odata.etag"])
  }
  if (res.status === STATUS.error && res.httpStatus === 404) return { status: "gone" }
  if (res.status !== STATUS.ready) return { status: res.status }
  return { status: STATUS.ready, etag: res.data?.["@odata.etag"] ?? null }
}

/** Önbellekteki Planner okumasından işi çıkarır (`updateWidget` için). */
export const dropPlannerTask = (id) => (value) => {
  const tasks = value.data?.tasks ?? []
  if (!tasks.some((x) => x.id === id)) return value
  return {
    ...value,
    data: { ...value.data, total: value.data.total - 1, tasks: tasks.filter((x) => x.id !== id) },
  }
}

const dueTime = (x) => x.due?.getTime() ?? Infinity

/** Geri alınan işi okumaya teslim sırasıyla geri koyar. */
export const restorePlannerTask = (task) => (value) => {
  const tasks = value.data?.tasks ?? []
  if (tasks.some((x) => x.id === task.id)) return value
  return {
    ...value,
    data: {
      ...value.data,
      total: value.data.total + 1,
      tasks: [...tasks, task].sort((a, b) => dueTime(a) - dueTime(b)),
    },
  }
}
