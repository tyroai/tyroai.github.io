import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import SidebarLeftIcon from "@hugeicons/core-free-icons/SidebarLeftIcon"
import Robot01Icon from "@hugeicons/core-free-icons/Robot01Icon"
import { useAnimatedIcon } from "@/hooks/useAnimatedIcon"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HeaderSearch } from "@/components/common/HeaderSearch"
import { BoardEditToggle } from "./BoardEditToggle"
import { BellPopover } from "@/components/common/bell/BellPopover"
import { ControlCenterGate } from "./control/ControlCenterGate"
import { DatasetSwitcher } from "@demo/ui/DatasetSwitcher"
import { HeaderWidgetsGate } from "./headerWidgets/HeaderWidgetsGate"
import { RadioFaceGate } from "./headerWidgets/RadioFaceGate"
import { FocusTimerGate } from "@/features/widgets/focustimer/FocusTimerGate"
import { useHeaderWidgets } from "./headerWidgets/headerStore"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Robot01Icon as AnimatedRobotIcon } from "@/components/ui/robot-01"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

function PremiumSidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  const { t } = useLocale()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      data-tour="nav-trigger"
      aria-label={t("nav.toggleSidebar")}
      className="-ml-1 size-9 shrink-0 rounded-xl [&_svg]:!size-5 text-muted-foreground hover:text-foreground relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
    >
      <HugeiconsIcon icon={SidebarLeftIcon} />
    </Button>
  )
}

const PAGE_LABEL_KEY = {
  dashboard: "nav.dashboard",
  chat: "nav.chat",
  feed: "nav.feed",
  myspace: "nav.myspace",
  todo: "nav.todo",
  calendar: "nav.calendar",
  selfservice: "nav.selfService",
  tibot: "nav.tibot",
  widgets: "nav.widgets",
  settings: "nav.settings",
  help: "nav.help",
  profile: "nav.profile",
  // ⚠️ Bu ikisi EKSİKTİ: /security ve /whats-new açıkken başlık "Dashboard"
  // yazıyordu — yani ekranın söylediği yer ile bulunulan yer farklıydı.
  security: "nav.security",
  "whats-new": "nav.whatsNew",
  rm: "nav.rm",
}

export function Header({ activeId = "myspace", onOpenSearch, onToggleDock, dockOpen }) {
  /* Posta, takvim ve dünya saati ÇENTİKTE (genişte sağ kenar rayı, darda header çizgisinin altındaki
     şerit `MobileNotch`), header'da değil. Çentik (kullanıcı menüsünün sayfaları hariç) her durumda ekranda — kenarda panel
     açıkken panelin soluna taşınır (`useNotchEdge`) — yani header panel açılınca değişmez: özel
     günler · TYRO. Saat ve tarih Anasayfa'nın kaşında. Ayrıntı: docs/features/sag-centik.md. */
  const { t } = useLocale()
  const { icon: tyroIcon, hoverProps: tyroHover } = useAnimatedIcon({
    icon: Robot01Icon,
    animatedIcon: AnimatedRobotIcon,
  })
  const pageLabelKey = PAGE_LABEL_KEY[activeId] ?? "nav.myspace"
  // Sayfa adıyla arama arasındaki boşluk: widget tepsisi buna bakıp sığıyor mu karar verir.
  const [free, setFree] = useState(null)
  // Radyo tepsideyse çalan istasyon zaten orada; değilse (çentikte ya da hiçbir yerde) header
  // tepsideki yüzün aynısını çizer (`RadioFaceGate`).
  const radioInTray = useHeaderWidgets().items.includes("radio")

  return (
    <header
      data-slot="app-header"
      // Düz zemin, bulanık cam DEĞİL: içerik header'ın altından geçmiyor (görünüş aynı), ama
      // içindeki her hareket (radyonun küresi ve çubukları) tam genişlikte bulanıklığı her karede
      // yeniden hesaplatıyordu (docs/performance.md).
      className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-14 pwa:h-11 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-background"
    >
      {/* Dar ekranda boşluklar daralır: kontroller arasında gap-3 tek başına
          ~84px yer tutuyor ve dosya/posta/takvim düğmeleri geldikten sonra
          360px'te satır taşıyor. Kontrol saklamak yerine aradaki boşluğu
          almak, hiçbir işlevi gizlemeden yeri açıyor. */}
      <div className="flex w-full items-center gap-1.5 px-3 pb-px sm:gap-3 sm:px-4 lg:px-6">
        <PremiumSidebarTrigger />

        <span className="h-5 w-px shrink-0 bg-border/70 rounded-full" aria-hidden="true" />

        <Breadcrumb className="min-w-0">
          {/* Marka yalnız geniş ekranda: tablet dikeyde (kenar çubuğu açık, logo orada) "tyro ›"
              sığmıyor ve başlık iki satıra kırılıyordu. */}
          <BreadcrumbList className="min-w-0 flex-nowrap text-sm">
            <BreadcrumbItem className="hidden lg:flex items-center">
              {/* Düz metin, sayfa adıyla aynı yazı; logo kenar çubuğunda. */}
              <a
                href="#"
                className="font-medium text-foreground transition-opacity hover:opacity-80"
              >
                tyro
              </a>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:block [&>svg]:size-3.5 text-muted-foreground/60" />
            {/* `min-w-0`: uzun sayfa adı (RU "Самообслуживание") kesilsin, arama düğmesine binmesin. */}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-medium">{t(pageLabelKey)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Boşluğun kendisi (`flex-1`): eksi kenar boşluğu satırın aralığını geri alır, düzen
            değişmez. */}
        <span ref={setFree} aria-hidden="true" className="-ms-1.5 min-w-0 flex-1 sm:-ms-3" />

        <HeaderSearch onOpen={onOpenSearch} />

        <button
          type="button"
          onClick={onOpenSearch}
          data-tour="search"
          aria-label={t("header.searchAria")}
          className="ml-auto sm:hidden grid shrink-0 place-items-center size-10 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition relative pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5"
        >
          <HugeiconsIcon icon={Search01Icon} className="size-5" />
        </button>

        {/* Widget tepsisi (macOS'un menü çubuğu gibi): aramayla sağdaki düğmeler arasında. */}
        <HeaderWidgetsGate free={free} />
        {/* Odak sayacı çalışırken bitiş uyarısı (her sayfada). */}
        <FocusTimerGate />

        {/* Pano'yu düzenle — yalnız Pano'da; Anasayfa'nınki sayfanın sağ altındaki cam düğme
            (`HomeEditFab`). */}
        {activeId === "widgets" && <BoardEditToggle labelKey="header.editBoard" />}
        {/* Radyo çalarken (sayfa değişse de yayın sürer): tepsinin yüzü — küre, duraklat / kapat. */}
        {!radioInTray && <RadioFaceGate />}
        {/* Bildirim çanı (özel günler + Keşfet). Saat ve tarih header'da yok: Anasayfa'nın kaşında
            (ürün sahibi); çan her genişlikte yalnız ikon. */}
        {/* Denetim Merkezi (macOS'taki gibi çanın solunda): araçlar ve modlar tek pencerede. */}
        <DatasetSwitcher />
        <ControlCenterGate />
        <BellPopover />
        {/* Sohbeti sayfanın YANINDA açar. Sidebar'daki Sohbet girdisi hâlâ tam
            sayfaya gider — iki farklı niyet: "bunu okurken asistanla çalış" ve
            "konuşmaya git".

            Satırın sonunda ve buradaki tek DOLU kontrol: header'ın birincil
            eylemi. Dolgu palet token'larından, yani seçilen paleti takip
            ediyor.

            Hap her zaman marka renkli olduğu için "açık" durumu renkle
            verilemiyor; onun yerine bir halka.

            Yalnız ikon: adı `aria-label` ve ipucu balonu taşır; boyu yanındaki
            36px'lik düğmelerden bilerek kısa (dolu daire, kontur glifden ağır okunur). */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              aria-label={t("chatDock.toggle")}
              aria-pressed={dockOpen}
              // Telefonda panel kapanınca odak buraya döner (açan öğe artık yoksa).
              data-dock-toggle=""
              data-tour="chat-dock"
              onClick={onToggleDock}
              {...tyroHover}
              className={cn(
                // Yanındaki 36px'lik ikon düğmelerinden bilerek kısa: dolu bir
                // hap zaten kontur bir glife göre daha ağır okunuyor, aynı
                // yüksekliğe çıkarınca satırın en gürültülü öğesi oluyordu.
                // ⚠️ `max(2rem,28px)`: alçak pencerede kök yazı 12,8px'e iniyor
                // (bkz. index.css yoğunluk bloğu) ve `h-8` o zaman 25,6px
                // oluyor — dokunma hedefinin altı. Hap 28'de durur; 16px kökte
                // boy birebir eskisi.
                "size-8 shrink-0 rounded-full p-0 [&_svg]:!size-[1.125rem] [min-height:max(2rem,28px)] [min-width:max(2rem,28px)]",
                // Dokunmatikte görünmez pay: 32 px hap 44 px'lik hedef olur, satır taşmaz.
                "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5",
                // Dashboard'daki AI asistan rozetlerinin ta kendisi olan dolgu,
                // yani asistan iki yerde de aynı şey gibi okunuyor.
                // `border-0` ŞART: Button'ın tabanı `border border-transparent`
                // + `bg-clip-padding` taşıyor, yani dolgu o 1px kenarlığın
                // ALTINA boyanmıyor ve arkadaki header oradan sızıyor — halka
                // hemen dışına oturduğunda bu, hapı çevreleyen beyaz bir çizgi
                // olarak okunuyor.
                "border-0 bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp",
                "shadow-sm transition hover:brightness-110 hover:text-brand-on-ramp",
                // Halka hapa DOĞRUDAN yaslanır: `ring-offset-1` araya
                // `--background` renginde 1px koyuyor ve açık temada bu, hapı
                // çevreleyen beyaz bir çizgi gibi okunuyor.
                dockOpen && "ring-2 ring-brand/45",
              )}
            >
              {tyroIcon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chatDock.toggle")}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
