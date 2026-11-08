import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/**
 * Kendi boyunu içeriğe göre ayarlayan metin alanı (başlık ve not). Odak çıkınca kaydeder
 * (`onCommit`), her tuşta değil: her harf bir PATCH olurdu, To Do saniyede birden çok yazmaya 429
 * diyor. `singleLine`: Enter satır açmaz, alanı bırakır (başlık).
 */
export function AutoText({
  value,
  onChange,
  onCommit,
  className,
  placeholder,
  label,
  singleLine = false,
  disabled,
  onFocus,
}) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      disabled={disabled}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
      onFocus={onFocus}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (singleLine && e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={cn(
        "block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground/60",
        className,
      )}
    />
  )
}
