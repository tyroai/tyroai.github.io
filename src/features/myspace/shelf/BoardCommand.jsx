import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import { parseBoardCommand } from "../lib/boardCommand"
import { HomeCommand } from "./HomeCommand"
import { revealCard } from "./revealCard"

const UNDO_MS = 8000

/**
 * Panoya bağlı KOMUT ÇUBUĞU (Sahneler ve Yedek; tembel parça): `HomeCommand` + yazılan cümlenin
 * pano komutu olarak işlenmesi — "piyasayı göster" kartı ekler (sayfa yeni karta kayar, kart bir an
 * parlar: `revealCard`), "postaları çıkar" kaldırır (ikisi de "Geri al"lı bildirimle); komut değilse
 * cümle sohbete gider. Katalog bilgisi (`nameOf`, `zoneOf`) dışarıdan gelir.
 */
export default function BoardCommand({ env, layout, nameOf, zoneOf, editing }) {
  const { t } = useLocale()
  const undo = (message, prev) =>
    notify.info(message, {
      duration: UNDO_MS,
      action: { label: t("widgets.undo"), onClick: () => layout.restore(prev) },
    })
  const onCommand = (text) => {
    const placed = layout.items.flatMap((x) => x.stack ?? [x.id])
    const items = [
      ...layout.hidden.map((id) => ({ id, name: nameOf(id), onBoard: false })),
      ...placed.map((id) => ({ id, name: nameOf(id), onBoard: true })),
    ]
    const cmd = parseBoardCommand(text, items)
    if (!cmd) return false
    if (cmd.type === "add") {
      const prev = layout.addMany([cmd.id], zoneOf(cmd.id) ?? layout.addZone)
      undo(t("widgets.say.added", { name: nameOf(cmd.id) }), prev)
      revealCard(cmd.id)
      return true
    }
    const slot = layout.items.find((x) => (x.stack ?? [x.id]).includes(cmd.id))
    if (!slot) return false
    undo(t("widgets.say.removed", { name: nameOf(cmd.id) }), layout.remove(slot.id, cmd.id))
    return true
  }
  return (
    <HomeCommand
      briefCta={env.briefCta}
      onNewChat={env.onNewChat}
      onCommand={onCommand}
      editing={editing}
    />
  )
}
