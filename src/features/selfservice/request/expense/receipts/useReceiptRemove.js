import { refocus } from "../refocus"
import { useRowUndo } from "../table/useRowUndo"

const removeOf = (id) => `[data-receipt-remove="${id}"]`
const ADD = "[data-receipt-add]"

/**
 * Başlıktaki fişi kaldırma ve geri alma. Kaldırınca şeritte "Fiş kaldırıldı · Geri al" 8 saniye
 * (`UndoStrip`): bildirim kipli pencerenin arkasında kalıyor, tıklanamıyor; telefonda yanlış bir
 * dokunuş az önce çekilen fotoğrafı yeniden çektirmesin. Odak kalkan düğmenin yerine: sonraki
 * fişin kaldır düğmesi, yoksa öncekininki, o da yoksa "Fiş ekle"; geri alınca geri gelen fişte.
 * `box()`: şerit (hedefler orada aranır). `onRemove(id)` geri alma girdisini döner.
 */
export function useReceiptRemove({ list, box, onRemove, onRestore }) {
  const undo = useRowUndo()
  const find = (selector) => box()?.querySelector(selector) ?? box()?.querySelector(ADD)
  const remove = (id) => {
    const at = list.findIndex((f) => f.id === id)
    const next = list[at + 1]?.id ?? list[at - 1]?.id
    const entry = onRemove(id)
    if (!entry) return
    undo.push({ entry })
    refocus(() => find(next ? removeOf(next) : ADD))
  }
  const restore = () => {
    const entry = undo.last?.entry
    if (!entry) return
    // "Geri al" sönerek kalkar: odak onda kalmasın, geri gelen fişe geçsin.
    const from = document.activeElement
    onRestore(entry)
    undo.clear()
    refocus(() => find(removeOf(entry.file.id)), from)
  }
  return { undo, remove, restore }
}
