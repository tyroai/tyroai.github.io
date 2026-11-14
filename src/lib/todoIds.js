/** To Do kancalarının ortak küçük yardımcıları (`useTodoBoard`, `useFocusTasks`). */

/** Oturumdaki hesaplardan anahtarı tutan; yoksa null. */
export const accountOf = (instance, key) =>
  key ? (instance.getAllAccounts().find((a) => a.homeAccountId === key) ?? null) : null

/** İyimser eklemede geçici görev kimliği (Graph'ın kimliği gelince değişir). */
export const tempId = () =>
  `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
