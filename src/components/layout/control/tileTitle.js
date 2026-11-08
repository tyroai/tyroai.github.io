import { headerTitleKey } from "../headerWidgets/headerStore"

const OWN_TITLE = {
  "toggle:focus": "control.focus.title",
  "toggle:present": "control.present.title",
  "toggle:theme": "control.theme.title",
  "toggle:notch": "control.notch.title",
  "tool:task": "control.task.title",
  "tool:presence": "control.presence.title",
  "tool:oof": "control.oof.title",
  "tool:shortcuts": "control.sc.title",
  // Kartın adı ("Tibot Talepler · Halka") kutucuğa uzun: kısa adı.
  "tibot-rings": "control.tile.tibot",
}

/** Kutucuğun adı (kutucuk, düzenleme listesi, "−" düğmesi, ayrıntının başlığı). */
export const tileTitleKey = (id) => OWN_TITLE[id] ?? headerTitleKey(id)
