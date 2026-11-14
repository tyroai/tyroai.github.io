import { IconOrLogo } from "@/components/common/IconOrLogo"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: "size-6 rounded-md text-[0.6875rem]",
  md: "size-9 rounded-[0.625rem] text-xs",
  lg: "size-12 rounded-xl text-sm",
}

/**
 * Uygulama logosu: katalogdaki logo ya da ikon; ikisi de yoksa adın baş harfi (katalog dışı
 * adda da). Süs değil tanıma işareti — ad hemen yanında yazılı, o yüzden `alt` boş.
 */
export function AppLogo({ app, name, size = "md", className }) {
  const label = app?.name || name || ""
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-muted font-semibold text-muted-foreground dark:bg-white/[0.06]",
        SIZES[size],
        className,
      )}
    >
      {app?.logo || app?.iconName ? (
        <IconOrLogo
          iconName={app.iconName}
          logo={app.logo}
          className={size === "sm" ? "size-3.5" : "size-[1.125rem]"}
        />
      ) : (
        label.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
  )
}
