import { focusBoardEditEntry } from "@/lib/boardEdit"

/**
 * Kartın şeridine odak (`ctl` verilmişse o düğmeye — ör. düzenleme dışında tutamak); kart yoksa
 * düzenleme düğmesine. Kart görünür alana kaydırılır.
 */
export function focusSlot(next) {
  const scope = next.zone ? `[data-zone="${next.zone}"] ` : ""
  const el = next.id ? document.querySelector(`${scope}[data-widget-slot="${next.id}"]`) : null
  const target =
    (next.ctl && el?.querySelector(`[data-ctl="${next.ctl}"]`)) ||
    el?.querySelector('[role="toolbar"] [tabindex="0"]') ||
    el?.querySelector('[data-ctl="handle"]')
  el?.scrollIntoView({ block: "nearest" })
  if (target) target.focus({ preventScroll: true })
  else focusBoardEditEntry()
}
