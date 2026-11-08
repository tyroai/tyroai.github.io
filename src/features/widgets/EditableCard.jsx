import { useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { headerEligible, useHeaderWidgets } from "@/components/layout/headerWidgets/headerStore"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { WIDGET_DRAG_TYPE } from "@/lib/boardEdit"
import { cn } from "@/lib/utils"
import { CardHandle } from "./CardHandle"
import { WidgetBoundary } from "./WidgetBoundary"
import { useMountWhenNear } from "./lazyCards"
import { useLookProps } from "./lookProps"
import { CardInkContext } from "./useBrandInk"
import { CATALOG, TWINS, looksOf, spanOf } from "./layout"
import { REGISTRY } from "./registry"
import { edges, members, shownId } from "./layoutOps"
import { SlotChoices } from "./SlotChoices"
import { SlotSizeContext, slotSize } from "./slotSize"
import { StackNav } from "./StackNav"
import { useWidgetEditor } from "./widgetEditorContext"
import { WidgetToolbar } from "./WidgetToolbar"
import "./widgetLooks.css"

// Eklenen kart yerinde büyür; ilk açılışta (`enter`: bölgedeki sırası) hafifçe yükselerek, sırayla.
const SHOWN = { opacity: 1, scale: 1, y: 0 }
const ENTER_EASE = [0.2, 0.9, 0.25, 1]
const PLACEHOLDER = { minHeight: "12.5rem" }

/**
 * Kart kabuğu — bir YUVA: tek widget ya da yığın (biri görünür, ‹ › ile geçilir,
 * görünen düzende saklanır). Dış kutu yer animasyonu (motion); HTML5 sürükleme
 * içteki kutuda (motion `onDragStart`ı kendi jestine ayırıyor). Düzenlerken
 * kartın içi tıklanmaz; yığının okları ve bırakma sorusu üstte, tıklanır. Düzenleme dışında
 * üst kenarda tutamak (•••, `CardHandle`): kartın ayarı · Görünüm · Header'a taşı. Telefonda tutamak
 * yok (ürün sahibi: sabit ••• kötü duruyor); kartın ayarları orada düzenleme kipinde.
 */
export function EditableCard({
  item,
  render,
  single = false,
  enter = null,
  far = null,
  order = 0,
}) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const phone = useIsMobile()
  const { editing, drag, over, setDrag, setOver, choice, headerChoice, layout, actions } =
    useWidgetEditor()
  // Kartın üstünde bir soru açıkken içi, şeridi ve tutamağı etkisiz: odak sorudan dışarı kaçmaz.
  const asked = choice?.to === item.id || headerChoice?.id === item.id
  const [dir, setDir] = useState(1)
  const list = members(item)
  const at = list.indexOf(shownId(item))
  const shown = list[at]
  const look = layout.lookOf(shown)
  const [lookProps, cardInk] = useLookProps(shown, look, "h-full")
  // Header'a gönderilebilir mi: uygun ve henüz header'da değil (oradaysa seçenek görünmez).
  const headerItems = useHeaderWidgets().items
  const toHeader = headerEligible(shown) && !headerItems.includes(shown)
  // Ekranın altındaki kart önce aynı boyda boş yer tutucu (`lazyCards.js`): dönüşte yalnız
  // görünenler çizilir. Ölçüm öncesi (`far` null) hepsi yer tutucu, boyamadan önce karar verilir.
  const lazyRef = useRef(null)
  const near = useMountWhenNear(lazyRef, far?.has(item.id) === true, order)
  const mounted = near || (far != null && !far.has(item.id))
  // Görünüm kabukta (`data-widget-look`, token'lar, mürekkep): widget onu CSS'le okur.
  const card = mounted && (
    <CardInkContext.Provider value={cardInk}>{render(shown, "h-full")}</CardInkContext.Provider>
  )
  const name = (id) => t(CATALOG[id].title)
  // Kartın ayarı ikiziyle (hava: "Selamlama"); denetim ••• menüsünde ve düzenleme şeridinde.
  const twin = TWINS[shown]
  const toggle = (ctl) =>
    twin && {
      label: t(twin.label),
      checked: twin.on,
      onChange: () => actions.twin(item.id, ctl),
    }
  const zone = item.zone
  const zones = layout.zones
  const z = zones.indexOf(zone)
  const inZone = layout.items.filter((x) => x.zone === zone)
  const zi = inZone.findIndex((x) => x.id === item.id)
  const { first, last } = edges(layout.items, item.id, zones)
  const target = over === item.id && drag != null && drag !== item.id
  const end = () => {
    setDrag(null)
    setOver(null)
  }

  return (
    <motion.div
      layout="position"
      initial={
        reduce
          ? false
          : enter != null
            ? { opacity: 0, scale: 0.98, y: 10 }
            : { opacity: 0, scale: 0.96 }
      }
      animate={
        enter != null
          ? {
              ...SHOWN,
              transition: { delay: Math.min(enter, 8) * 0.045, duration: 0.45, ease: ENTER_EASE },
            }
          : SHOWN
      }
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      data-widget-slot={item.id}
      data-tour={layout.tour?.[shown]}
      className={cn("min-w-0", spanOf(zone, item.wide))}
    >
      <div
        draggable={(editing && !asked) || undefined}
        onDragStart={(e) => {
          setDrag(item.id)
          e.dataTransfer.effectAllowed = "move"
          // Header'daki tepsi bu türü tanır (karta header'a bırakılabilir); Firefox da ister.
          e.dataTransfer.setData(WIDGET_DRAG_TYPE, item.id)
        }}
        onDragOver={(e) => {
          if (drag == null || drag === item.id) return
          e.preventDefault()
          e.stopPropagation()
          setOver(item.id)
        }}
        onDragLeave={() => setOver((o) => (o === item.id ? null : o))}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (drag != null) actions.drop(drag, item.id)
          end()
        }}
        onDragEnd={end}
        className={cn(
          "group/stack relative h-full",
          editing && "cursor-grab active:cursor-grabbing",
          drag === item.id && "opacity-40",
        )}
      >
        <div
          className={cn("h-full", editing && "pointer-events-none select-none")}
          inert={editing || asked || undefined}
        >
          {/* Yığında geçiş: yeni widget geldiği yönden kısa bir kaymayla girer. Tek sütunda
              satır kartın boyunda: yer tutucu ortalama kart boyu. */}
          {!mounted ? (
            <div ref={lazyRef} className="h-full" style={single ? PLACEHOLDER : undefined} />
          ) : (
            <motion.div
              key={shown}
              initial={
                list.length > 1
                  ? { opacity: 0, x: dir * (document.dir === "rtl" ? -24 : 24) }
                  : false
              }
              animate={{ opacity: 1, x: 0 }}
              {...lookProps}
            >
              <SlotSizeContext.Provider value={slotSize(zone, item.wide, single)}>
                <WidgetBoundary id={shown}>{card}</WidgetBoundary>
              </SlotSizeContext.Provider>
            </motion.div>
          )}
        </div>
        {!editing && !asked && !phone && REGISTRY[shown]?.handle !== false && (
          <CardHandle
            name={name(shown)}
            info={t(`widgets.info.${shown}`)}
            looks={looksOf(shown)}
            look={look}
            onLook={(value) => actions.look(shown, value)}
            onHeader={toHeader ? () => actions.toHeader(item.id) : null}
            toggle={toggle("handle")}
          />
        )}
        {list.length > 1 && !asked && (
          <StackNav
            names={list.map(name)}
            at={at}
            onGo={(i, d) => {
              setDir(d)
              actions.show(item.id, i)
            }}
          />
        )}
        {editing && (
          <div
            inert={asked || undefined}
            className={cn(
              "absolute inset-0 rounded-[1.75rem] outline-2 -outline-offset-2 outline-dashed transition",
              asked && "invisible",
              target ? "bg-brand/[0.06] outline-brand" : "outline-brand/35",
            )}
          >
            <WidgetToolbar
              name={name(shown)}
              wide={item.wide}
              first={first}
              last={last}
              crossBack={zi === 0 && z > 0 ? t(`widgets.zoneTo.${zones[z - 1]}`) : null}
              crossForward={
                zi === inZone.length - 1 && z < zones.length - 1
                  ? t(`widgets.zoneTo.${zones[z + 1]}`)
                  : null
              }
              canResize={zone !== "left"}
              canStack={zone !== "more" && zi > 0}
              canUnstack={list.length > 1}
              canHeader={toHeader}
              onHeader={() => actions.toHeader(item.id)}
              looks={looksOf(shown)}
              look={look}
              onLook={(value) => actions.look(shown, value)}
              onMove={(step) => actions.step(item.id, step)}
              onResize={() => actions.resize(item.id)}
              onStack={() => actions.stack(item.id)}
              onUnstack={() => actions.unstack(item.id)}
              onRemove={() => actions.remove(item.id)}
              toggle={toggle("twin")}
            />
          </div>
        )}
        <SlotChoices item={item} name={name} />
      </div>
    </motion.div>
  )
}
