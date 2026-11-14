import type { MsalAccount, MsalInstance } from "@/lib/graphRequest"
import { STATUS } from "@/lib/graph"
import { graphWriteEpoch } from "@/lib/graphRequest"
import {
  LIST_CONCURRENCY,
  describeFailure,
  focusOrder,
  getPages,
  localDayKey,
  mapPool,
  toFocusTask,
  warnFailure,
} from "@/lib/todo"
import { readBoardList, stepsInline, toBoardList, toBoardTask } from "@/lib/todoBoard"

/**
 * TEK GÖREV TARAMASI. Anasayfa'da "Bugünün görevleri" (odak) ile To Do kartları ve brifing (tablo)
 * aynı listeleri ayrı ayrı tarıyordu: liste başına iki açık + iki tamamlanan sorgusu. To Do
 * yavaşlayınca (ölçüldü: 40 sn'de 30'dan çok görev okuması) bu ikilik beklemeyi uzatıyordu. Şimdi
 * tek tarayıcı var (`readBoardList`; açık görevler adımlarıyla + tamamlananlar): tablo DERİN okur
 * (tamamlanan geçmiş), odak SIĞ (tamamlananların ilk sayfası — bugün bitenler en yeniler arasında).
 *
 * Uçuştaki taramaya bağlanılır: sığ istek uçuştaki derine ya da sığa, derin yalnız derine. Arada bir
 * Graph yazması olduysa (`graphWriteEpoch`) bağlanılmaz — yeni görev taramada görünsün. Önbellek
 * değil: tarama bitince kayıt silinir (kancaların kendi önbellekleri var).
 */
const MAX_LISTS = 25

type Raw = Record<string, unknown> & { id?: string }
type ListRead =
  | { listId: string; raw: Raw[]; doneMissing: boolean; truncated: boolean; failed?: undefined }
  | { failed: { status: string; httpStatus?: number } & Record<string, unknown> }
type ReadyScan = { status: typeof STATUS.ready; all: Raw[]; scan: Raw[]; results: ListRead[] }
type Scan = ReadyScan | ({ status: string } & Record<string, unknown>)
const isReady = (r: Scan): r is ReadyScan => r.status === STATUS.ready && "results" in r

const flying = new Map<string, { deep: boolean; epoch: number; job: Promise<Scan> }>()

async function runScan(instance: MsalInstance, account: MsalAccount, deep: boolean): Promise<Scan> {
  const listsRes = await getPages(instance, account, "/me/todo/lists", 3)
  if (listsRes.status !== STATUS.ready) {
    warnFailure("listeler", listsRes)
    return { ...listsRes, detail: describeFailure(listsRes, "lists") }
  }
  const all: Raw[] = listsRes.data
  if (all.length > MAX_LISTS) console.warn(`[todo] ${all.length} liste, ilk ${MAX_LISTS}'i okundu`)
  const scan = all.slice(0, MAX_LISTS)
  const results: ListRead[] = await mapPool(scan, LIST_CONCURRENCY, (list: Raw) =>
    readBoardList(instance, account, list, deep),
  )
  for (const [i, r] of results.entries()) {
    if (r.failed) warnFailure(`"${String(scan[i].displayName ?? scan[i].id)}" okunamadı`, r.failed)
  }
  return { status: STATUS.ready, all, scan, results }
}

/** Listeler ve her listenin ham görevleri; uçuştaki uygun taramaya bağlanır. */
export function scanTodoLists(
  instance: MsalInstance,
  account: MsalAccount,
  { deep }: { deep: boolean },
): Promise<Scan> {
  const who = account?.homeAccountId ?? ""
  const epoch = graphWriteEpoch()
  const deepJob = flying.get(`${who}:deep`)
  if (deepJob && deepJob.epoch === epoch) return deepJob.job
  const shallowJob = flying.get(`${who}:shallow`)
  if (!deep && shallowJob && shallowJob.epoch === epoch) return shallowJob.job
  const key = `${who}:${deep ? "deep" : "shallow"}`
  const entry = { deep, epoch, job: runScan(instance, account, deep) }
  flying.set(key, entry)
  entry.job.finally(() => {
    if (flying.get(key) === entry) flying.delete(key)
  })
  return entry.job
}

/** Hepsi düştüyse kısmi sonuç yok: ilk düşenin özeti (izin reddi her listedeyse izin durumu). */
function allFailed(results: ListRead[]) {
  const failures = results.filter((r) => r.failed)
  if (!results.length || failures.length !== results.length) return null
  const first = (failures.find((f) => f.failed?.status === STATUS.error) ?? failures[0]).failed
  return { ...first, detail: describeFailure(first, "tasks") }
}

function eachRaw(results: ListRead[], fn: (raw: Raw, listId: string) => void) {
  const seen = new Set<string>()
  for (const r of results) {
    if (r.failed) continue
    for (const raw of r.raw) {
      if (!raw.id || seen.has(raw.id)) continue
      seen.add(raw.id)
      fn(raw, r.listId)
    }
  }
}

const skippedOf = (results: ListRead[]) => {
  const failures = results.filter((r) => r.failed)
  return {
    skipped: failures.length,
    detail: failures.length ? describeFailure(failures[0].failed, "tasks") : "",
  }
}

const defaultIdOf = (lists: Raw[]) =>
  (lists.find((l) => l.wellknownListName === "defaultList") ?? lists[0])?.id ?? null

/**
 * Bütün tablo (To-Do sayfası, To Do kartları, brifing). Dönen: `{ status, lists, tasks,
 * defaultListId, skipped, detail, doneMissing, truncated, stepsInline }` — `skipped` okunamayan
 * liste sayısı (kart SÖYLÜYOR), `doneMissing` tamamlananları okunamayan liste var mı.
 */
export async function fetchBoard(instance: MsalInstance, account: MsalAccount) {
  const res = await scanTodoLists(instance, account, { deep: true })
  if (!isReady(res)) return res
  const { scan, results } = res
  const failed = allFailed(results)
  if (failed) return failed
  const lists = scan.map(toBoardList)
  const tasks: unknown[] = []
  eachRaw(results, (raw, listId) => {
    const task = toBoardTask(raw, listId)
    if (task) tasks.push(task)
  })
  const failedIds = new Set(results.map((r, i) => (r.failed ? scan[i].id : null)).filter(Boolean))
  return {
    status: STATUS.ready,
    lists: lists.map((l: { id: string }) => ({ ...l, unreadable: failedIds.has(l.id) })),
    tasks,
    defaultListId:
      (lists.find((l: { kind: string }) => l.kind === "default") ?? lists[0])?.id ?? null,
    ...skippedOf(results),
    doneMissing: results.some((r) => !r.failed && r.doneMissing),
    truncated: results.some((r) => !r.failed && r.truncated),
    // Adımlar sorguyla gelmediyse satırlar onları kendisi sorar.
    stepsInline: stepsInline(),
  }
}

/**
 * Bugünün odağı: bütün listelerde teslimi bugün/geçmiş açık görevler + bugün bitenler. Dönen:
 * `{ status, tasks, defaultListId, skipped, detail }`.
 */
export async function fetchFocusTasks(
  instance: MsalInstance,
  account: MsalAccount,
  today = localDayKey(),
) {
  const res = await scanTodoLists(instance, account, { deep: false })
  if (!isReady(res)) return res
  const { all, results } = res
  const failed = allFailed(results)
  if (failed) return failed
  const tasks: ReturnType<typeof toFocusTask>[] = []
  eachRaw(results, (raw, listId) => {
    const focus = toFocusTask(raw, listId, today)
    if (focus) tasks.push(focus)
  })
  tasks.sort(focusOrder)
  return { status: STATUS.ready, tasks, defaultListId: defaultIdOf(all), ...skippedOf(results) }
}
