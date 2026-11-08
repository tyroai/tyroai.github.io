import { HugeiconsIcon } from "@hugeicons/react"
import { Fragment, useState } from "react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PanelTopIcon from "@hugeicons/core-free-icons/PanelTopIcon"
import SmileIcon from "@hugeicons/core-free-icons/SmileIcon"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { InfoMenuItem } from "./InfoMenuItem"
import { LookChoices } from "./LookChoices"

const ITEM = "gap-2.5 pointer-coarse:min-h-11 [&_svg]:size-4"

/**
 * Kartın tutamağı — iPadOS'un pencere tutamağı (•••) gibi kartın üst kenarının ortasında; farede
 * üstüne gelince ya da odakta belirir, dokunmatikte hep sessizce durur. Menüsü kartın kendisiyle
 * ilgili: "Ne işe yarar?" (`info`: widget'ın açıklaması balonda) · kartın ayarı (`toggle`: havada
 * "Selamlama") · Görünüm (düzenleme kipine girmeden) · Header'a taşı · (header'da) Header'dan
 * kaldır. Verilmeyen satır menüde yok; hiç satır yoksa tutamak da yok. Büyüt ve Küçült kaldırıldı (ürün sahibinin
 * kararı, `docs/features/widgetlar.md`). `data-ctl="handle"`: kart yeniden kurulunca odak buraya döner.
 */
export function CardHandle({
  name,
  info = null,
  looks = [],
  look,
  onLook,
  onHeader,
  onRemove,
  removeLabel,
  toggle = null,
  className,
}) {
  const { t } = useLocale()
  // Menünün içi ilk açılışta kurulur: panoda her kartın tutamağı var, kapalı menüler çizimi
  // ağırlaştırıyordu. Kurulduktan sonra kalır (kapanış animasyonu yerinde).
  const [used, setUsed] = useState(false)
  const label = t("widgets.handle", { name })
  // Gruplar arasında ayraç: yalnız var olanlar (boş grubun ayracı menünün başında kalırdı).
  const groups = [
    info && <InfoMenuItem text={info} label={t("widgets.info.what")} className={ITEM} />,
    toggle && (
      <DropdownMenuCheckboxItem
        checked={toggle.checked}
        onCheckedChange={toggle.onChange}
        className={ITEM}
      >
        <HugeiconsIcon icon={SmileIcon} strokeWidth={1.8} />
        {toggle.label}
      </DropdownMenuCheckboxItem>
    ),
    looks.length > 1 && <LookChoices looks={looks} look={look} onLook={onLook} />,
    (onHeader || onRemove) && (
      <>
        {onHeader && (
          <DropdownMenuItem onSelect={onHeader} className={ITEM}>
            <HugeiconsIcon icon={PanelTopIcon} strokeWidth={1.8} />
            {t("widgets.toHeaderShort")}
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem onSelect={onRemove} className={ITEM}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
            {removeLabel}
          </DropdownMenuItem>
        )}
      </>
    ),
  ].filter(Boolean)
  if (!groups.length) return null
  return (
    <DropdownMenu modal={false} onOpenChange={(open) => open && setUsed(true)}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-ctl="handle"
          aria-label={label}
          title={label}
          // Kutu 44×24 (WCAG 2.5.8); görünen hap içinde 40×20.
          // Kutu kartın içine yalnız 8 px girer: kartın üstündeki yazı alanıyla (Anasayfa'nın "TYRO'ya
          // sor"u kenardan 9 px içeride) çakışıp dokunuşu çalmasın.
          className={cn(
            "group/handle absolute top-0 left-1/2 z-10 grid h-6 w-11 -translate-x-1/2 -translate-y-4 place-items-center text-foreground/55 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100",
            // Dokunmatikte 44 px: görünmez uzantı yalnız yukarı ve yanlara (kartlar arası boşluk ve
            // üstteki kartın alt iç boşluğu), aşağı inmez — alttaki yazı alanının dokunuşunu çalmaz.
            "opacity-0 group-hover/stack:opacity-100 pointer-coarse:opacity-70 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-3 pointer-coarse:after:-top-5 pointer-coarse:after:bottom-0",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-10 place-items-center rounded-full bg-background/90 shadow-sm ring-1 ring-border backdrop-blur group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-brand/50"
          >
            <span className="flex gap-[3px]">
              <span className="size-[3px] rounded-full bg-current" />
              <span className="size-[3px] rounded-full bg-current" />
              <span className="size-[3px] rounded-full bg-current" />
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      {used && (
        <DropdownMenuContent align="center" className="w-52 pointer-coarse:w-64">
          {groups.map((group, i) => (
            <Fragment key={i}>
              {i > 0 && <DropdownMenuSeparator />}
              {group}
            </Fragment>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
