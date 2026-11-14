import { memo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ShieldKeyIcon from "@hugeicons/core-free-icons/ShieldKeyIcon"
import { IconOrLogo } from "@/components/common/IconOrLogo"
import { IdentityCell } from "@/features/security/primitives"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocale } from "@/hooks/useLocale"
import { catalogNameKey } from "@/lib/agentName"
import { APP_LOCK } from "@/lib/appLockPolicy"
import { initialsOf } from "@/features/security/lib/authzPeople"
import { personTone } from "@/lib/personTone"
import { cn } from "@/lib/utils"

const SHOWN = 3
const CHIP = "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium"

/**
 * Kişi avatarı — Office fotoğrafı varsa o; yoksa adresten türetilen baş harfler, toplantı kartındaki
 * kişilerle aynı sabit renkte (`personTone`: aynı kişi her yerde aynı ton; ad uydurulmaz).
 */
export function Initials({ upn, photo, className }) {
  const local = String(upn ?? "").split("@")[0]
  return (
    <span
      aria-hidden="true"
      style={photo ? undefined : personTone(local)}
      className={cn(
        "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full text-[0.6875rem] font-semibold",
        className,
      )}
    >
      {photo ? (
        <img src={photo} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        initialsOf(upn)
      )}
    </span>
  )
}

/** Uygulama çipleri: ilk üçü + "+n"; katalogda olmayan ad uyarı tonunda ve ⚠. */
function AppChips({ apps, known, logos, shown = SHOWN }) {
  const { t } = useLocale()
  const own = apps.filter((a) => !known.isBusiness?.(a))
  // Katalog dışı ad öne: ⚠ "+n"in içinde kaybolmasın (Sorunlu filtresinde sebep görünür).
  const list = [...own.filter((a) => !known.has(a)), ...own.filter((a) => known.has(a))]
  if (!list.length)
    return <span className="text-xs text-foreground/65">{t("authz.apps.none")}</span>
  const rest = list.length - shown
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {list.slice(0, shown).map((a) => {
        const stale = !known.has(a)
        return (
          <span
            key={a}
            lang="tr"
            title={stale ? t("authz.apps.unknown") : undefined}
            className={cn(
              CHIP,
              "max-w-[10rem] truncate font-normal",
              stale ? "bg-warning/12 text-warning-ink" : "bg-foreground/[0.06] text-foreground/80",
            )}
          >
            {stale ? (
              <HugeiconsIcon icon={Alert02Icon} className="me-1 size-3 shrink-0" strokeWidth={2} />
            ) : (
              <ChipLogo item={logos?.get(catalogNameKey(a))} />
            )}
            <span className="truncate">{a}</span>
          </span>
        )
      })}
      {rest > 0 && (
        <span className={cn(CHIP, "bg-foreground/[0.04] text-foreground/70")}>
          {t("authz.ws.more", { n: rest })}
        </span>
      )}
    </span>
  )
}

/** Çipin içinde Anasayfa'daki gerçek logo (yoksa katalog ikonu); hiçbiri yoksa çizilmez. */
function ChipLogo({ item }) {
  if (!item?.logo && !item?.iconName) return null
  return (
    <span className="me-1.5 -ms-1 grid size-4 shrink-0 place-items-center overflow-hidden rounded-[0.3rem] text-muted-foreground">
      <IconOrLogo iconName={item.iconName} logo={item.logo} className="size-3" alt="" />
    </span>
  )
}

/**
 * Kişi satırı — onay kutusu (seçim) + satırın geri kalanı tek düğme (ayrıntıyı açar). Seçili ve
 * açık satır yalnız zeminle ayrılır (uygulamanın tek "seçili" dili). `selecting` kapalıyken
 * telefonda kutu gizlenir ("Seç" ile açılır). Hızlı liste için `memo`.
 */
export const PersonRow = memo(function PersonRow({
  row,
  known,
  self,
  checked,
  open,
  showCheck,
  wide,
  photo,
  logos,
  onToggle,
  onOpen,
}) {
  const { t } = useLocale()
  const all = row.isAdmin && APP_LOCK.adminBypass
  return (
    <li
      className={cn(
        "flex items-stretch transition-colors",
        open ? "bg-foreground/[0.06]" : checked ? "bg-brand/[0.05]" : "hover:bg-foreground/[0.03]",
      )}
    >
      {showCheck && (
        <label
          className="grid w-11 shrink-0 cursor-pointer place-items-center ps-1"
          onClick={(e) => {
            // Shift aralığı tıklamada okunur (kutunun kendi olayı Shift'i taşımaz).
            e.preventDefault()
            onToggle(row.id, { shift: e.shiftKey })
          }}
        >
          <Checkbox checked={checked} aria-label={t("security.people.select", { upn: row.upn })} />
        </label>
      )}
      <button
        type="button"
        data-person-row={row.id}
        onClick={() => onOpen(row.id)}
        aria-current={open ? "true" : undefined}
        className={cn(
          // Masaüstünde 48 px (850 satır taranır), dokunmatikte ≥ 56 px.
          "flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 pe-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:min-h-14",
          !showCheck && "ps-4",
        )}
      >
        <Initials upn={row.upn} photo={photo} />
        <span
          className={cn("flex min-w-0 flex-1 gap-x-4 gap-y-1", wide ? "items-center" : "flex-col")}
        >
          <span className={cn("flex min-w-0 items-center gap-2", wide && "w-[18rem] shrink-0")}>
            <IdentityCell upn={row.upn} inline />
            {self && (
              <span className="shrink-0 rounded-full bg-foreground/[0.07] px-1.5 text-[0.6875rem] font-semibold leading-5 text-foreground/70">
                {t("authz.badge.self")}
              </span>
            )}
          </span>
          {all ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground/65">
              <HugeiconsIcon
                icon={ShieldKeyIcon}
                className="size-3.5 shrink-0 text-brand-ink"
                strokeWidth={2}
              />
              {t("authz.apps.allAdmin")}
            </span>
          ) : (
            <AppChips apps={row.apps} known={known} logos={logos} shown={wide ? SHOWN : 2} />
          )}
        </span>
      </button>
    </li>
  )
})
