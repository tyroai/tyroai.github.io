import { useEffect, useRef, useState } from "react"
import { fitRotated, normalizeAngle } from "@/lib/imageRotate"
import { cn } from "@/lib/utils"
import { LightboxCaption } from "./LightboxCaption"
import { LightboxTools } from "./LightboxTools"
import { useLightboxKeys } from "./useLightboxKeys"
import { useSpin } from "./useSpin"
import { useZoomPan } from "./useZoomPan"

// Dönüş ve düğmeyle yakınlaştırma kısa ve yumuşak; azaltılmış harekette anlık.
const EASE = "transition-transform duration-200 ease-out motion-reduce:transition-none"

/** Çerçevenin ölçüsü (düzen ölçüsü: açılış canlandırmasının ölçeği karışmaz). */
function useBoxSize(ref) {
  const [size, setSize] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (s && s.width === width && s.height === height ? s : { width, height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/**
 * Araçlı ışık kutusunun gövdesi (`ImageLightbox` `onRotate` ya da `zoomable` alınca). Görsel
 * sabit bir çerçevenin ortasında, araç hapı ve alt yazı altta sabit: döndürünce ya da görsel
 * değişince düğmeler yerinden oynamaz (art arda basılabilir). Döndürme görselin `rotate`
 * değerinden gelir; yan yatınca kutu ölçüsü yer değiştirir, görsel yine sığar. Yalnız dönüşüm
 * canlanır (döndürme açısı + sığma ölçeği), düzen sıçramaz. Yakınlaştırma: `useZoomPan`.
 */
export function LightboxFigure({ view, many, onRotate, zoomable, onStep }) {
  const frameRef = useRef(null)
  const frame = useBoxSize(frameRef)
  const { item } = view
  // Doğal ölçüler adrese göre tutulur: geri dönülen görsel beklemeden çizilir.
  const [naturals, setNaturals] = useState({})
  const natural = naturals[item.url]
  const angle = normalizeAngle(item.rotate)
  const spin = useSpin(angle, item.id)
  const fit = natural && frame ? fitRotated(natural, angle, frame) : null
  const rotate = onRotate && item.rotatable !== false ? (step) => onRotate(item.id, step) : null
  const zoom = useZoomPan({
    frameRef,
    size: fit?.box,
    enabled: Boolean(zoomable && fit),
    resetKey: `${item.id}|${angle}|${frame?.width}x${frame?.height}`,
    onSwipe: many ? onStep : undefined,
  })
  useLightboxKeys(frameRef, { rotate, zoom })

  const onLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    if (width && height) setNaturals((m) => ({ ...m, [item.url]: { width, height } }))
  }

  return (
    // Alçak ekranda (yatay telefon) araç hapı ile alt yazı yan yana: görsele yer kalsın.
    <figure className="relative z-10 m-0 grid size-full grid-cols-1 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-x-3 shortest:grid-cols-[1fr_auto_auto_1fr] shortest:grid-rows-[minmax(0,1fr)_auto]">
      {/* Boş yere tıklayınca kapanır: çerçeve tıklamayı alttaki örtüye geçirir. */}
      <div
        ref={frameRef}
        className="pointer-events-none relative col-span-full grid size-full min-h-0 place-items-center justify-self-stretch"
      >
        {fit ? (
          <div
            {...zoom.handlers}
            className={cn(
              "pointer-events-auto relative select-none",
              zoom.enabled && "touch-none",
              zoom.enabled &&
                (zoom.dragging
                  ? "cursor-grabbing"
                  : zoom.zoomed
                    ? "cursor-grab"
                    : "cursor-zoom-in"),
              zoom.ease ? EASE : "transition-none",
            )}
            style={{
              width: fit.box.width,
              height: fit.box.height,
              transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            }}
          >
            <img
              // Görsel değişince yenisi ilk çiziminde yerinde: öncekinin dönüşü ona canlanmaz.
              key={item.id}
              src={item.url}
              alt={item.name || ""}
              draggable={false}
              className={cn(
                "absolute max-w-none rounded-xl bg-black/20 shadow-2xl ring-1 ring-white/15",
                EASE,
              )}
              style={{
                width: fit.img.width,
                height: fit.img.height,
                left: (fit.box.width - fit.img.width) / 2,
                top: (fit.box.height - fit.img.height) / 2,
                transform: `rotate(${spin}deg) scale(${fit.k})`,
              }}
            />
          </div>
        ) : (
          // Ölçü bilinmeden çizilmez: yan yatık fiş önce düz görünüp sonra dönmesin.
          <img
            key={item.id}
            src={item.url}
            alt=""
            aria-hidden
            onLoad={onLoad}
            className="invisible absolute size-0"
          />
        )}
      </div>
      {(rotate || zoomable) && (
        <LightboxTools
          rotate={rotate}
          zoom={zoomable ? zoom : null}
          className="relative z-10 mt-3 shortest:col-start-2"
        />
      )}
      <LightboxCaption
        view={view}
        many={many}
        className={cn(
          "relative z-10 mt-2",
          (rotate || zoomable) &&
            "shortest:col-start-3 shortest:row-start-2 shortest:mt-3 shortest:self-center",
        )}
      />
    </figure>
  )
}
