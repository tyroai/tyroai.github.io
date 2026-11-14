import { useEffect, useId, useMemo, useRef, useState } from "react"
import { AutoHeight } from "@/components/common/AutoHeight"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useHoverIntent } from "@/hooks/useHoverIntent"
import { useLocale } from "@/hooks/useLocale"
import { alignFor, roomiestSide } from "@/lib/placement"
import { claim, handedOff, release } from "@/lib/singleOpen"
import { PersonCard } from "./PersonCard"
import "./personPopover.css"

// Kartın yaklaşık ölçüsü (px) — yön seçimi için.
const CARD_SIZE = { width: 352, height: 560 }

/**
 * Bir tetikten açılan kişi kartı. Masaüstünde ve tablette tetiğe yaslı pencere: tetiğin
 * yönünden büyüyerek belirir (180 ms), kapanışı kısa (120 ms); içerik sonradan gelince pencerenin
 * boyu zıplamaz, kayar (`AutoHeight`). Telefonda (yatay telefon dahil) alttan çekmece: dar ekranda
 * pencere ne yana ne alta sığıyor, içeriği örtüyordu.
 *
 * `children` bir işlev: `(trigger) => …` — dönen props bir ya da BİRDEN ÇOK düğmeye yayılabilir
 * (gönderi kartında foto ve ad ayrı sütunlarda ama aynı kartı açıyor). Kart basılan düğmeye
 * yaslanır (`PopoverAnchor virtualRef`).
 *
 * @param {object} p
 * @param {{name?: string, address?: string, title?: string}} p.person
 * @param {{kind: "birthday"|"anniversary"|"joiner", text?: string, years?: number}} [p.context]
 * @param {{label: string, icon?: object, onClick: () => void}} [p.extraAction]
 * @param {boolean} [p.hover] fareyle üstüne gelince de açılır (karta geçince açık kalır,
 *   ikisinden de çıkınca kapanır; fareyle açılan kart odağı çalmaz, basılırsa sabitlenir).
 *   Dokunmatik ve klavye eskisi gibi basışla.
 */
export function PersonPopover({
  person,
  context,
  extraAction,
  side = "bottom",
  align = "start",
  hover = false,
  children,
}) {
  const { t } = useLocale()
  const id = useId()
  const mobile = useIsMobile()
  const [anchor, setAnchor] = useState(null)
  // Yön açılırken seçilir: tercih `side`, sığmazsa en geniş boşluk — sağ alttaki bir karttan
  // açılan kart üste çevrilip header'ın altına sıkışıyordu.
  const [placed, setPlaced] = useState(side)
  // Aynı anda tek kişi kartı (`lib/singleOpen`): yenisi açılınca açık olanı kapatır. Dokunmatikte
  // Radix dışarı basışı tıklamayla anlıyor; tetik tıklamayı durdurduğu için (`stopPropagation`)
  // başka bir tetiğe basmak önceki kartı kapatmıyordu.
  const openAt = (el) => {
    claim(id, () => setAnchor(null))
    setPlaced(roomiestSide(el.getBoundingClientRect(), CARD_SIZE, side))
    setAnchor(el)
  }
  // Kapanınca odağın döneceği düğme (kapanırken `anchor` boşalıyor, bu kalıyor).
  const [returnTo, setReturnTo] = useState(null)
  // Popper bir "ölçülebilir" ister; basılan düğme durumda tutuluyor, nesne ona bakıyor. Kapanış
  // sürerken de son düğmeye yaslı kalır (yoksa kart solarken köşeye sıçrardı).
  const virtualRef = useMemo(() => ({ current: anchor ?? returnTo }), [anchor, returnTo])
  const outside = useRef(false)
  const open = Boolean(anchor)
  const intent = useHoverIntent()
  const close = () => {
    intent.cancel()
    setAnchor(null)
    release(id)
  }
  useEffect(() => () => release(id), [id])
  const hoverClose = (e) => e.pointerType === "mouse" && intent.close(() => setAnchor(null))

  const trigger = {
    type: "button",
    // Tetiklerin hepsi işaretli: kart açıkken birine basmak "dışarı tıklama" sayılıp kapatıp
    // yeniden AÇMASIN (Radix'in kendi tetiği için yaptığı).
    "data-person-trigger": id,
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    onClick: (e) => {
      // Altta gerilmiş bir kaplama ya da satırın kendi tıklaması olabilir.
      e.stopPropagation()
      intent.cancel()
      const el = e.currentTarget
      setReturnTo(el)
      // Fareyle açılmış karta basmak onu kapatmaz, sabitler.
      const pin = intent.isHover() && anchor === el
      intent.reset()
      if (pin) return
      if (anchor === el) close()
      else openAt(el)
    },
    ...(hover && {
      onPointerEnter: (e) => {
        if (e.pointerType !== "mouse" || (open && !intent.isHover())) return
        const el = e.currentTarget
        intent.open(() => {
          setReturnTo(el)
          openAt(el)
        })
      },
      onPointerLeave: hoverClose,
    }),
  }

  const card = (
    <PersonCard
      person={person}
      context={context}
      sheet={mobile}
      extraAction={
        extraAction && {
          ...extraAction,
          onClick: () => {
            close()
            extraAction.onClick()
          },
        }
      }
      onDone={close}
    />
  )

  if (mobile) {
    return (
      <>
        {children(trigger)}
        <BottomSheet open={open} onOpenChange={(next) => !next && close()} title={t("person.card")}>
          {open && card}
        </BottomSheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={(next) => !next && close()}>
      <PopoverAnchor virtualRef={virtualRef} />
      {children(trigger)}
      {/* Koşulsuz: kapanırken Radix kartı kapanış hareketi bitene kadar tutar. */}
      <PopoverContent
        side={placed}
        align={alignFor(placed, align)}
        sideOffset={8}
        collisionPadding={12}
        aria-label={t("person.card")}
        className="pc-pop"
        // Sohbet rıhtımı pencerede Escape dinliyor: kartı kapatan Escape rıhtımı da kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onPointerEnter={intent.cancel}
        onPointerLeave={hoverClose}
        onOpenAutoFocus={(e) => intent.isHover() && e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target instanceof Element ? e.target : null
          if (target?.closest(`[data-person-trigger="${CSS.escape(id)}"]`)) {
            e.preventDefault()
            return
          }
          outside.current = true
        }}
        // Tetik bir `PopoverTrigger` değil; Radix'in odağı geri verme işi burada. Dışarıya
        // tıklanarak kapandıysa odak oraya gider, geri çekilmez.
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          const el = returnTo
          // Başka bir kart açıldığı için kapandıysa odak geri çekilmez (`lib/singleOpen`).
          const passed = handedOff(id)
          const refocus = !outside.current && !passed && !intent.isHover()
          if (refocus && el?.isConnected) el.focus({ preventScroll: true })
          outside.current = false
          intent.reset()
        }}
      >
        <AutoHeight className="pc-auto">{card}</AutoHeight>
      </PopoverContent>
    </Popover>
  )
}
