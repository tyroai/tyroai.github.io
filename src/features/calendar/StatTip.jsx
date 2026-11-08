import { useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useHoverPopover } from "@/hooks/useHoverPopover"
import { alignFor } from "@/lib/placement"
import { StatFace } from "./StatFace"
import { StatTipBody } from "./StatTipBody"

// Kartın yaklaşık ölçüsü (px): yön seçimi için (`lib/placement`). Panel sağ kenarda: önce sola,
// sığmazsa sağa; ikisi de sığmıyorsa en geniş taraf.
const SIZE = { width: 320, height: 380 }
const PREFER = ["left", "right"]

/**
 * Bir özet satırı ve üstüne gelince açılan kart: satırın tamamı tek düğme. Açılış `useHoverPopover`:
 * farede üstüne gelince, dokunuşta ve klavyede Enter ile (odak karta girer, Escape'te satıra döner).
 * HoverCard değil: dokunuşu ve klavyeyi yok sayar.
 *
 * Karttaki eylemler (ayrıntıyı aç, tatil listesi, yeni talep) önce kartı kapatır, YENİ yüzeyi bir kare
 * sonra açar: kapanışın odak işi açılan pencerenin odağıyla yarışmasın. O kapanışta odak kendiliğinden
 * satıra dönmez (`handoff`); satıra odağı eylem verir, yeni pencere de onu "açan" olarak saklar.
 * `actions`: `{ open(öğe, satır), holidays(satır), newLeave?(satır) }`; satır = bu düğme. Gövde eylemi
 * `run(fn)` ile çağırır: `run` kapatıp açanı (`fn(satır)`) verir.
 */
export function StatTip({ row, tip, actions }) {
  const pop = useHoverPopover({ side: "left", prefer: PREFER, size: SIZE })
  const trigger = useRef(null)
  const handoff = useRef(false)
  const run = (fn) => {
    handoff.current = true
    pop.close()
    requestAnimationFrame(() => {
      const el = trigger.current
      if (!el?.isConnected) return
      // Odak önce satıra: açılan pencere "açanı" buradan okur, kapanınca odak satıra döner.
      el.focus({ preventScroll: true })
      fn(el)
    })
  }
  return (
    <Popover open={pop.open} onOpenChange={pop.onOpenChange}>
      <PopoverTrigger asChild {...pop.triggerProps}>
        <button ref={trigger} type="button" className="cal-stat-btn">
          <StatFace row={row} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={pop.side}
        align={alignFor(pop.side, "center")}
        sideOffset={8}
        collisionPadding={12}
        {...pop.contentProps}
        onOpenAutoFocus={(e) => {
          handoff.current = false
          pop.contentProps.onOpenAutoFocus(e)
        }}
        onCloseAutoFocus={(e) => {
          if (handoff.current) e.preventDefault()
          else pop.contentProps.onCloseAutoFocus(e)
        }}
        aria-label={row.title}
        className="cal-pop cal-pop-tip"
      >
        <StatTipBody row={row} tip={tip} actions={actions} run={run} />
      </PopoverContent>
    </Popover>
  )
}
