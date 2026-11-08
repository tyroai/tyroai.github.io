/**
 * Küre kartının SAHNELERİ (saf, testli): her öneri maskotun uzattığı beyaz bir kartta gelir;
 * kart ailesi sabit, sınıfa göre değişen kürenin YERİ, boyu, hâli ve kartın önünde mi arkasında
 * mı durduğu. Ölçüler px; satır ve yazı payları rem (kök yazı boyu küçülünce kart da küçülür).
 * Kartın boyu ölçülmez, satırların rem bütçesinden hesaplanır: sığmayan isteğe bağlı satır düşer
 * (yükselen ailede küre küçülmek yerine satır düşer). Konumlar soldan sağa yazılır; sağdan sola
 * dilde aynalanır. Ayrıntı: docs/features/anasayfa-kutlamalar.md › Yardım kartı › Anın önerileri.
 */

export type Row = "lead1" | "lead2" | "sup1" | "sup2" | "vis"
export type Preset =
  "hand" | "mirror" | "mirrorUp" | "side" | "float" | "carry" | "tuck" | "speak" | "stack"
export type Family = "corner" | "side" | "float" | "rise" | "stack"
export type SceneKind =
  | "prepare"
  | "recap"
  | "trip"
  | "load"
  | "focusFree"
  | "bridge"
  | "planDay"
  | "weekPlan"
  | "tomorrow"
  | "weekWrap"
  | "weekend"
  | "feed"

export interface Scene {
  preset: Preset
  pose: string
  glasses?: boolean
  reading?: boolean
  /** Sağdan sola dilde maskot yatayda çevrilir: profil ve el karta baksın. */
  mirrorRtl?: boolean
  /** Üstüne gelinince uyanır (tek izinli hâl değişimi). */
  wakeOnLive?: boolean
  /** Bakış imleci izlemez, karta sabitlenir (`SceneLayout.look`). */
  lookAtCard?: boolean
  req: Row[]
  opt: Row[]
  splitReq?: Row[]
  splitOpt?: Row[]
}

export const SCENES: Record<SceneKind, Scene> = {
  prepare: { preset: "hand", pose: "waiting", req: ["lead1"], opt: ["sup2"] },
  recap: {
    preset: "mirror",
    pose: "idle",
    glasses: true,
    reading: true,
    mirrorRtl: true,
    req: ["lead2"],
    opt: ["sup1"],
  },
  trip: { preset: "side", pose: "orbiting", req: ["lead1"], opt: ["sup1"] },
  load: { preset: "carry", pose: "thinking", req: ["lead1"], opt: ["vis"] },
  focusFree: { preset: "float", pose: "idle", lookAtCard: true, req: ["lead1", "vis"], opt: [] },
  bridge: {
    preset: "mirrorUp",
    pose: "thumbs-up",
    mirrorRtl: true,
    req: ["lead1"],
    opt: ["vis", "sup1"],
  },
  planDay: {
    preset: "speak",
    pose: "planning",
    req: ["lead2"],
    opt: ["sup1"],
    splitReq: ["lead1"],
  },
  weekPlan: { preset: "tuck", pose: "planning", req: ["lead2"], opt: ["vis"], splitReq: ["lead1"] },
  tomorrow: { preset: "tuck", pose: "sleeping", wakeOnLive: true, req: ["lead1"], opt: [] },
  weekWrap: { preset: "tuck", pose: "success", req: ["lead1"], opt: ["vis"] },
  weekend: {
    preset: "tuck",
    pose: "greeting",
    req: ["lead1"],
    opt: ["sup2"],
    splitReq: ["lead1"],
    splitOpt: ["sup1"],
  },
  feed: { preset: "stack", pose: "searching", req: ["lead1"], opt: ["sup1"] },
}

export const isSceneKind = (k: string): k is SceneKind => Object.hasOwn(SCENES, k)

/** Satırların rem payı: boşluk + satır yüksekliği (yazı rampası). */
export const ROW_REM: Record<Row, number> = {
  lead1: 1.625,
  lead2: 2.875,
  sup1: 1.375,
  sup2: 2.5,
  vis: 1.125,
}
const PAD = 0.875
const KICKER = 2
const ACT_GAP = 0.75
const actionRem = (coarse: boolean) => (coarse ? 2.75 : 2)

/** Kartın rem bütçesi: dolgu + üst satır + satırlar + düğme. */
export const needRem = (rows: Row[], coarse: boolean) =>
  2 * PAD + KICKER + rows.reduce((t, r) => t + ROW_REM[r], 0) + ACT_GAP + actionRem(coarse)

/** Maskot tuvali: kutu genişliği / küre çapı (BrandOrb'un ORB_RATIO'su 342/440). */
export const MASCOT_W = 440 / 342
export const MASCOT_H = (MASCOT_W * 470) / 440
const MASCOT_CY = 0.4702
/** Küre görünümünün kare kutusu (hale + dalga) / çap — PastelVoiceOrb. */
export const SPHERE_BOX = 1.78
/**
 * Hazır konumların kart eğimi (derece), dönme noktası (%) ve oyuncu ailesi. Her kart kurulum
 * kartı gibi küreye doğru 1° eğik (ürün sahibi: "yükle önerisindeki gibi"); aynalı sahnelerde ters.
 */
type PresetSpec = { tilt: number; origin: [number, number]; family: Family }
// prettier-ignore
const PRESETS: Record<Preset, PresetSpec> = {
  hand: { tilt: -1, origin: [100, 100], family: "corner" },
  mirror: { tilt: 1, origin: [0, 100], family: "corner" },
  mirrorUp: { tilt: 1, origin: [0, 100], family: "corner" },
  side: { tilt: -1, origin: [100, 50], family: "side" },
  float: { tilt: -1, origin: [50, 100], family: "float" },
  carry: { tilt: -1, origin: [50, 100], family: "rise" },
  tuck: { tilt: -1, origin: [50, 100], family: "rise" },
  speak: { tilt: -1, origin: [50, 100], family: "rise" },
  stack: { tilt: -1, origin: [100, 100], family: "stack" },
}

const clamp = (lo: number, x: number, hi: number) => Math.max(lo, Math.min(hi, x))
const r = Math.round

export interface LayoutInput {
  w: number
  h: number
  rem: number
  coarse?: boolean
  rtl?: boolean
  view?: "mascot" | "sphere"
  /** Verisi olmayan satırlar düşer (küre büyür); `leadLines` 2 ise tek satırlık başlık iki satır. */
  avail?: { sup?: boolean; vis?: boolean; leadLines?: 1 | 2 }
}

export interface SceneLayout {
  preset: Preset
  family: Family
  d: number
  cx: number
  cy: number
  /** Kartın önünde (30) ya da arkasında (15); kart katmanı 20. */
  z: 15 | 30
  /** Karta sabit bakış (maskot tuvali birimi, `[data-look]` kaydırması); yoksa imleci izler. */
  look: { x: number; y: number } | null
  actor: { x: number; y: number; boxW: number; boxH: number }
  card: {
    x: number
    width: number
    anchor: "top" | "bottom"
    top: number
    bottom: number
    maxH: number
    /** Kartın boyu: içerik kadar, ama dibi kürenin tepesine biner (kurulum kartının oranı). */
    height: number
    need: number
    tilt: number
    origin: string
    rows: Row[]
    leadLines: number
    actionMax: number
    actionAlign: "start" | "end"
    tailX: number | null
  }
}

function rowsFor(s: Scene, split: boolean, avail: LayoutInput["avail"]) {
  const keep = (row: Row) =>
    !(row.startsWith("sup") && avail?.sup === false) && !(row === "vis" && avail?.vis === false)
  let req = (split && s.splitReq ? s.splitReq : s.req).filter(keep)
  if (avail?.leadLines === 2) req = req.map((x) => (x === "lead1" ? "lead2" : x))
  const opt = (split && s.splitOpt ? s.splitOpt : s.opt).filter(keep)
  return { req, opt }
}

/** Sahnenin yerleşimi: kürenin merkezi ve çapı, kartın kutusu, satırları ve düğmenin payı. */
export function sceneLayout(kind: SceneKind, input: LayoutInput): SceneLayout {
  const { w, h, rem, coarse = false, rtl = false, view = "mascot" } = input
  const s = SCENES[kind]
  const m = 0.75 * rem
  // Her öneri kurulum kartının düzeninde (ürün sahibi): kart tam en ve üste yaslı, küre bir alt
  // köşede yarı görünür. Köşe sahneye göre: aynalı sahneler (rapor, köprü) sol, öteki sağ.
  const { req, opt: optAll } = rowsFor(s, w >= 300, input.avail)
  const opt = [...optAll]
  const top = m
  const cardX = m
  const cw = w - 2 * m
  const anchor: "top" | "bottom" = "top"
  const preset = s.preset
  const start = preset === "mirror" || preset === "mirrorUp"
  // Kürenin ne kadarı çerçevenin altında kalır: başparmaklı köprüde el görünsün diye daha az.
  const hide = preset === "mirrorUp" ? 0.2 : 0.4
  // Kürenin merkezi çaptan: çerçevenin dibinden çapın bu oranı kadar yukarıda.
  const rise = (0.53 - hide) * MASCOT_H
  // Kartın alt sınırı: düğme satırı kürenin üst yarısına binmesin diye kürenin tepesi + düğme payı.
  const botFor = (dd: number) =>
    Math.min(h - m, h - rise * dd - 0.5 * dd + (PAD + ACT_GAP + actionRem(coarse)) * rem)
  // Satırlar temel boya göre seçilir (genişliğin %30–36'sı).
  const d0 = r(clamp(64, (w >= 300 ? 0.3 : 0.36) * w, w >= 300 ? 116 : 108))
  while (opt.length && needRem([...req, ...opt], coarse) * rem > botFor(d0) - top + 0.5) opt.pop()
  const rows = [...req, ...opt]
  const need = needRem(rows, coarse) * rem
  // Yer varsa küre büyür (ürün sahibi: kart içerikten uzun kalıyor, altı boş): kartın dibi
  // (`top + need`) kürenin üst kısmına (`cy - 0.3d`) değene dek; en çok genişliğin yarısı ve
  // temel boyun 1,5 katı. Yer yoksa temel boyda kalır.
  const fill = (h - top - need) / (rise + 0.3)
  const d = r(clamp(d0, fill, Math.min(0.5 * w, 1.5 * d0, 150)))
  const cx = start ? 0.309 * d : w - 0.309 * d
  const cy = h - rise * d
  const bot = botFor(d)
  const family: Family = "corner"
  const height = clamp(need, cy - 0.3 * d - top, bot - top)

  // Düğmenin payı: köşedeki küre düğme satırına iniyorsa kürenin o yükseklikteki kirişine kadar.
  const inner = cw - 2 * PAD * rem
  let actionMax = inner
  const actionAlign: "start" | "end" =
    preset === "mirror" || preset === "mirrorUp" ? "end" : "start"
  if (family === "corner") {
    // Düğme kartın dibinde (`SceneCard` yüksekliği `height`).
    const actBottom = top + height - PAD * rem
    const dy = cy - actBottom
    const rad = d / 2
    if (Math.abs(dy) < rad) {
      const half = Math.sqrt(rad * rad - dy * dy)
      actionMax =
        actionAlign === "start"
          ? cx - half - 6 - (cardX + PAD * rem)
          : cardX + cw - PAD * rem - (cx + half) - 6
    }
    actionMax = Math.min(inner, actionMax)
  }
  // Konuşma balonunun kuyruğu yok: kart her sahnede kurulum kartı gibi düz.
  const tailX: number | null = null
  const leadLines = rows.includes("lead2") ? 2 : 1

  // Aktörün kutusu: maskotta tuval (küre merkezi tuvalin %47'sinde), kürede kare.
  const boxW = view === "mascot" ? d * MASCOT_W : d * SPHERE_BOX
  const boxH = view === "mascot" ? d * MASCOT_H : d * SPHERE_BOX
  let ox = cx
  let oCardX = cardX
  let origin = PRESETS[start ? "mirror" : "hand"].origin
  let tilt = PRESETS[preset].tilt
  let tail: number | null = tailX
  if (rtl) {
    ox = w - cx
    oCardX = w - cardX - cw
    origin = [100 - origin[0], origin[1]]
    tilt = -tilt
    if (tail != null) tail = cw - tail
  }
  // Karta bakış: dar kartta aşağı, geniş kartta kartın yanına (sağdan sola dilde aynalı).
  const look = !s.lookAtCard ? null : { x: (start !== rtl ? 1 : -1) * 18, y: -12 }
  const ax = ox - boxW / 2
  const ay = view === "mascot" ? cy - MASCOT_CY * boxH : cy - boxH / 2
  return {
    preset,
    family,
    d,
    cx: ox,
    cy,
    z: 30,
    look,
    actor: { x: r(ax), y: r(ay), boxW: r(boxW), boxH: r(boxH) },
    card: {
      x: r(oCardX),
      width: r(cw),
      anchor,
      top: r(top),
      bottom: r(bot),
      maxH: r(bot - top),
      height: r(height),
      need,
      tilt: tilt + 0,
      origin: `${preset === "speak" && tail != null ? `${r(tail)}px` : `${origin[0]}%`} ${origin[1]}%`,
      rows,
      leadLines,
      actionMax: Math.max(0, Math.floor(actionMax)),
      actionAlign,
      tailX: tail == null ? null : r(tail),
    },
  }
}
