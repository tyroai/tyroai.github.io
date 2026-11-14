import { useNavigate, useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDataTransferHorizontalIcon from "@hugeicons/core-free-icons/ArrowDataTransferHorizontalIcon"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useRmAccess } from "../data/useRmAccess"
import { useRmText } from "../data/useRmText"
import { lastView, returnPath, RM_GROUPS, RM_VIEWS, rmHref, viewOf } from "../shell/views"

const GROUP_LABEL = "text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground"

function Row({ icon, label, active, onClick }) {
  return (
    <SidebarMenuItem className="relative">
      {active && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-1/2 z-10 h-5 w-[0.1875rem] -translate-y-1/2 rounded-r-full bg-brand shadow-[1px_0_6px_-1px_color-mix(in_oklch,var(--brand-text),transparent_45%)]"
        />
      )}
      <SidebarMenuButton
        isActive={active}
        tooltip={label}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(active && "text-brand [&_svg]:text-brand font-semibold")}
      >
        <HugeiconsIcon icon={icon} />
        <span className="flex-1 group-data-[collapsible=icon]:hidden">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * Bölümdeyken sol menü: en üstte "tyroAI'ye geç" hapı, altında tyroRM'in sayfaları (gruplu).
 */
export default function RmSidebarNav() {
  const { rt } = useRmText()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isMobile, setOpenMobile } = useSidebar()
  const { state, edit } = useRmAccess()
  const granted = state === "granted"
  const current =
    viewOf(params.get("view"), edit)?.key ??
    (edit ? viewOf(lastView(), edit)?.key : null) ??
    "genel"
  const views = RM_VIEWS.filter((v) => granted && (!v.editorOnly || edit))
  const open = (key) => {
    navigate(rmHref(key))
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* tyroAI'ye geçiş: TYRO'daki "Yeni sohbet" hapıyla aynı yer ve dil (kanal değiştirir gibi);
                  renk tyroRM'in paleti. */}
              <SidebarMenuButton
                type="button"
                tooltip={rt("rm.nav.switch")}
                onClick={() => navigate(returnPath())}
                className="cursor-pointer bg-gradient-to-r from-brand-from via-brand-via to-brand-to text-brand-on-ramp shadow-sm duration-200 ease-linear hover:brightness-110 hover:text-brand-on-ramp active:text-brand-on-ramp"
              >
                <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} />
                <span className="flex-1 group-data-[collapsible=icon]:hidden">
                  {rt("rm.nav.switch")}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {/* Hap kendi grubunda (TYRO'daki gibi): gruplar ondan ayrı başlar. */}
      {RM_GROUPS.map((g) => {
        const items = views.filter((v) => v.group === g.key)
        if (!items.length) return null
        return (
          <SidebarGroup key={g.key}>
            {g.label && (
              <SidebarGroupLabel className={GROUP_LABEL}>{rt(g.label)}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((v) => (
                  <Row
                    key={v.key}
                    icon={v.icon}
                    label={rt(v.label)}
                    active={current === v.key}
                    onClick={() => open(v.key)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </>
  )
}
