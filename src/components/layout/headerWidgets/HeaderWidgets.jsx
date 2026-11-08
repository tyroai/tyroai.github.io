import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react"
import { widgetAvailable } from "@/features/widgets/layout"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useRmAccess } from "@/features/rm/data/useRmAccess"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { useWeather } from "@/hooks/useWeather"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EditTray } from "./EditTray"
import { HeaderCardHandle } from "./HeaderCardHandle"
import { useHeaderFlash } from "./headerFlash"
import { useHeaderSay } from "./headerSay"
import { headerFaceOf, headerLookOf, headerTitleKey, useHeaderWidgets } from "./headerStore"
import { SmartProbes } from "./SmartProbes"
import { pickTop } from "./smartTop"
import { StackPanel } from "./StackPanel"
import { setStackTop, useStackTop } from "./stackTop"
import { StackGlyph, TrayIcon, TrayOverlay, WidgetPanel } from "./trayParts"
import { TRAY_BTN, faceWidth, panelClass } from "./trayStyles"
import { useTrayFits } from "./useTrayFits"
import { LiveCapsule } from "./faces/LiveCapsule"
import { RadioTrayControls } from "./faces/RadioTray"
import { RadioBars } from "./WidgetLabels"
import "./trayFlash.css"
import "./trayLooks.css"

// Toplu tepsinin penceresi: sekmeler ve kart, kartın köşesiyle eşmerkezli buzlu bir kap.
const STACK =
  "w-[min(24rem,calc(100vw-1.5rem))] gap-0 rounded-[2.25rem] bg-popover/90 p-2 pt-2.5 text-base ring-1 ring-foreground/10 shadow-[0_28px_70px_-24px_rgb(15_23_42/0.45)] backdrop-blur-xl dark:shadow-[0_28px_70px_-20px_rgb(0_0_0/0.8)]"

/**
 * Tyrofy'ın mini oynatıcı kapsülü (masaüstü ve tablet): istasyon açıkken küre (widget'ı açar),
 * duraklat/çal ve kapat tek kapsülde; çalarken kenarı paletin degradesi (header hapının dili).
 * Telefonda yok: orada kilit ekranı ve bildirimdeki medya denetimi var.
 */
function RadioCapsule({ mobile, children }) {
  const radio = useRadioPlayer()
  const on = !mobile && Boolean(radio.station)
  // Kap hep aynı öğe (boştayken `contents`): kapsül sonradan sarınca düğme ve penceresi yeniden
  // kuruluyordu — kartta ilk "çal"a basınca pencere kapanırdı.
  return (
    <div
      className={cn(
        on ? "radio-capsule flex h-9 shrink-0 items-center rounded-full border p-0.5" : "contents",
        on &&
          (radio.status === "playing"
            ? "radio-chip-live border-transparent"
            : "border-border/70 bg-card/80"),
      )}
    >
      {children}
      {on && <RadioTrayControls />}
    </div>
  )
}

/**
 * Tek widget'ın düğmesi ve penceresi (telefonda çekmecesi). `chip`: kaydedilmiş görünüm — kapsül
 * yalnız açıkça seçildiyse; radyonun kendi kapsülü var, onda yok.
 */
function WidgetButton({ id, look, chip, face, mobile }) {
  const { t } = useLocale()
  const flash = useHeaderFlash()
  const [open, setOpen] = useState(false)
  const title = t(headerTitleKey(id))
  const overlay = (
    <TrayOverlay
      mobile={mobile}
      open={open}
      onOpenChange={setOpen}
      title={title}
      className={panelClass(id)}
      // Tyrofy'ın sahnesi kendi halesini ve köşesini taşır: yapışkan açılış onda yok.
      goo={id !== "radio"}
      trigger={
        <TrayIcon
          id={id}
          title={title}
          chip={id === "radio" ? undefined : chip}
          face={face}
          className={cn(
            flash?.id === id && "tray-flash",
            id === "radio" && "radio-tray-orb rounded-full",
          )}
        />
      }
    >
      <div className="group/stack relative">
        <WidgetPanel id={id} look={look} />
        <HeaderCardHandle id={id} look={look} />
      </div>
    </TrayOverlay>
  )
  if (id === "radio") return <RadioCapsule mobile={mobile}>{overlay}</RadioCapsule>
  // Tibot'un yüzü listeyi bir kez okur (sayı rozeti); görünür kapsül yok.
  if (id === "tibot-rings")
    return (
      <LiveCapsule id={id} bare>
        {overlay}
      </LiveCapsule>
    )
  // Yapışkan notlarda yüzün parçası notları okur (deste canlı); çerçeve ve + yok, yalnız deste.
  if (id === "sticky")
    return (
      <LiveCapsule id={id} bare>
        {overlay}
      </LiveCapsule>
    )
  return overlay
}

/**
 * Radyo tepside değilken çalan istasyonun header'daki yüzü (`RadioFaceGate`): tepsideki radyonun
 * AYNISI — küre ve mini oynatıcı kapsülü, aynı görünüm; basınca widget aynı pencerede açılır.
 */
export function RadioTrayFace() {
  const { looks, faces } = useHeaderWidgets()
  const mobile = useIsMobile()
  return (
    <WidgetButton
      id="radio"
      look={headerLookOf(looks, "radio")}
      chip={looks.radio}
      face={headerFaceOf(faces, "radio")}
      mobile={mobile}
    />
  )
}

const WeatherDetail = lazy(() => import("./faces/WeatherDetail"))

/**
 * Hava: tıklayınca doğrudan ayrıntı penceresi — Anasayfa'nın hava kartına basınca açılanın aynısı
 * (saatlik şerit, günler). Hava henüz okunamadıysa kartın penceresi (yükleniyor · yeniden dene).
 */
function WeatherButton({ look, chip, face, mobile }) {
  const { t } = useLocale()
  const w = useWeather()
  const flash = useHeaderFlash()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  if (w.status !== "ready")
    return <WidgetButton id="weather" look={look} chip={chip} face={face} mobile={mobile} />
  const title = t(headerTitleKey("weather"))
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <TrayIcon
            ref={ref}
            id="weather"
            title={title}
            chip={chip}
            face={face}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(flash?.id === "weather" && "tray-flash")}
          />
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
      {open && (
        <Suspense fallback={null}>
          <WeatherDetail open onOpenChange={setOpen} w={w} returnFocusRef={ref} />
        </Suspense>
      )}
    </>
  )
}

/**
 * Sığmayınca: tek düğme, açılınca sekmeli yığın (radyo çalıyorsa düğmede çubuklar). Düğme o an
 * en ilgili yüzü gösterir (`smartTop`: yaklaşan ya da süren toplantı · odak sayacı · gecikmiş
 * hedef), yoksa son bakılanı; açılınca o sekmeyle açılır. Açıkken düğmenin yüzü değişmez.
 */
function StackButton({ items, looks, faces, mobile }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const title = t("headerWidgets.title")
  const stackTop = useStackTop()
  const [scores, setScores] = useState({})
  const onScore = useCallback(
    (id, score) => setScores((s) => (s[id] === score ? s : { ...s, [id]: score })),
    [],
  )
  const live = pickTop(scores, items) ?? (items.includes(stackTop) ? stackTop : items[0])
  const [pinned, setPinned] = useState(null)
  const top = open && pinned ? pinned : live
  // Toplu tepside yeni gelen widget'ın parlaması toplu düğmede.
  const flash = useHeaderFlash()
  return (
    <>
      <SmartProbes items={items} onScore={onScore} />
      <TrayOverlay
        mobile={mobile}
        open={open}
        onOpenChange={(next) => {
          // Düğmede görünen yüz açılan sekme olsun; açıkken düğme yüz değiştirmesin.
          if (next) setStackTop(live)
          setPinned(next ? live : null)
          setOpen(next)
        }}
        title={title}
        align="end"
        className={STACK}
        trigger={
          <button
            type="button"
            className={cn(TRAY_BTN, flash && items.includes(flash.id) && "tray-flash")}
          >
            <span className="sr-only">
              {t("headerWidgets.stack", { name: t(headerTitleKey(top)), n: items.length })}
            </span>
            <StackGlyph items={items} top={top} face={headerFaceOf(faces, top)} />
            {/* Radyo üstte değilken çalıyorsa çubuklar yine görünür. */}
            {top !== "radio" && items.includes("radio") && <RadioBars />}
          </button>
        }
      >
        <StackPanel items={items} looks={looks} />
      </TrayOverlay>
    </>
  )
}

/** Bu kişiye açık widget mı (erişim kuralı) — tepsi ve çentiğin widget yuvaları ortak. */
function useTrayAvailable() {
  const { feed, todo, selfService, tibot } = usePageAccess()
  const rm = useRmAccess().state === "granted"
  return useCallback(
    (id) => widgetAvailable(id, { feed, todo, selfService, rm, tibot }),
    [feed, todo, selfService, rm, tibot],
  )
}

/** Erişim kuralını çocuğa işlev olarak verir (çentiğin yuvaları ve seçicisi; dosya yalnız bileşen ihraç eder). */
export function TrayAccess({ children }) {
  return children(useTrayAvailable())
}

/**
 * Header'daki widget tepsisi (macOS'un menü çubuğu gibi) — sabitlenen widget'lar arama ile
 * sağdaki düğmeler arasında birer ikon; tıklayınca ikonun altında widget'ın kendisi açılır.
 * Yer yetmezse (ya da telefonda) ikonlar tek düğmede toplanır (`useTrayFits`). Anasayfa ya
 * da Pano düzenlenirken tepsi de düzenlenir (`EditTray`). Bu kişiye kapalı widget (ör. To-Do
 * erişimi gidince To-Do özeti) gizlenir, kayıtta kalır.
 */
export default function HeaderWidgets({ free, editing }) {
  const { t } = useLocale()
  const { items: saved, looks, faces } = useHeaderWidgets()
  const said = useHeaderSay()
  const available = useTrayAvailable()
  const items = useMemo(() => saved.filter(available), [saved, available])
  const mobile = useIsMobile()
  const tray = useRef(null)
  const fits = useTrayFits(
    mobile ? null : free,
    tray,
    // Düzenlerken ikonlar arası 12 px (rozet kendi ikonunda kalsın) ve sonda "+".
    items.reduce((sum, id) => sum + faceWidth(id, headerFaceOf(faces, id), looks[id]), 0) +
      (editing ? 44 + items.length * 12 : 0),
  )
  const inline = !mobile && fits

  if (editing)
    return (
      <EditTray
        ref={tray}
        inline={inline}
        mobile={mobile}
        items={items}
        looks={looks}
        available={available}
      />
    )
  if (!items.length) return null
  return (
    <div
      ref={tray}
      role="group"
      aria-label={t("headerWidgets.title")}
      data-tour="tray"
      className="flex shrink-0 items-center"
    >
      {/* Pencerelerin görünüm/renk duyurusu (`headerSay`): pencere kapansa da burada kalır. */}
      <span role="status" className="sr-only">
        {said}
      </span>
      {inline || items.length === 1 ? (
        items.map((id) =>
          id === "weather" ? (
            <WeatherButton
              key={id}
              look={headerLookOf(looks, id)}
              chip={looks[id]}
              face={headerFaceOf(faces, id)}
              mobile={mobile}
            />
          ) : (
            <WidgetButton
              key={id}
              id={id}
              look={headerLookOf(looks, id)}
              chip={looks[id]}
              face={headerFaceOf(faces, id)}
              mobile={mobile}
            />
          ),
        )
      ) : (
        <>
          <StackButton items={items} looks={looks} faces={faces} mobile={mobile} />
          {/* Toplu tepside de notların destesi canlı: liste okunur, görünür bir şey eklenmez. */}
          {items.includes("sticky") && <LiveCapsule id="sticky" bare />}
          {items.includes("tibot-rings") && <LiveCapsule id="tibot-rings" bare />}
        </>
      )}
    </div>
  )
}
