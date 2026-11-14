/**
 * Widget yuvaları — bir özelliğin kartı, onu çizen başka bir özelliğe doğrudan bağlanmadan kaydolur
 * (ADR 0009: paylaşılandan özelliğe bağımlılık ters yön; özellik kendisi kaydolur). Kayıt uygulama
 * kabuğunda (`App.jsx`), çizen yer adıyla sorar. İlk kullanıcı: Master kart (Anasayfa'nın kartı,
 * widget panolarında çizilir).
 */
const slots = new Map()

/** Yuvaya bileşen kaydeder (genelde `lazy`). */
export function registerWidgetSlot(id, component) {
  slots.set(id, component)
}

/** Yuvadaki bileşen; kayıtlı değilse `null`. */
export const widgetSlot = (id) => slots.get(id) ?? null
