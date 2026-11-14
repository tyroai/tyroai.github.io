import { lazy, Suspense, useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useTodoBoard } from "@/hooks/useTodoBoard"
import { useBoardEditing } from "@/lib/boardEdit"
import { worstBoard, worstUpdateTask } from "@/dev/worstCase/calendarEvents"
import { BoardEditBar } from "@/features/widgets/BoardEditBar"
import { MainWidgets } from "@/features/widgets/MainWidgets"
import { EditorSlot, WidgetEditor } from "@/features/widgets/WidgetEditor"
import { BOARDS, CATALOG } from "@/features/widgets/layout"
import { renderWidgetFor } from "@/features/widgets/renderWidget"
import { useAvailableWidgets } from "@/features/widgets/useBoardData"
import { useWidgetLayout } from "@/features/widgets/useWidgetLayout"
import { BASE_SCENE, SCENE_SLOTS, sceneKey } from "./lib/scenes"

// Yüzen sohbet çubuğu (üç düzende aynı parça); soru kutusu kart olarak çizilmez.
const BoardCommand = lazy(() => import("./shelf/BoardCommand"))
const notAsk = (x) => x.id !== "ask"

const toLayout = (slots) => slots.map(([id, zone, wide]) => ({ id, zone, wide: Boolean(wide) }))

/**
 * Sahnelerin panoları (Sahneler düzeni): Anasayfa'nın bölgeleri ve kuralları, kendi kaydı ve
 * varsayılanıyla. "Gün içi" Anasayfa'nın kendi kaydıdır (kişinin bugünkü düzeni aynen). Nesneler
 * modülde bir kez kurulur: `useWidgetLayout` panoyu kimliğinden tanır.
 */
/** Sahnenin varsayılan kartları: kişinin kurduğu sahne, kurulduğu hazır sahneninkilerle başlar. */
function sceneDefaults(id, from = BASE_SCENE) {
  const slots = id === BASE_SCENE ? null : (SCENE_SLOTS[id] ?? SCENE_SLOTS[from])
  return slots ? toLayout(slots) : BOARDS.home.defaults
}

const sceneBoards = new Map()
/** Sahnenin panosu (bir kez kurulur). `bar`: düzenleme çubuğunun adı, sahnelerin tembel sözlüğünden. */
function sceneBoard(id, from, bar) {
  let board = sceneBoards.get(id)
  if (!board) {
    board = {
      ...BOARDS.home,
      key: sceneKey(id),
      defaults: sceneDefaults(id, from),
      labels: { bar },
    }
    sceneBoards.set(id, board)
  }
  return board
}

/** Bir sahnenin kartları (kayıtlı düzen, yoksa varsayılan) — panelde "X sahnesinde açık" notu için. */
function membersOf(id, from) {
  let items = sceneDefaults(id, from)
  try {
    const raw = JSON.parse(localStorage.getItem(sceneKey(id)) ?? "null")
    if (Array.isArray(raw?.items)) items = raw.items
  } catch {
    // Bozuk kayıt: varsayılan kartlar.
  }
  return items.flatMap((x) => (Array.isArray(x?.stack) ? x.stack : [x?.id])).filter(Boolean)
}

/**
 * Anasayfa'nın düzenlenebilir hâli (kitle `HOME_EDIT`, `lib/widgetsPolicy.js`): bugünkü
 * kartlar widget olarak (`HOME_LAYOUT`), Pano'yla aynı düzenleme — sağ alttaki cam düğme
 * ("Anasayfayı düzenle", `HomeEditFab`), sürükle, yığın, görünüm, önizlemeli katalog. "Diğer widget'lar"
 * YOK: eklenen her şey ana bölüme, asistan ayracının üstüne. Veriler sayfanın (`env`);
 * To Do panosu yalnız burada istenir (öneri ve To-Do özeti widget'ları için) — eski sabit
 * Anasayfa onu hiç çağırmaz.
 *
 * Sayfa düzeni (Profil › Görünüm): **Sahneler** (varsayılan) — sahnenin kendi kaydı
 * (`scene`, kişinin kurduğu sahnede `sceneFrom`; düzenleme çubuğunun adı `sceneBar`), tek ızgara (`hs-scn`, `scenes/scenes.css`) ve
 * yanında sahne paneli: `panel(parçalar)` panonun kartlarını ve ekleme/kaldırmayı alır
 * (`scenes/HomeScenes`); `panelSide` açıkken pano ile panel yan yana durur.
 */
export function HomeBoard({
  env,
  scene = null,
  sceneFrom,
  sceneBar,
  scenes,
  panel = null,
  panelSide = false,
}) {
  const { t } = useLocale()
  // Sahne verilmişse o sahnenin panosu (kendi kaydı); yoksa Anasayfa'nın kendisi.
  const boardDef = scene ? sceneBoard(scene, sceneFrom, sceneBar) : BOARDS.home
  const realBoard = useTodoBoard()
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstBoard() : null
  const board = worst ? { ...realBoard, ...worst, updateTask: worstUpdateTask } : realBoard
  const available = useAvailableWidgets(env.ctx.pageAccess)
  const layout = useWidgetLayout(available, boardDef)
  const render = renderWidgetFor({ ...env, ctx: { ...env.ctx, board } })
  const editing = useBoardEditing()
  const nameOf = (id) => t(CATALOG[id].title)
  const zoneOf = (id) => CATALOG[id]?.zone ?? null
  // Öteki sahnelerin kartları: panel açılabilecekken okunur (kayıtlar küçük).
  const others = useMemo(
    () =>
      panel && scene
        ? (scenes ?? [])
            .filter((s) => s.id !== scene)
            .map((s) => ({ id: s.id, ids: membersOf(s.id, s.from) }))
        : [],
    [panel, scene, scenes],
  )
  return (
    <WidgetEditor layout={layout} render={render}>
      <div className={scene ? "hs-scn" : "hs-home"}>
        <BoardEditBar />
        <div className="hs-split" data-shelf={panelSide ? "" : undefined}>
          <div className="hs-col">
            {/* Zemin (düzenleme çubuğu): arkada paletin yumuşak ışıkları — cam kart onunla belirginleşir. */}
            <div
              className={
                scene ? "hs-board relative isolate @container/myspace" : "relative isolate"
              }
            >
              {layout.ambient && <div aria-hidden="true" className="board-ambient" />}
              <MainWidgets render={render} />
            </div>
            {/* Soru kutusu kartın yerinde: sayfanın altında yüzen sohbet çubuğu. */}
            <Suspense fallback={null}>
              <BoardCommand
                env={env}
                layout={layout}
                nameOf={nameOf}
                zoneOf={zoneOf}
                editing={editing}
              />
            </Suspense>
          </div>
          {scene && panel && (
            <EditorSlot>
              {(actions) =>
                panel({
                  cards: layout.items
                    .flatMap((x) => (x.stack ?? [x.id]).map((id) => ({ id, slot: x.id })))
                    .filter(notAsk),
                  shape: layout.items.filter(notAsk).map((x) => ({ id: x.id, wide: x.wide })),
                  hidden: layout.hidden.filter((id) => id !== "ask"),
                  others,
                  nameOf,
                  add: (id) => layout.add(id, zoneOf(id) ?? layout.addZone),
                  remove: (slot, id) => layout.remove(slot, id),
                  openCatalog: () => actions.openCatalog(),
                })
              }
            </EditorSlot>
          )}
        </div>
      </div>
    </WidgetEditor>
  )
}
