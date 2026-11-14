import { toast } from "sonner"
import { showResultToast } from "@/lib/refreshToast"

/**
 * Uygulama içi bildirimin tek girişi; düz sonner çağrılarının yerini alır. Hepsi
 * `showResultToast`a iner: aynı koyu cam kart, sağ altta, durumun glifiyle. Bu klasörün
 * geri kalanı işletim sistemi bildirimleri (`browserNotify`) — ikisi ayrı kanallar.
 *
 *   notify.success(title, { description, action, duration, id })  → toast kimliği
 *   notify.info | notify.warning | notify.error — aynı imza
 *   notify.dismiss(id)  — `id` yoksa hepsi
 *   notify.ask(title, { description, icon, confirm, cancel, id })  — soru: konunun simgesi,
 *     dolu onay düğmesi (`confirm = { label, onClick }`) ve "Şimdi değil" (`cancel`); 60 sn durur
 *
 * Sonner'dan birebir: `toast.success(a, { description: b })` → `notify.success(a, { description: b })`;
 * `toast(a)` ve `toast.message(a)` → `notify.info(a)`. Süreler ve eşleme tablosu:
 * docs/design-system.md › Bildirimler.
 */
function show(state) {
  return (title, opts) => {
    const { description, action, duration, id } = opts ?? {}
    return showResultToast({ state, title, detail: description, action, duration, id })
  }
}

function ask(title, opts) {
  const { description, icon, confirm, cancel, duration, id } = opts ?? {}
  return showResultToast({
    state: "ask",
    title,
    detail: description,
    icon,
    action: confirm,
    secondary: cancel,
    duration,
    id,
  })
}

export const notify = {
  ask,
  success: show("success"),
  info: show("info"),
  warning: show("warning"),
  error: show("error"),
  dismiss: (id) => toast.dismiss(id),
}
