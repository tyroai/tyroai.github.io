import { HugeiconsIcon } from "@hugeicons/react"
import DragDropVerticalIcon from "@hugeicons/core-free-icons/DragDropVerticalIcon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { IconOrLogo } from "@/components/common/IconOrLogo"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { hostOf, isShown, KIND } from "./catalogLogic"
import { RowMenu } from "./RowMenu"

// Çözümler kartlarıyla aynı üç muamele: aynı kayıt iki yerde aynı görünür (logo/ikon = içerik).
const TONE = {
  agent: "bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp",
  aiApp: "bg-brand-soft text-brand-on-soft",
  businessApp: "bg-brand-fill-deep text-white",
}

/** Kaydın logo/ikon kutusu — satırda ve formun önizlemesinde aynı. */
export function LogoBox({ item, kind, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-[0.625rem]",
        TONE[KIND[kind].tone],
        className,
      )}
    >
      <IconOrLogo iconName={item.iconName} logo={item.logo} className="size-[1.125rem]" />
    </span>
  )
}

const STEP =
  "grid size-11 place-items-center rounded-full text-foreground/70 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Kartsız liste satırı: sıra numarası (farede üstüne gelince sürükleme tutamağı), logo, ad + tek
 * satır soluk ayrıntı, kapalıysa çip, ⋯ menüsü. Satıra tıklamak / Enter düzenler; Alt+↑/↓ taşır.
 * Telefonun "Sırala" kipinde menü yerine 44 px ↑/↓ düğmeleri.
 */
export function CatalogRow({
  item,
  kind,
  position,
  count,
  sortMode,
  drag,
  dragging,
  dropTarget,
  flash = false,
  compact = false,
  onOpen,
  onMove,
  onToggle,
  onCopy,
  onDelete,
  menu,
}) {
  const { t } = useLocale()
  const shown = isShown(item)
  const detail = item.description || (kind === "agents" ? "" : hostOf(item.url))
  const isFirst = position === 1
  const isLast = position === count
  const Main = sortMode ? "span" : "button"
  const onKeyDown = (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    if (e.shiftKey || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    if (e.altKey) {
      onMove(e.key === "ArrowUp" ? -1 : 1)
      return
    }
    // Oklar satırdan satıra (Linear/Gmail): Tab her satırda iki durak, uzun listede yorar.
    const li = e.currentTarget.closest("li")
    const next = e.key === "ArrowUp" ? li?.previousElementSibling : li?.nextElementSibling
    next?.querySelector("[data-main]")?.focus()
  }
  return (
    <li
      data-row={item.id}
      {...drag}
      className={cn(
        "group relative flex min-h-14 items-center gap-2 py-1.5 pe-1 ps-1 transition-colors duration-700 pointer-coarse:min-h-16",
        !sortMode && "hover:bg-foreground/[0.025]",
        // Yeni eklenen satır bir an belirir (Shopify): listenin sonuna düştüğü görünsün.
        flash && "bg-foreground/[0.05] hover:bg-foreground/[0.05]",
        dragging && "opacity-40",
        // Bırakma yeri: satırın üstünde marka çizgisi.
        dropTarget && "shadow-[inset_0_2px_0_var(--brand)]",
      )}
    >
      {/* Telefonda sıra numarası yalnız Sırala kipinde: dar satırda yer açıklamanın (ekran
          okuyucu sırayı yine duyar). */}
      <span
        aria-hidden="true"
        className={cn(
          "grid w-7 shrink-0 place-items-center text-xs tabular-nums text-muted-foreground",
          compact && !sortMode && "hidden",
        )}
      >
        <span className={cn(drag?.draggable && "group-hover:hidden")}>{position}</span>
        {drag?.draggable && (
          <HugeiconsIcon
            icon={DragDropVerticalIcon}
            className="hidden size-4 cursor-grab text-foreground/60 group-hover:block active:cursor-grabbing"
            strokeWidth={1.8}
          />
        )}
      </span>
      {/* Sırala kipinde satır bir şey açmaz: düğme değil, düz içerik. */}
      <Main
        {...(sortMode
          ? {}
          : {
              type: "button",
              "data-main": "",
              onClick: onOpen,
              onKeyDown,
              "aria-keyshortcuts": "ArrowUp ArrowDown Alt+ArrowUp Alt+ArrowDown",
            })}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <LogoBox item={item} kind={kind} className={cn(!shown && "opacity-45 grayscale")} />
        <span className="min-w-0 flex-1">
          <span
            data-name=""
            className={cn(
              "block truncate text-[0.875rem] font-medium leading-5",
              !shown && "text-foreground/70",
            )}
          >
            {item.name}
          </span>
          {detail && (
            <span className="block truncate text-[0.75rem] leading-4 text-muted-foreground">
              {detail}
            </span>
          )}
          <span className="sr-only">
            {`, ${t("settings.catalog.row.position").replace("{n}", position)}`}
          </span>
        </span>
      </Main>
      {!shown && (
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-foreground/[0.06] px-2 text-xs font-medium text-foreground/70">
          {t("settings.catalog.status.off")}
        </span>
      )}
      {sortMode ? (
        <span className="flex shrink-0 items-center">
          <button
            type="button"
            data-step="-1"
            onClick={() => (isFirst ? null : onMove(-1))}
            aria-disabled={isFirst}
            aria-label={t("settings.order.moveUp").replace("{name}", item.name)}
            className={cn(STEP, isFirst && "opacity-30")}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            data-step="1"
            onClick={() => (isLast ? null : onMove(1))}
            aria-disabled={isLast}
            aria-label={t("settings.order.moveDown").replace("{name}", item.name)}
            className={cn(STEP, isLast && "opacity-30")}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-5" strokeWidth={2} />
          </button>
        </span>
      ) : (
        <RowMenu
          item={item}
          kind={kind}
          isFirst={isFirst}
          isLast={isLast}
          onEdit={onOpen}
          onMove={onMove}
          onToggle={onToggle}
          onCopy={onCopy}
          onDelete={onDelete}
          {...menu}
        />
      )}
    </li>
  )
}
