import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { formErrors } from "@/lib/requestForm"

/**
 * Formun doluluğu: zorunlu alanlardan kaçı geçerli dolu (`done`) / kaç zorunlu alan var (`total`).
 * Eklenmemiş eklenebilir alan sayılmaz; hatalı değer (geçersiz tutar, ters tarih) dolu sayılmaz.
 * Pencere başlığındaki halka bununla dolar.
 */
export function formProgress(key, values) {
  const slots = PROMPT_TEMPLATES[key]?.slots ?? {}
  const needed = Object.entries(slots)
    .filter(([name, slot]) => slot.required && !(slot.addable && values?.[name] === undefined))
    .map(([name]) => name)
  const errors = formErrors(key, values)
  return { done: needed.filter((n) => !errors[n]).length, total: needed.length }
}

/** Masrafın doluluğu: bütün kalemlerin zorunlu alanları birlikte. */
export function expenseFormProgress(rows) {
  let done = 0
  let total = 0
  for (const row of rows) {
    const p = formProgress("expense", row.values)
    done += p.done
    total += p.total
  }
  return { done, total }
}
