import { ContextMenu as ContextMenuPrimitive } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"

import { cn } from "@/lib/utils"

// shadcn'in açılır menüsüyle aynı görünüş (`dropdown-menu.jsx` sınıfları): sağ tık ve dokunmatikte
// uzun basış (Radix) aynı menüyü açar.
const ITEM =
  "relative flex cursor-default items-center pr-8 outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

function ContextMenu(props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger(props) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "z-50 min-w-32 overflow-x-hidden overflow-y-auto bg-popover text-popover-foreground",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      className={cn(ITEM, "pr-2", className)}
      {...props}
    />
  )
}

function ContextMenuLabel({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function ContextMenuRadioGroup(props) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function Indicated({ Item, className, children, ...props }) {
  return (
    <Item className={cn(ITEM, className)} {...props}>
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </Item>
  )
}

function ContextMenuRadioItem(props) {
  return <Indicated Item={ContextMenuPrimitive.RadioItem} data-slot="context-menu-radio-item" {...props} />
}

function ContextMenuCheckboxItem(props) {
  return (
    <Indicated Item={ContextMenuPrimitive.CheckboxItem} data-slot="context-menu-checkbox-item" {...props} />
  )
}

function ContextMenuSeparator({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border/50", className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuCheckboxItem,
  ContextMenuSeparator,
}
