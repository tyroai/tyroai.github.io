import { useEffect, useId, useMemo, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { CITY_COORDS, MAP_H, MAP_W, dotsPath, landDots, project } from "./lib/turkeyMap"
import { CX, DomeFrame, W } from "../shared/DomeFrame"
import { Pin } from "../shared/DomePin"

// Harita kubbenin içine sığacak ölçekte, ortada.
const S = 15
const OX = (W - MAP_W * S) / 2
const OY = 96
const MID = { x: CX, y: OY + (MAP_H * S) / 2 - 4 }
const REST_Z = 1.32
const CITY_Z = 1.9
const FOCUS_Y = 136
// Uçağın yayda durduğu yer (referanstaki gibi yolun üçte ikisinde).
const REST_AT = 0.62
const PLANE = 1.3

const base = (lonLat) => {
  const [x, y] = project(lonLat)
  return { x: OX + x * S, y: OY + y * S }
}

/** Görünüm: seçim yokken bütün harita; tek yer ona yakın; rota varsa iki ucu da içine alır. */
function viewOf(from, to) {
  if (from && to) {
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    const z = Math.max(REST_Z, Math.min(2.3, 200 / Math.max(dx, 1), 74 / Math.max(dy, 1)))
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    // Yay yukarı doğru kavislendiği için orta nokta biraz aşağıda durur.
    // Aşağıdaki ucun etiketi kubbenin solan dibine düşmesin diye rota biraz yukarıda durur.
    return { z, tx: CX - mx * z, ty: FOCUS_Y - 26 - my * z }
  }
  if (to) return { z: CITY_Z, tx: CX - to.x * CITY_Z, ty: FOCUS_Y - to.y * CITY_Z }
  return { z: REST_Z, tx: CX - MID.x * REST_Z, ty: MID.y + 6 - MID.y * REST_Z }
}

/** İki nokta arasında yukarı kavisli yay ve üstünde `t` noktasının yeri + yönü (derece). */
function arcOf(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  // Kavis yola dik ve yukarı doğru (referanstaki gibi kubbenin tepesine yaslanır).
  const lift = Math.min(len * 0.26, 30)
  const up = dx >= 0 ? 1 : -1
  const c = {
    x: (from.x + to.x) / 2 + ((dy * up) / (len || 1)) * lift,
    y: (from.y + to.y) / 2 - ((dx * up) / (len || 1)) * lift,
  }
  const at = (t) => ({
    x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * c.x + t ** 2 * to.x,
    y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * c.y + t ** 2 * to.y,
    angle:
      (Math.atan2(
        2 * (1 - t) * (c.y - from.y) + 2 * t * (to.y - c.y),
        2 * (1 - t) * (c.x - from.x) + 2 * t * (to.x - c.x),
      ) *
        180) /
      Math.PI,
  })
  const f = (n) => n.toFixed(1)
  return { d: `M${f(from.x)} ${f(from.y)}Q${f(c.x)} ${f(c.y)} ${f(to.x)} ${f(to.y)}`, at }
}

/** Yolcu uçağı, üstten (burun +x): beyaz gövde, turuncu kanat ve kuyruk, altında gölge. */
function Plane({ id }) {
  return (
    <g>
      <ellipse cx="-2" cy="7" rx="17" ry="4.2" className="af-plane-shadow" />
      <path d="M3 0 -6-16.5h-4.6L-3.4 0l-7.2 16.5H-6z" fill={`url(#${id}w)`} />
      <path d="M-13.5 0l-3.8-6.6h-2.6l2.2 6.6-2.2 6.6h2.6z" fill={`url(#${id}w)`} />
      <rect x="-4.6" y="-9.4" width="5.4" height="2.6" rx="1.3" className="af-plane-engine" />
      <rect x="-4.6" y="6.8" width="5.4" height="2.6" rx="1.3" className="af-plane-engine" />
      <path
        d="M18 0c0-2.1-3.6-3.1-8-3.1L-15-2.5c-3 .3-4.4 1.3-4.4 2.5s1.4 2.2 4.4 2.5L10 3.1c4.4 0 8-1 8-3.1z"
        fill={`url(#${id}b)`}
        className="af-plane-body"
      />
      <path d="M13.6-1.7c1.5.3 2.5.9 2.9 1.7-.4.8-1.4 1.4-2.9 1.7z" className="af-plane-glass" />
    </g>
  )
}

/**
 * TÜRKİYE KUBBESİ — iş avansı akışının üstündeki görsel (referanstaki küre): mavi yarım küre,
 * içinde noktalı Türkiye, kenarında dağılan parçacıklar. Yer seçilince harita oraya yaklaşır ve
 * iğne düşer; kişinin bulunduğu şehir biliniyorsa (`origin`: hava kartının konumu) oradan gidilecek
 * yere beyaz bir yay çizilir ve uçak yay boyunca uçup yolun üçte ikisinde durur. `code`: ERP lokasyon
 * kodu ("DİĞER"in yeri yok: iğne çizilmez). Yalnız süs: okuyucuya gizli, bilgi alttaki satırda.
 */
export function TurkeyDome({ code, label, origin }) {
  const id = useId()
  const reduce = useReducedMotion()
  const land = useMemo(() => dotsPath(landDots(), S), [])
  const to = code && CITY_COORDS[code] ? base(CITY_COORDS[code]) : null
  const from = origin && to ? base([origin.lon, origin.lat]) : null
  const view = viewOf(from, to)
  const arc = from && to ? arcOf(from, to) : null
  const rest = arc?.at(REST_AT)
  const routeKey = `${code}:${origin?.name ?? ""}`
  // Sonradan eklenen SMIL kendiliğinden başlamaz; yalnız rota değişince başlatılır (her yeniden
  // çizimde değil: uçuş baştan başlamasın).
  const motion = useRef(null)
  const flying = Boolean(arc) && !reduce
  useEffect(() => {
    if (flying) motion.current?.beginElementAt?.(0.2)
  }, [flying, routeKey])
  return (
    <DomeFrame
      defs={
        <>
          <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8a4c" />
            <stop offset="0.5" stopColor="#f0572b" />
            <stop offset="1" stopColor="#ff8a4c" />
          </linearGradient>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#f3f5f9" />
            <stop offset="1" stopColor="#cfd6e2" />
          </linearGradient>
        </>
      }
    >
      <g
        className="af-map"
        style={{
          transform: `translate(${view.tx.toFixed(1)}px, ${view.ty.toFixed(1)}px) scale(${view.z.toFixed(3)})`,
        }}
      >
        <path d={land} transform={`translate(${OX} ${OY})`} className="af-land" strokeWidth={2.3} />
        {arc && (
          <g key={`r:${routeKey}`} className="af-route">
            <path d={arc.d} className="af-arc-shadow" strokeWidth={5 / view.z} />
            <path d={arc.d} className="af-arc" pathLength="1" strokeWidth={2.6 / view.z} />
          </g>
        )}
        {/* Etiketler birbirinden uzağa: aşağıdaki ucun etiketi altında, yukarıdakinin üstünde. */}
        {from && (
          <Pin
            at={from}
            z={view.z}
            label={origin.name}
            soft
            pinKey={origin.name}
            below={from.y > to.y}
          />
        )}
        {to && (
          <Pin at={to} z={view.z} label={label} pinKey={code} below={from && to.y >= from.y} />
        )}
        {arc &&
          (reduce ? (
            <g
              transform={`translate(${rest.x.toFixed(1)} ${rest.y.toFixed(1)}) rotate(${rest.angle.toFixed(1)})`}
            >
              <g style={{ transform: `scale(${PLANE / view.z})` }}>
                <Plane id={id} />
              </g>
            </g>
          ) : (
            <g key={`p:${routeKey}`} className="af-plane">
              <animateMotion
                ref={motion}
                path={arc.d}
                rotate="auto"
                dur="1.7s"
                begin="indefinite"
                fill="freeze"
                calcMode="spline"
                keyPoints={`0;${REST_AT}`}
                keyTimes="0;1"
                keySplines="0.23 1 0.32 1"
              />
              <g style={{ transform: `scale(${PLANE / view.z})` }}>
                <Plane id={id} />
              </g>
            </g>
          ))}
      </g>
    </DomeFrame>
  )
}
