import { useId, useRef, useState } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import AirplaneTakeOff01Icon from "@hugeicons/core-free-icons/AirplaneTakeOff01Icon"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/homeLayout"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"
import { SceneNew } from "./SceneNew"
import "./sceneStrip.css"

const ICONS = {
  morning: Sun03Icon,
  day: Calendar03Icon,
  evening: Moon02Icon,
  travel: AirplaneTakeOff01Icon,
}
const sceneIcon = (id) => ICONS[id] ?? Layers01Icon
// Seçim vurgusunun yayı: SegmentedControl'deki gibi hafif esneyerek yerine oturur.
const GLIDE = { type: "spring", visualDuration: 0.38, bounce: 0.14 }
const STILL = { duration: 0 }

/**
 * Sekme (B) ve simge (E) biçimleri: hemen uygulanan seçenekler, yalnız seçili olan sekme durağı;
 * oklar, Home ve End seçimi taşır (sağdan sola dilde ters). Vurgu (alt çizgi ya da hap) seçenekler
 * arasında kayar; simge biçiminde yalnız seçilinin adı görünür, ötekiler adını balonda ve ekran
 * okuyucuda söyler.
 */
function SceneChoices({ variant, scenes, current, nameOf, onPick, label }) {
  const id = useId()
  const reduce = useReducedMotion()
  const refs = useRef([])
  const at = Math.max(
    0,
    scenes.findIndex((s) => s === current),
  )
  const onKeyDown = (e) => {
    const next = rovingIndex(e.key, at, scenes.length, isRtl(e.currentTarget))
    if (next < 0) return
    e.preventDefault()
    if (next !== at) onPick(scenes[next])
    refs.current[next]?.focus({ preventScroll: true })
  }
  const icons = variant === "icons"
  return (
    <div role="group" aria-label={label} className="scs-choices">
      <LayoutGroup id={id}>
        {scenes.map((scene, i) => {
          const on = i === at
          const name = nameOf(scene)
          return (
            <button
              key={scene}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              aria-pressed={on}
              aria-label={icons && !on ? name : undefined}
              title={icons && !on ? name : undefined}
              tabIndex={on ? 0 : -1}
              className="scs-choice"
              onClick={() => !on && onPick(scene)}
              onKeyDown={onKeyDown}
            >
              {on && (
                <motion.span
                  layoutId="scs-mark"
                  aria-hidden="true"
                  transition={reduce ? STILL : GLIDE}
                  className="scs-mark"
                />
              )}
              {icons && (
                <HugeiconsIcon icon={sceneIcon(scene)} strokeWidth={1.8} aria-hidden="true" />
              )}
              {(!icons || on) && <span className="scs-name">{name}</span>}
            </button>
          )
        })}
      </LayoutGroup>
    </div>
  )
}

/**
 * Seçici biçimi (D): açık sahne tek düğmede (palet kutusunda simge, ad, kuralı), menüden başka
 * sahne seçilir ya da yenisi kurulur. Şeridin en sakin hâli: TYRO'nun notu yanında okunur.
 */
function ScenePicker({ scenes, current, nameOf, ruleOf, onPick, label, newScene, next }) {
  const { t } = useLocale()
  const [adding, setAdding] = useState(false)
  const pending = useRef(false)
  const rule = ruleOf(current)
  const lead =
    next && t(next.tomorrow ? "homeLayout.scenes.nextTomorrow" : "homeLayout.scenes.next")
  // Ekran okuyucu adı görünen yazıyla aynı sırada başlar (sesle komut veren kişi gördüğünü söyler).
  const aria = `${[nameOf(current), rule, lead, next?.name, next?.time].filter(Boolean).join(" ")} — ${label}`
  const button = (
    <DropdownMenuTrigger className="scs-pick" data-tour="scenes" aria-label={aria}>
      <span className="scs-pick-ic" aria-hidden="true">
        <HugeiconsIcon icon={sceneIcon(current)} strokeWidth={1.9} />
      </span>
      {/* Parçalar arasındaki boşluklar esnek kutuda görünmez ama yazının okunuşunu ayırır
          ("Akşam17:00" değil "Akşam 17:00"); ekran okuyucu adı bununla eşleşir. */}
      <span className="scs-pick-name">{nameOf(current)}</span>{" "}
      {rule && <span className="scs-pick-rule">{rule}</span>}{" "}
      {next && (
        <span className="scs-next" aria-hidden="true">
          <span className="scs-next-lead">{lead}</span>{" "}
          <HugeiconsIcon icon={sceneIcon(next.scene)} strokeWidth={1.9} />
          <b className="scs-next-name">{next.name}</b> <span>{next.time}</span>
        </span>
      )}
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        strokeWidth={2}
        aria-hidden="true"
        className="scs-pick-chev"
      />
    </DropdownMenuTrigger>
  )
  return (
    <DropdownMenu modal={false}>
      {newScene ? (
        <SceneNew {...newScene} anchor={button} open={adding} onOpenChange={setAdding} />
      ) : (
        button
      )}
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="scs-menu"
        // "Yeni sahne" seçilince odak tetiğe dönmez: açılan kart odağı alır.
        onCloseAutoFocus={(e) => {
          if (!pending.current) return
          pending.current = false
          e.preventDefault()
          setAdding(true)
        }}
      >
        <DropdownMenuRadioGroup value={current} onValueChange={onPick}>
          {scenes.map((scene) => (
            <DropdownMenuRadioItem key={scene} value={scene}>
              <HugeiconsIcon icon={sceneIcon(scene)} strokeWidth={1.8} aria-hidden="true" />
              <span className="scs-menu-name">{nameOf(scene)}</span>
              {ruleOf(scene) && <span className="scs-menu-rule">{ruleOf(scene)}</span>}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {newScene && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => (pending.current = true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
              {t("homeLayout.scenes.newTitle")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * SAHNE ŞERİDİNİN SEÇİCİSİ — kişinin Profil › Görünüm'de seçtiği biçimle: seçici (varsayılan),
 * alt çizgili sekmeler ya da yalnız simgeler. `newScene` yoksa (sahne sınırı doldu) "+ Sahne" çizilmez.
 */
export function SceneStrip({ variant, scenes, current, nameOf, ruleOf, onPick, newScene, next }) {
  const { t } = useLocale()
  const label = t("homeLayout.scenes.label")
  if (variant === "picker")
    return (
      <ScenePicker
        scenes={scenes}
        current={current}
        nameOf={nameOf}
        ruleOf={ruleOf}
        onPick={onPick}
        label={label}
        newScene={newScene}
        next={next}
      />
    )
  return (
    <div className="scs-track" data-tour="scenes">
      <SceneChoices
        variant={variant}
        scenes={scenes}
        current={current}
        nameOf={nameOf}
        onPick={onPick}
        label={label}
      />
      {newScene && <SceneNew {...newScene} />}
    </div>
  )
}
