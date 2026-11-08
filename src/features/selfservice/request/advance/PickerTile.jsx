import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { cn } from "@/lib/utils"
import { HeadPicker } from "../expense/head/HeadPicker"
import { FieldTile } from "../field/FieldTile"
import { fieldState } from "../field/fieldState"
import { ERROR } from "../formUi"
import { TILE_H, tileAria } from "./advanceUi"

/** Karonun altındaki hata cümlesi (`aria-describedby` buna bağlı). */
export function ErrorLine({ id, text }) {
  if (!text) return null
  return (
    <p id={`${id}-error`} className={ERROR}>
      {text}
    </p>
  )
}

/**
 * Listeden seçilen avans alanı: karo tetik (`FieldTile`), liste altında (`HeadPicker`; `search`
 * aramalı, Türkçe katlamalı). `display`: karoda görünen değer (yazı ya da düğüm), `swap`: ikonu
 * değişen alanda hangi ikonun çizildiği. Altında hata cümlesi, sonra `children` (ipucu satırı).
 */
export function PickerTile({
  id,
  label,
  icon,
  tone,
  swap,
  options,
  value,
  display,
  placeholder,
  onPick,
  search = false,
  required = false,
  error,
  listClassName,
  children,
}) {
  return (
    <div className="min-w-0">
      <HeadPicker
        labelId={`${id}-label`}
        options={options}
        value={value}
        onPick={onPick}
        search={search}
        className={listClassName}
      >
        {(open) => (
          <FieldTile
            className={TILE_H}
            id={id}
            icon={icon}
            tone={tone}
            swap={swap}
            label={label}
            labelId={`${id}-label`}
            value={display}
            valueId={`${id}-value`}
            placeholder={placeholder}
            state={fieldState({ filled: value != null && value !== "", required, error })}
            open={open}
            trailing={
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                aria-hidden="true"
                strokeWidth={2}
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                  open && "rotate-180",
                )}
              />
            }
            {...tileAria(id, error)}
          />
        )}
      </HeadPicker>
      <ErrorLine id={id} text={error} />
      {children}
    </div>
  )
}
