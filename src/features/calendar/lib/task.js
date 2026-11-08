import { dayKey } from "./range"

/**
 * Takvimden yeni To Do görevinin saf mantığı (testli): formun ilk değerleri, doğrulama, `addTask`
 * bağımsız değişkenleri, adım satırları ve adımların sıralı oluşturulması. Ekran
 * `features/calendar/task/`te, yazma `useTodoBoard`un `addTask` ve `createStep`inde.
 */

/** Sıralı oluşturma (aynı anda 2 istek sınırı) uzamasın diye bir görevdeki adım üst sınırı. */
export const MAX_STEPS = 20
export const STEP_MAX_LENGTH = 255

/**
 * Formun ilk değerleri: son tarih tıklanan (ya da seçili) gün; liste boş = varsayılan liste.
 * `target.initial` (takvim Anlat'ı): `title`, `dueKey` (`null` = tarihsiz), `note`, `important`,
 * `listId`; verilmeyen (undefined) alan varsayılanda kalır.
 */
export function initialTask(target) {
  const init = target.initial ?? {}
  return {
    title: init.title ?? "",
    listId: init.listId ?? null,
    dueKey: init.dueKey !== undefined ? init.dueKey : dayKey(target.day),
    steps: [],
    note: init.note ?? "",
    important: Boolean(init.important),
  }
}

/** Doğrulama: başlık boşsa "need"; null ise gönderilebilir. */
export const taskErrors = (v) => ({ title: v.title.trim() ? null : "need" })

/** `board.addTask` bağımsız değişkenleri; `defaultListId`: liste seçilmediyse varsayılan liste. */
export function taskArgs(v, defaultListId) {
  return {
    title: v.title.trim(),
    listId: v.listId ?? defaultListId,
    dueKey: v.dueKey || null,
    importance: v.important ? "high" : "normal",
    note: v.note.trim(),
  }
}

/** Gönderilecek adım başlıkları: kırpılmış, boşlar atılmış, üst sınıra kadar, sıra korunur. */
export function stepTitles(steps) {
  return steps
    .map((s) => s.title.trim().slice(0, STEP_MAX_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_STEPS)
}

/** Formdaki adım satırı: `id` yalnız liste anahtarı ve odak için. */
export const newStep = (id, title = "") => ({ id, title })

/** `after` kimlikli satırdan sonra `step`i ekler (satır yoksa sona). */
export function insertStepAfter(steps, after, step) {
  const at = steps.findIndex((s) => s.id === after)
  return at < 0 ? [...steps, step] : [...steps.slice(0, at + 1), step, ...steps.slice(at + 1)]
}

export const renameStep = (steps, id, title) =>
  steps.map((s) => (s.id === id ? { ...s, title } : s))

export const dropStep = (steps, id) => steps.filter((s) => s.id !== id)

/**
 * Adımları SIRAYLA oluşturur (To Do aynı anda 2 isteğe izin verir; sıra da adımların sırası olur,
 * çünkü liste oluşturulma anına göre dizilir). `create(title)` oluşan adımı ya da başarısızsa
 * null döner (fırlatırsa da başarısızlık sayılır). İlk başarısızlıkta durur: `{ created, failedAt }`
 * (`failedAt` başarısız adımın sırası, hepsi olduysa null). `from`: yeniden denemede kaldığı yerden
 * başlar.
 */
export async function createStepsInOrder(create, titles, from = 0) {
  const created = []
  for (let i = from; i < titles.length; i += 1) {
    // Fırlatan istek de başarısızlık sayılır: o ana dek yazılanlar kaybolmasın (tekrar yazılmasın).
    const step = await Promise.resolve()
      .then(() => create(titles[i]))
      .catch(() => null)
    if (!step) return { created, failedAt: i }
    created.push(step)
  }
  return { created, failedAt: null }
}
