import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function HoverCard({ openDelay = 250, closeDelay = 80, ...props }) {
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger({ ...props }) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

function HoverCardContent({ className, style, align = "start", sideOffset = 8, ...props }) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        // Tetikleyiciden büyür, aynı yoldan kapanır; hareket ve yüzey `styles/floating.css`te.
        style={{ transformOrigin: "var(--radix-hover-card-content-transform-origin)", ...style }}
        className={cn(
          "z-50 w-72 bg-popover p-3 text-popover-foreground outline-none",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
