import { useEffect, useRef, useState } from "react"
import {
  HEADER_MAX,
  addHeaderWidget,
  headerEligible,
  headerState,
  inHeader,
  removeHeaderWidget,
  setHeaderLook,
  useHeaderWidgets,
} from "@/components/layout/headerWidgets/headerStore"
import { flashHeaderWidget } from "@/components/layout/headerWidgets/headerFlash"
import { useLocale } from "@/hooks/useLocale"
import { onToHeader } from "@/lib/boardEdit"
import { notify } from "@/lib/notify"
import { focusSlot } from "./focusSlot"
import { members, shownId } from "./layoutOps"

const UNDO_MS = 8000

/**
 * Panodan header'a — önce sorulur (kartın üstünde, `CardChoice`): **Burada da kalsın** (birincil:
 * kopya, panoda boşluk açılmaz) ya da **Yalnız header'da** (kart panodan kalkar). Eklenen
 * widget'ın header'daki ikonu bir an parlar (`headerFlash`). Şeritten, kartın tutamağından ve kart header'daki tepsiye
 * sürüklenince aynı soru. Header'a giremeyen, zaten orada olan ya da header doluysa sorulmaz,
 * söylenir. Soru yalnız geçerliyken durur: kart kalkar, küçülür, yığını değişir ya da widget başka
 * yoldan header'a girerse kendiliğinden kapanır; cevap anında koşullar yeniden denetlenir. İkisi de
 * "Geri al"lı (yalnız bu işlemin eklediğini geri alır); duyuru bildirimden (tek kanal).
 */
export function useHeaderMove({ editing, layout, slot, name, setNotice, focusAfter }) {
  const { t } = useLocale()
  const [ask, setAsk] = useState(null)
  const headerItems = useHeaderWidgets().items
  const asked = ask && slot(ask.id)
  const valid = Boolean(
    asked &&
    ask.editing === editing &&
    members(asked).includes(ask.memberId) &&
    !headerItems.includes(ask.memberId),
  )
  // Geçersiz kalan soru unutulur (kart geri gelse de yeniden açılmaz).
  if (ask && !valid) setAsk(null)

  /** Header'a gidemiyorsa nedeni söylenir (`true`); gidebiliyorsa `false`. */
  function blocked(memberId) {
    if (!headerEligible(memberId))
      notify.info(t("headerWidgets.notEligible", { name: name(memberId) }))
    else if (inHeader(memberId)) notify.info(t("headerWidgets.already", { name: name(memberId) }))
    else if (headerState().items.length >= HEADER_MAX)
      notify.warning(t("headerWidgets.full", { n: HEADER_MAX }))
    else return false
    return true
  }

  function begin(id) {
    const it = slot(id)
    if (!it) return false
    const memberId = shownId(it)
    if (blocked(memberId)) return false
    // Soru açıldığı kipe bağlı: düzenlemeden çıkınca (ya da girince) kendiliğinden kapanır.
    setAsk({ id, memberId, editing })
    return true
  }

  function choose(kind) {
    const a = valid ? ask : null
    setAsk(null)
    if (!a) return
    const it = slot(a.id)
    // Odak: vazgeçince soruyu açan düğmeye; aksi hâlde kartta kalıcı bir düğmeye (düzenlerken
    // şeridin başı, değilse tutamak) — "Header'a taşı…" artık yok, komşusu "Kaldır" olabilirdi.
    const focusBack = (ctl) =>
      requestAnimationFrame(() => focusSlot({ id: a.id, zone: it?.zone, ctl }))
    if (!kind) return focusBack(editing ? "header" : "handle")
    if (blocked(a.memberId)) return focusBack(editing ? "back" : "handle")
    addHeaderWidget(a.memberId)
    setHeaderLook(a.memberId, layout.lookOf(a.memberId))
    flashHeaderWidget(a.memberId)
    const prev = kind === "move" ? layout.remove(a.id, a.memberId) : null
    // Taşı'dan sonra komşunun şeridinin başına (hatırladığı durak "Kaldır" olabilirdi).
    if (prev) focusAfter(it, a.memberId, editing ? "back" : "handle")
    else focusBack(editing ? "back" : "handle")
    notify.info(
      t(kind === "move" ? "widgets.say.toHeader" : "widgets.say.copiedToHeader", {
        name: name(a.memberId),
      }),
      {
        duration: UNDO_MS,
        action: {
          label: t("widgets.undo"),
          onClick: () => {
            if (prev) layout.restore(prev)
            removeHeaderWidget(a.memberId)
            setNotice(
              t(prev ? "widgets.say.restored" : "headerWidgets.say.removed", {
                name: name(a.memberId),
              }),
            )
          },
        },
      },
    )
  }

  // Kart header'daki tepsiye sürüklenince de aynı soru (`lib/boardEdit` › requestToHeader).
  const latest = useRef(begin)
  useEffect(() => {
    latest.current = begin
  })
  useEffect(() => (editing ? onToHeader((id) => latest.current(id)) : undefined), [editing])

  return { headerChoice: valid ? ask : null, askHeader: begin, chooseHeader: choose }
}
