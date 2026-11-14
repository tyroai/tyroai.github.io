import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import DashboardSquareEditIcon from "@hugeicons/core-free-icons/DashboardSquareEditIcon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { setBoardEditing } from "@/lib/boardEdit"
import { getDateTimeFormat } from "@/lib/intl-cache"
import "@/lib/i18n/homeLayout"
import { notify } from "@/lib/notify"
import { readSceneStrip, subscribeSceneStrip } from "@/lib/sceneStrip"
import { HomeBoard } from "../HomeBoard"
import { nextScene } from "../lib/sceneNext"
import { sceneSignals } from "../lib/sceneSignals"
import {
  MAX_CUSTOM,
  RULES,
  addScene,
  autoStep,
  baseOf,
  copyLayout,
  dropLayout,
  isBuiltIn,
  noteOf,
  pickScene,
  readSceneState,
  removeScene,
  restoreLayout,
  ruleOf,
  sceneIds,
  setRule,
  subscribeScene,
  undoAuto,
  writeSceneState,
} from "../lib/scenes"
import { ScenePanel } from "./ScenePanel"
import { SceneStrip } from "./SceneStrip"
import "./scenes.css"

const TIME = { hour: "2-digit", minute: "2-digit" }
const UNDO_MS = 8000
// Panel panonun yanına bu enden sonra sığar (`scenes.css`teki kap sorgusuyla aynı: 60rem).
const SIDE_FROM = 960
const MANUAL = ["manual"]

/** Şeridin eni panelin yana sığacağı kadar mı (kap sorgusunun JS karşılığı). */
function useWide(ref) {
  const [wide, setWide] = useState(true)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const measure = () => setWide(node.getBoundingClientRect().width >= SIDE_FROM)
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(node)
    return () => watch.disconnect()
  }, [ref])
  return wide
}

/**
 * SAHNELER — Anasayfa'nın üstünde sahne şeridi (Sabah · Gün içi · Akşam · Yolda, kişinin kurdukları
 * ve "+ Sahne"), altında açık sahnenin panosu (`HomeBoard`, sahnenin kendi kaydıyla; sahne
 * değişince pano baştan kurulur). TYRO sahneyi saate ve takvime göre açar ve söyler ("18:10 · TYRO
 * Akşam sahnesini açtı", yanında Geri al); elle seçim o dilim boyunca korunur (`lib/scenes`).
 * "Sahneyi düzenle" sahne panelini açar (`ScenePanel`): geniş ekranda panonun yanında sütun, dar
 * ekranda sağ panel, telefonda alt çekmece. Panel yalnız düzenlerken görünür: normal hâlde pano tam
 * genişliktir ve sayfa her açılışta panelsiz gelir (açık/kapalı saklanmaz).
 */
// Simge değişiminin yayı: Yedek düzendeki "Anasayfayı düzenle" düğmesiyle aynı.
const SWAP = { type: "spring", stiffness: 420, damping: 28 }

export function HomeScenes({ env }) {
  const { t, locale } = useLocale()
  const state = useSyncExternalStore(subscribeScene, readSceneState, readSceneState)
  const { cal, now: nowMs } = env.ctx
  const events = cal?.events
  const signals = useMemo(() => sceneSignals(events, nowMs), [events, nowMs])
  // Takvim gelmeden karar verilmez: yolculuk ve toplantı kuralları yanlış sahneyi açmasın.
  const ready = cal?.status !== "loading"
  // Saat kuralı takvimi beklemez: sahne ilk boyamadan önce saate göre açılır (akşam açılan sayfa
  // önce Gün içi'ni gösterip Akşam'a atlamasın). Takvim gelince aşağıdaki adım yolculuk/toplantı
  // kurallarını uygular; bu dilimin kilidi (`hold`) ona bırakılır.
  useLayoutEffect(() => {
    const s = readSceneState()
    const next = autoStep(s, sceneSignals([], nowMs), new Date(nowMs))
    if (next && next.scene !== s.scene) writeSceneState({ ...next, hold: s.hold })
    // Yalnız ilk boyamada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!ready) return
    const next = autoStep(readSceneState(), signals, new Date(nowMs))
    if (next) writeSceneState(next)
  }, [ready, signals, nowMs])

  const strip = useRef(null)
  const wide = useWide(strip)
  const phone = useIsMobile()
  // Panel yalnız "Sahneyi düzenle"ye basınca açılır (geniş ekranda sütun, dar ekranda çekmece).
  const [open, setOpen] = useState(false)
  const now = new Date(nowMs)
  const names = new Map(state.custom.map((x) => [x.id, x.name]))
  const nameOf = (id) => names.get(id) ?? t(`homeLayout.scenes.${id}`)
  const ruleText = (id) => {
    if (!isBuiltIn(id)) return null
    // "Elle" seçili sahnenin altında bilgi taşımaz: yalnız TYRO'nun kuralı yazılır.
    const r = ruleOf(state, id)
    return r === "manual" ? null : t(`homeLayout.scenes.rule.${id}.${r}`)
  }
  const variant = useSyncExternalStore(subscribeSceneStrip, readSceneStrip, readSceneStrip)
  // TYRO'nun sıradaki adımı (seçicide "Sonra ☾ Akşam 17:00"); takvim gelmeden tahmin edilmez.
  const upcoming = useMemo(
    () => (ready ? nextScene(state, signals, new Date(nowMs)) : null),
    [ready, state, signals, nowMs],
  )
  const next = upcoming && {
    scene: upcoming.scene,
    name: nameOf(upcoming.scene),
    time: getDateTimeFormat(locale, TIME).format(upcoming.at),
    tomorrow: upcoming.tomorrow,
  }
  const scenes = useMemo(
    () => sceneIds(state).map((id) => ({ id, from: baseOf(state, id) })),
    [state],
  )
  const current = state.scene
  const builtIn = isBuiltIn(current)
  const note = noteOf(state, now)
  const side = wide && open
  // Yan panel açıkken Escape düzenlemeyi bitirir (açık bir pencere ya da menü yoksa); odak düğmeye döner.
  useEffect(() => {
    if (!side) return undefined
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      if (document.querySelector('[role="dialog"], [data-radix-popper-content-wrapper]')) return
      setOpen(false)
      document.querySelector("[data-board-edit-toggle]")?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [side])

  const create = (name) => {
    const id = `c${Date.now().toString(36)}`
    const next = addScene(state, name, id)
    if (!next) return
    copyLayout(current, id)
    // Yeni sahne elle seçilmiş sayılır: TYRO bu dilimde başka sahneye geçmez.
    writeSceneState(pickScene(next, id, signals, new Date(nowMs)))
  }
  const remove = () => {
    const label = nameOf(current)
    const before = state.custom
    const raw = dropLayout(current)
    if (!wide) setOpen(false)
    writeSceneState(removeScene(state, current))
    notify.info(t("homeLayout.scenes.deleted", { scene: label }), {
      duration: UNDO_MS,
      action: {
        label: t("widgets.undo"),
        onClick: () => {
          restoreLayout(current, raw)
          writeSceneState({ ...readSceneState(), custom: before, scene: current, auto: null })
        },
      },
    })
  }
  const arrange = () => {
    if (!wide) setOpen(false)
    setBoardEditing(true)
  }

  // Pano kendi parçalarını verir (`board`); kapsayıcıyı ekranın eni seçer.
  const panel = (board) => {
    const title = t("homeLayout.scenes.panelTitle", { scene: nameOf(current) })
    const body = (close) => (
      <ScenePanel
        scene={{ id: current, name: nameOf(current) }}
        board={{
          ...board,
          openCatalog: () => {
            if (!wide) setOpen(false)
            board.openCatalog()
          },
        }}
        rules={builtIn ? RULES[current] : MANUAL}
        rule={builtIn ? ruleOf(state, current) : "manual"}
        ruleLabel={(r) =>
          t(
            r === "manual"
              ? "homeLayout.scenes.rule.manual"
              : `homeLayout.scenes.rule.${current}.${r}`,
          )
        }
        sceneName={nameOf}
        // Kural değişince sahne yerinde kalır; TYRO yeni kuralı bir sonraki dilimde uygular.
        onRule={(r) =>
          builtIn &&
          writeSceneState(pickScene(setRule(state, current, r), current, signals, new Date(nowMs)))
        }
        onArrange={arrange}
        onDelete={builtIn ? undefined : remove}
        onClose={close}
      />
    )
    if (wide)
      return open ? (
        <aside aria-label={t("homeLayout.scenes.editScene")} className="scp">
          {body(() => setOpen(false))}
        </aside>
      ) : null
    if (phone)
      return (
        <BottomSheet open={open} onOpenChange={setOpen} title={title}>
          <div className="scp scp--sheet">{body()}</div>
        </BottomSheet>
      )
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="scp-side">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="scp scp--sheet">{body()}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      <div ref={strip} className="scn" data-strip={variant}>
        <SceneStrip
          variant={variant}
          scenes={scenes.map(({ id }) => id)}
          current={current}
          nameOf={nameOf}
          ruleOf={ruleText}
          next={next}
          onPick={(scene) => writeSceneState(pickScene(state, scene, signals, new Date(nowMs)))}
          newScene={
            state.custom.length < MAX_CUSTOM && { phone, from: nameOf(current), onCreate: create }
          }
        />
        {note && (
          <span className="scn-auto">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.9} aria-hidden="true" />
            <span>
              {t("homeLayout.scenes.auto", {
                time: getDateTimeFormat(locale, TIME).format(new Date(note.at)),
                scene: nameOf(note.scene),
              })}
            </span>
            <button type="button" onClick={() => writeSceneState(undoAuto(state))}>
              {t("widgets.undo")}
            </button>
          </span>
        )}
        <span className="scn-gap" />
        {/* Düzenleme kipi bakışta okunsun (Yedek düzendeki yüzen düğmenin dili): açıkken düğme
            paletin dolgusuna döner, simge yay hareketiyle onay işaretine çevrilir, adı "Bitti" olur ve
            çevresinde palet halesi durur; açılırken hale bir kez genişleyip söner. */}
        <ActionButton
          tone={open ? "prominent" : "soft"}
          size="toolbar"
          data-board-edit-toggle=""
          // Anasayfa turunun "düzenle" adımı (Yedek düzende sağ alttaki düğme) burada bu düğmeyi gösterir.
          data-tour="home-edit"
          data-editing={open ? "" : undefined}
          aria-expanded={open}
          aria-label={t(open ? "widgets.done" : "homeLayout.scenes.editScene")}
          className="scn-edit"
          onClick={() => setOpen((v) => !v)}
        >
          <MotionConfig reducedMotion="user">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={open ? "done" : "edit"}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 40 }}
                transition={SWAP}
                className="scn-edit-ic"
              >
                <HugeiconsIcon
                  icon={open ? Tick02Icon : DashboardSquareEditIcon}
                  strokeWidth={open ? 2.2 : 1.8}
                />
              </motion.span>
            </AnimatePresence>
          </MotionConfig>
          <span className="scn-edit-label">
            {t(open ? "widgets.done" : "homeLayout.scenes.editScene")}
          </span>
        </ActionButton>
        <p role="status" aria-live="polite" className="sr-only">
          {t("homeLayout.scenes.opened", { scene: nameOf(current) })}
        </p>
      </div>
      <HomeBoard
        key={current}
        env={env}
        scene={current}
        sceneFrom={baseOf(state, current)}
        sceneBar={`homeLayout.scenes.edit.${builtIn ? current : "custom"}`}
        scenes={scenes}
        panel={panel}
        panelSide={side}
      />
    </>
  )
}
