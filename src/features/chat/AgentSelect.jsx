import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon"
import SquareLock01Icon from "@hugeicons/core-free-icons/SquareLock01Icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconOrLogo } from "@/components/common/IconOrLogo"
import { useLocale } from "@/hooks/useLocale"
import { useConfig } from "@/hooks/useConfig"
import { useAppLock } from "@/hooks/useAuthorizations"
import { AGENT_BRAND, agentDisplayName } from "@/lib/agentName"

// Kapalı pil asistanın TAM adını yazar ("tyroOffice"); açık menüde marka grubun
// başlığına çıkar ve satırlar onsuz okunur ("Office").
const BRAND_EYEBROW = "font-semibold tracking-[0.14em] text-muted-foreground"

export function AgentSelect({ value, onChange }) {
  const { t } = useLocale()
  const { agents, getAgent } = useConfig()
  // Asistan kilidi BURADA gerçek: asistanların dış adresi yok, tek kapı bu
  // ekran. Kartta kilitleyip burada bırakmak kilidi tek tıkla açardı.
  const lock = useAppLock()
  const current = getAgent(value)
  const shown = current ?? agents?.[0]

  return (
    <DropdownMenu>
      {/* Nested Tooltip + DropdownMenu — both wrap the same Button via
          asChild. Radix's focus management hides the tooltip the moment
          the menu opens, so they don't double-render. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-tour="chat-agent"
              // ChatGPT'nin model seçicisi gibi (mikrofonun solunda): çerçevesiz, yalnız ad ve ok;
              // asistanın simgesi menüde. Uzun ad kısalır, tam adı menüde ve ipucunda.
              className="h-9 min-w-0 gap-1 rounded-full px-2.5 text-[0.8125rem] font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground @max-3xl/chat:h-8"
            >
              {/* Seçili asistan hep görünür (ürün sahibi: "sadece ok olmasın"): simgesi ve adı; seçim
                  henüz çözülmediyse ilk asistan, o da yoksa marka. */}
              {shown?.iconName || shown?.logo ? (
                <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-sm text-brand-deep">
                  <IconOrLogo iconName={shown.iconName} logo={shown.logo} className="size-4" />
                </span>
              ) : null}
              <span className="max-w-[11.25rem] truncate text-foreground max-sm:max-w-[7.5rem]">
                {shown?.name ?? AGENT_BRAND}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {t("chat.tooltip.agent")}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[min(280px,calc(100vw-2rem))] sm:w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className={`pb-1 text-[0.65625rem] ${BRAND_EYEBROW}`}>
            {AGENT_BRAND}
          </DropdownMenuLabel>
          {agents.map((agent) => {
            const locked = lock.isLocked(agent.name)
            return (
              <DropdownMenuItem
                key={agent.id}
                disabled={locked}
                onClick={locked ? undefined : () => onChange?.(agent.id)}
                className="flex items-center gap-2"
              >
                <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-sm text-brand-deep">
                  <IconOrLogo iconName={agent.iconName} logo={agent.logo} className="size-4" />
                </span>
                <span className="flex-1">{agentDisplayName(agent.name)}</span>
                {locked ? (
                  <HugeiconsIcon
                    icon={SquareLock01Icon}
                    className="size-3.5 text-muted-foreground"
                  />
                ) : value === agent.id ? (
                  <HugeiconsIcon icon={Tick01Icon} className="size-3.5 text-brand-via" />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
