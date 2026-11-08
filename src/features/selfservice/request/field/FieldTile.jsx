import { cn } from "@/lib/utils"
import { IconTile } from "./IconTile"
import "./fieldTile.css"

/**
 * Formun alan karosu: solda tonlu ikon kutusu (köşesinde durum rozeti), ortada küçük etiket ve
 * kalın değer, sağda isteğe bağlı ek (`trailing`: ok, sayaç). Karonun tamamı denetim: düğme
 * (`as="button"`, seçici ya da takvim açar) ya da etiket (`as="label"`, içinde yazı alanı —
 * `children` değerin yerine). `state` (`fieldState`): "need" hafif kırmızı çerçeve, "error" net
 * kırmızı, "done" yeşil ✓. `active`/`open`: seçilmekte olan alan, marka çerçevesi. Başka
 * bileşenin tetiği olabilir (Radix `asChild`): `ref` ve kalan özellikler köke geçer.
 */
export function FieldTile({
  as: Comp = "button",
  icon,
  tone,
  swap,
  label,
  labelId,
  value,
  valueId,
  placeholder,
  state = null,
  active = false,
  open = false,
  trailing = null,
  className,
  children,
  ...rest
}) {
  const button = Comp === "button"
  return (
    <Comp
      type={button ? "button" : undefined}
      data-field={state ?? undefined}
      data-active={active || undefined}
      data-open={open || undefined}
      className={cn(
        "req-tile relative flex min-h-[3.75rem] w-full min-w-0 items-center gap-3 rounded-[0.875rem] px-3 py-2 text-start outline-none [-webkit-tap-highlight-color:transparent] pointer-coarse:min-h-16",
        button ? "cursor-pointer" : "cursor-text",
        className,
      )}
      {...rest}
    >
      <IconTile icon={icon} tone={tone} state={state} swap={swap} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={labelId} className="truncate text-[0.75rem] leading-4 text-muted-foreground">
          {label}
        </span>
        {children ?? (
          <span
            id={valueId}
            className={cn(
              "truncate text-[0.9375rem] leading-5",
              value ? "font-semibold tracking-[-0.005em] text-foreground" : "text-muted-foreground",
            )}
          >
            {value || placeholder}
          </span>
        )}
      </span>
      {trailing}
    </Comp>
  )
}
