/**
 * Öneriden "Bugüne al": To Do'daki bir iş bugünün görevlerine iyimser girer — tarih To Do'ya
 * yazılırken listede hemen görünür (`useFocusTasks` › `adopt`). Saf: testli.
 */

/** Bugünün görevlerinin satırı (`lib/todo` › `toFocusTask` biçimi). */
export interface FocusTask {
  id: string
  listId: string
  title: string
  done: boolean
  dueKey: string
  overdue: boolean
  created: string
  pending?: boolean
  /** Satırın kalıcı anahtarı: geçici kimlikle eklenen iş sunucu kimliğine geçince satır yenilenmesin. */
  uiKey?: string
}

/** Panonun görevinden gerekenler (`lib/todoBoard` › `toBoardTask`). */
export interface BoardTaskLike {
  id: string
  listId: string
  title?: string
  createdAt?: string
}

/**
 * İşi bugünün listesine ekler: açık işlerin sonuna, bitenlerin önüne (liste "açıklar önce"
 * sıralı). Zaten listedeyse liste aynen döner (çift tıklama, yenilemeyle gelmiş olabilir).
 */
export function adoptTask(
  list: readonly FocusTask[],
  task: BoardTaskLike,
  today: string,
): readonly FocusTask[] {
  if (!task?.id || list.some((x) => x.id === task.id)) return list
  const row: FocusTask = {
    id: task.id,
    listId: task.listId,
    title: String(task.title ?? ""),
    done: false,
    dueKey: today,
    overdue: false,
    created: task.createdAt ?? "",
  }
  const firstDone = list.findIndex((x) => x.done)
  return firstDone < 0
    ? [...list, row]
    : [...list.slice(0, firstDone), row, ...list.slice(firstDone)]
}

/**
 * Görünen sıra: açıklar önce, bitenler sonda; yeni biten iş (`settling`) bir an yerinde kalır —
 * tik ve üstü çizilme görünsün, sonra aşağı kayar. Aynı gruptakiler gelen sırayı korur.
 */
export function shownOrder<T extends { id: string; done: boolean }>(
  list: readonly T[],
  settling: ReadonlySet<string>,
): T[] {
  const open = (x: T) => !x.done || settling.has(x.id)
  return [...list.filter(open), ...list.filter((x) => !open(x))]
}

/** Listede satırın anahtarı (React `key`): varsa eklenirkenki geçici kimlik. */
export const rowKey = (task: { id: string; uiKey?: string }): string => task.uiKey ?? task.id

/**
 * Yeniden okunan listeye eski satır anahtarlarını taşır (`uiKey`): To Do'dan tazelenen liste aynı
 * işleri yeni nesnelerle getirir; anahtar düşerse satır çıkıp yeniden girer (göz kırpar).
 */
export function keepKeys<T extends { id: string; uiKey?: string }>(
  prev: readonly T[],
  next: readonly T[],
): readonly T[] {
  const keys = new Map<string, string>()
  for (const x of prev) if (x.uiKey) keys.set(x.id, x.uiKey)
  if (!keys.size) return next
  return next.map((x) => (keys.has(x.id) && !x.uiKey ? { ...x, uiKey: keys.get(x.id) } : x))
}
