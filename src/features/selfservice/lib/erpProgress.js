/**
 * "ERP'ye gönder"in yazım adımları (saf): onay penceresinin iş listesi ve başlık simgesinin
 * doluluk halkası buradan. Sıra `erpSubmit.js`in yazım sırası — izin, avans ve temsilci tek kayıt; masraf başlık →
 * kalemler → onay akışı → fişler (fiş yoksa adım yok). `step`: yazımın bildirdiği son adım
 * (`{ name, n, total }`; `n` o an yazılan, yani bitmemiş olan); `done`: hepsi bitti.
 */
export function erpTasks(kind, { lines = 0, files = 0 } = {}) {
  if (kind === "leave" || kind === "advance" || kind === "delegate") return [{ id: kind, total: 1 }]
  const tasks = [
    { id: "header", total: 1 },
    { id: "line", total: lines },
    { id: "workflow", total: 1 },
  ]
  if (files > 0) tasks.push({ id: "file", total: files })
  return tasks
}

/**
 * Her adımın durumu (`pending` · `active` · `done`) ve kaçının bittiği, toplamda biten / tüm
 * birim (halka). Adım henüz bildirilmediyse ilk adım sürüyor sayılır.
 */
export function erpProgress(tasks, step, done = false) {
  const at = done
    ? tasks.length
    : Math.max(
        0,
        tasks.findIndex((x) => x.id === step?.name),
      )
  const list = tasks.map((task, i) => {
    if (i < at) return { ...task, status: "done", count: task.total }
    if (i > at) return { ...task, status: "pending", count: 0 }
    const count = step?.name === task.id ? Math.max(0, (step.n ?? 1) - 1) : 0
    return { ...task, status: "active", count }
  })
  return {
    tasks: list,
    done: list.reduce((n, x) => n + x.count, 0),
    total: tasks.reduce((n, x) => n + x.total, 0),
  }
}
