/**
 * SAHNELER — Anasayfa'nın günün hâline göre kayıtlı düzenleri (Profil › Görünüm › Sayfa düzeni:
 * Sahneler). Her sahne kendi widget düzenini tutar: Sabah · Gün içi · Akşam · Yolda ve kişinin
 * kurduğu sahneler (en çok `MAX_CUSTOM`). "Gün içi" kişinin bugünkü Anasayfası'dır (aynı kayıt).
 *
 * TYRO sahneyi saate ve takvime göre AÇAR ve bunu söyler (`autoStep`, not: `noteOf`); kişi elle
 * seçerse o dilim boyunca dokunmaz (`hold`), "Geri al" önceki sahneye döner. Her sahnenin "ne zaman
 * açılsın" kuralı ayrı (`RULES`); "Elle" seçilen sahne kendiliğinden açılmaz.
 *
 * Kimlikler depolama değeridir (`tyro-home-scene-v1`, `tyro-home-scene-<kimlik>-v1`): yayından
 * sonra değiştirilmez. Yalnız kimlik, ad ve kural saklanır — kişisel veri değil.
 */
export const BUILT_IN = ["morning", "day", "evening", "travel"] as const
export type BuiltIn = (typeof BUILT_IN)[number]

/** Kişinin bugünkü Anasayfası bu sahnedir (ayrı kayıt açılmaz). */
export const BASE_SCENE: BuiltIn = "day"
export const MAX_CUSTOM = 3
export const NAME_MAX = 24

/** time: saat dilimi · meeting: günün ilk/son toplantısına göre · trip: yolculuk günü · manual: elle. */
export type Rule = "time" | "meeting" | "trip" | "manual"
export const RULES: Record<BuiltIn, readonly Rule[]> = {
  morning: ["time", "meeting", "manual"],
  day: ["time", "manual"],
  evening: ["time", "meeting", "manual"],
  travel: ["trip", "manual"],
}

export interface CustomScene {
  id: string
  name: string
  /** Kurulurken açık olan hazır sahne: kayıt yokken onun varsayılan kartlarıyla başlar. */
  from: BuiltIn
}
export interface AutoNote {
  scene: string
  prev: string
  at: number
}
export interface SceneState {
  scene: string
  /** TYRO'nun en son davrandığı (ya da kişinin elle seçtiği) dilim: aynı dilimde bir daha geçmez. */
  hold: string | null
  auto: AutoNote | null
  rules: Partial<Record<BuiltIn, Rule>>
  custom: CustomScene[]
}
/** Bugünün takvimi, gece yarısından dakika olarak; toplantı yoksa `null`. */
export interface SceneSignals {
  firstMeeting: number | null
  lastMeetingEnd: number | null
  trip: boolean
}

const KEY = "tyro-home-scene-v1"
const EVENT = "tyro:home-scene"
const MORNING = 6 * 60
const NOON = 12 * 60
const DAY = 10 * 60
const EVENING = 17 * 60
const EARLY_EVENING = 15 * 60

export const isBuiltIn = (v: unknown): v is BuiltIn => BUILT_IN.includes(v as BuiltIn)
const FRESH: SceneState = {
  scene: BASE_SCENE,
  hold: null,
  auto: null,
  rules: {},
  custom: [],
}

export const sceneIds = (state: SceneState): string[] => [
  ...BUILT_IN,
  ...state.custom.map((x) => x.id),
]

/** Sahnenin kuralı; seçilmemişse ilki (saat dilimi, Yolda'da yolculuk günü). */
export function ruleOf(state: SceneState, id: BuiltIn): Rule {
  const rule = state.rules[id]
  return rule && RULES[id].includes(rule) ? rule : RULES[id][0]
}

/**
 * Şu an hangi sahnenin sırası: yolculuk günü Yolda; sabah 06:00–10:00 (ya da ilk toplantıya
 * kadar, en geç öğlen); akşam 17:00'den sonra ve gece (ya da son toplantı bitince, en erken
 * 15:00); arası Gün içi. Kuralı "Elle" olan sahne hiç gelmez; sırası gelen yoksa `null`.
 */
export function dueScene(state: SceneState, signals: SceneSignals, now: Date): BuiltIn | null {
  const m = now.getHours() * 60 + now.getMinutes()
  if (ruleOf(state, "travel") === "trip" && signals.trip) return "travel"
  const morning = ruleOf(state, "morning")
  const until =
    morning === "meeting" && signals.firstMeeting != null
      ? Math.min(Math.max(signals.firstMeeting, MORNING), NOON)
      : DAY
  if (morning !== "manual" && m >= MORNING && m < until) return "morning"
  const evening = ruleOf(state, "evening")
  const from =
    evening === "meeting" && signals.lastMeetingEnd != null
      ? Math.max(signals.lastMeetingEnd, EARLY_EVENING)
      : EVENING
  if (evening !== "manual" && (m >= from || m < MORNING)) return "evening"
  if (ruleOf(state, "day") === "time" && m >= DAY && m < EVENING) return "day"
  return null
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const windowKey = (now: Date, due: BuiltIn) => `${dayKey(now)}:${due}`

/**
 * TYRO'nun adımı: sırası gelen sahne açık değilse ve bu dilimde henüz davranılmadıysa ona geçer
 * (not düşer). Değişecek bir şey yoksa `null`.
 */
export function autoStep(state: SceneState, signals: SceneSignals, now: Date): SceneState | null {
  const due = dueScene(state, signals, now)
  if (!due) return null
  const key = windowKey(now, due)
  if (state.hold === key) return null
  if (due === state.scene) return { ...state, hold: key }
  return {
    ...state,
    scene: due,
    hold: key,
    auto: { scene: due, prev: state.scene, at: now.getTime() },
  }
}

/** Elle seçim: bu dilim boyunca TYRO dokunmaz. */
export function pickScene(
  state: SceneState,
  scene: string,
  signals: SceneSignals,
  now: Date,
): SceneState {
  if (!sceneIds(state).includes(scene)) return state
  const due = dueScene(state, signals, now)
  return { ...state, scene, auto: null, hold: due ? windowKey(now, due) : state.hold }
}

/** TYRO'nun bugünkü notu ("18:10 · TYRO Akşam sahnesini açtı"); sahne değiştiyse ya da dünse yok. */
export function noteOf(state: SceneState, now: Date): AutoNote | null {
  const note = state.auto
  if (!note || note.scene !== state.scene) return null
  return dayKey(new Date(note.at)) === dayKey(now) ? note : null
}

/** "Geri al": TYRO'nun açtığından önceki sahne; dilim tutulur (yeniden açmaz). */
export function undoAuto(state: SceneState): SceneState {
  if (!state.auto) return state
  const prev = sceneIds(state).includes(state.auto.prev) ? state.auto.prev : BASE_SCENE
  return { ...state, scene: prev, auto: null }
}

export function setRule(state: SceneState, id: BuiltIn, rule: Rule): SceneState {
  if (!RULES[id].includes(rule)) return state
  return { ...state, rules: { ...state.rules, [id]: rule } }
}

/** Açık sahnenin dayandığı hazır sahne (kendi sahnende: kurulduğu sahne). */
export function baseOf(state: SceneState, id: string): BuiltIn {
  if (isBuiltIn(id)) return id
  return state.custom.find((x) => x.id === id)?.from ?? BASE_SCENE
}

const clean = (name: string) => name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX)

/** Yeni sahne: açık sahnenin kopyası olarak başlar ve açılır. Ad boşsa ya da yer yoksa `null`. */
export function addScene(state: SceneState, name: string, id: string): SceneState | null {
  const label = clean(name)
  if (!label || state.custom.length >= MAX_CUSTOM || sceneIds(state).includes(id)) return null
  return {
    ...state,
    custom: [...state.custom, { id, name: label, from: baseOf(state, state.scene) }],
    scene: id,
    auto: null,
  }
}

export function removeScene(state: SceneState, id: string): SceneState {
  if (!state.custom.some((x) => x.id === id)) return state
  return {
    ...state,
    custom: state.custom.filter((x) => x.id !== id),
    scene: state.scene === id ? BASE_SCENE : state.scene,
    auto: null,
  }
}

/**
 * Sahnenin düzen kaydı. "Gün içi" Anasayfa'nın kendi kaydıdır (`BOARDS.home.key` ile aynı). Hazır
 * sahneler v2: varsayılanlar 2+1+1 kalıbına dizilince eski kayıtlar bırakıldı (yeni varsayılan
 * görünsün; eskiler açılışta silinir, `lib/cacheMigration`). Kişinin kurduğu sahneler v1'de kalır.
 */
export const sceneKey = (id: string) =>
  id === BASE_SCENE
    ? "tyro-home-layout-v1"
    : isBuiltIn(id)
      ? `tyro-home-scene-${id}-v2`
      : `tyro-home-scene-${id}-v1`

/** Bir sahnenin kayıtlı düzenini ötekine kopyalar (kayıt yoksa hedef varsayılanla başlar). */
export function copyLayout(from: string, to: string): void {
  try {
    const raw = window.localStorage.getItem(sceneKey(from))
    if (raw) window.localStorage.setItem(sceneKey(to), raw)
  } catch {
    // Depo kapalı: yeni sahne varsayılan kartlarla başlar.
  }
}

/** Sahnenin düzen kaydını siler; geri almak için eski değeri döndürür. */
export function dropLayout(id: string): string | null {
  if (id === BASE_SCENE) return null
  try {
    const raw = window.localStorage.getItem(sceneKey(id))
    window.localStorage.removeItem(sceneKey(id))
    return raw
  } catch {
    return null
  }
}

export function restoreLayout(id: string, raw: string | null): void {
  if (!raw || id === BASE_SCENE) return
  try {
    window.localStorage.setItem(sceneKey(id), raw)
  } catch {
    // Depo kapalı: sahne varsayılan kartlarla döner.
  }
}

const isCustom = (v: unknown): v is CustomScene => {
  const x = v as CustomScene
  return (
    Boolean(x) &&
    typeof x.id === "string" &&
    /^c[a-z0-9]{1,16}$/.test(x.id) &&
    typeof x.name === "string" &&
    Boolean(clean(x.name)) &&
    isBuiltIn(x.from)
  )
}

function parse(raw: string | null): SceneState {
  const p = JSON.parse(raw ?? "null") as Partial<SceneState> | null
  if (!p || typeof p !== "object") return FRESH
  const seen = new Set<string>()
  const custom = (Array.isArray(p.custom) ? p.custom : [])
    .filter((x) => isCustom(x) && !seen.has(x.id) && seen.add(x.id))
    .slice(0, MAX_CUSTOM)
    .map((x) => ({ id: x.id, name: clean(x.name), from: x.from }))
  const ids = new Set<string>([...BUILT_IN, ...custom.map((x) => x.id)])
  const rules: SceneState["rules"] = {}
  for (const id of BUILT_IN) {
    const rule = (p.rules as Record<string, Rule> | undefined)?.[id]
    if (rule && RULES[id].includes(rule)) rules[id] = rule
  }
  const a = p.auto
  const auto =
    a && typeof a.scene === "string" && typeof a.prev === "string" && Number.isFinite(a.at)
      ? { scene: a.scene, prev: a.prev, at: Number(a.at) }
      : null
  return {
    scene: typeof p.scene === "string" && ids.has(p.scene) ? p.scene : BASE_SCENE,
    hold: typeof p.hold === "string" ? p.hold : null,
    auto,
    rules,
    custom,
  }
}

let cache: { raw: string | null; state: SceneState } | null = null

/** Kayıtlı seçim; yoksa ya da bozuksa "Gün içi" (kişinin bugünkü Anasayfası). */
export function readSceneState(): SceneState {
  if (typeof window === "undefined") return FRESH
  let raw: string | null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    return FRESH
  }
  // `useSyncExternalStore` aynı girdide aynı nesneyi ister.
  if (cache && cache.raw === raw) return cache.state
  let state: SceneState
  try {
    state = parse(raw)
  } catch {
    state = FRESH
  }
  cache = { raw, state }
  return state
}

export function writeSceneState(next: SceneState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depo kapalı: seçim yenilemede "Gün içi"ne döner.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeScene(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

type Slot = [id: string, zone: "left" | "main", wide?: boolean]

/**
 * Sahnelerin varsayılan kartları (hepsi katalogdaki gerçek widget'lar; kişiye açık olmayan
 * kendiliğinden düşer). Her sahne 2+1+1 kalıbında iki sıra (ürün sahibinin Sabah düzeni örnek):
 * üstte karşılama kartı (iki sütun) + iki dar kart, altta bir geniş kart + iki dar kart. Soru
 * kutusu kayıtta durur ama çizilmez (yüzen sohbet çubuğu). Sabah: güne hazırlık. Akşam: günü
 * toparlama ve keyif (radyo Tyrofy sahnesi: Disk dar hücrede plağı kesiyordu). Yolda: yalnız
 * gerekenler.
 */
export const SCENE_SLOTS: Record<Exclude<BuiltIn, "day">, Slot[]> = {
  morning: [
    ["tyro-welcome", "left"],
    ["ask", "left"],
    ["rhythm", "main"],
    ["next-meeting", "main"],
    ["brief", "main", true],
    ["focus", "main"],
    ["help", "main"],
  ],
  evening: [
    ["tyro-welcome", "left"],
    ["ask", "left"],
    ["tyro-radio-stage", "main"],
    ["holiday", "main"],
    ["pending-mail", "main", true],
    ["focus", "main"],
    ["leave-balance", "main"],
  ],
  travel: [
    ["tyro-welcome", "left"],
    ["ask", "left"],
    ["next-meeting", "main"],
    ["world-clock", "main"],
    ["travel", "main", true],
    ["pending-mail", "main"],
    ["tyro-fx", "main"],
  ],
}
