import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { cn } from "@/lib/utils"
import { FieldTile } from "../../field/FieldTile"
import { HeadPicker } from "./HeadPicker"
import { PILL } from "./headUi"

/**
 * Seçici karo (kimin adına · şirket): solda ikon kutusu (değeri hep dolu: ✓), etiket ve kalın
 * değer; karonun tamamı düğme, basınca altında liste açılır (`HeadPicker`). `pill`: etiketin
 * yanında marka tonlu etiket ("Başkası adına"); `sub`: değerin yanında soluk ek (şirketin
 * unvanı); `swap`: ikon değişince (kendim → başkası) kısa geçiş. Erişilebilir ad etiket + değer;
 * kimlikler `${id}-label` · `${id}-value` (liste adını etiketten alır).
 */
export function SelectCell({ id, icon, swap, label, value, sub, pill, picker, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <HeadPicker labelId={`${id}-label`} {...picker}>
        {(open) => (
          <FieldTile
            id={id}
            icon={icon}
            swap={swap}
            label={
              <>
                <span id={`${id}-label`}>{label}</span>
                {pill && (
                  <span id={`${id}-pill`} className={cn(PILL, "ms-1.5 align-[0.0625rem]")}>
                    {pill}
                  </span>
                )}
              </>
            }
            value={
              <>
                {value}
                {sub && <span className="font-normal text-muted-foreground"> · {sub}</span>}
              </>
            }
            valueId={`${id}-value`}
            state="done"
            open={open}
            aria-labelledby={`${id}-label ${id}-value`}
            aria-describedby={pill ? `${id}-pill` : undefined}
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
          />
        )}
      </HeadPicker>
    </div>
  )
}

/**
 * Masraf açıklaması karosu: karonun tamamı etiket, içinde yazı alanı (en çok `max` harf); nereye
 * basılsa alan odaklanır. Boşsa varsayılan ("Ekim 26 | TYRO Self Servis | <ad>") gönderilir: karo hep dolu
 * (✓). Ne işe yaradığı (`hint`) ⓘ balonunda — düğme etiketin içinde duramaz, karonun sağ ucuna
 * kardeş olarak oturur (yeri `trailing`de boş tutulur). Sınıra yaklaşınca harf sayısı (`count`).
 */
export function TitleCell({
  id,
  icon,
  label,
  hint,
  count,
  full,
  value,
  placeholder,
  max,
  onChange,
  className,
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <FieldTile
        as="label"
        htmlFor={id}
        icon={icon}
        label={label}
        labelId={`${id}-label`}
        state="done"
        trailing={
          <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
            {count && (
              <span
                className={cn(
                  "text-[0.75rem] tabular-nums",
                  full ? "font-medium text-warning-ink" : "text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
            <span className="size-6" />
          </span>
        }
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // Başlığı yazıp Enter'a basmak formu göndermesin (kalemler daha boş olabilir).
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && e.preventDefault()}
          placeholder={placeholder}
          maxLength={max}
          autoComplete="off"
          spellCheck
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          className="no-ios-zoom h-5 w-full min-w-0 bg-transparent p-0 text-[0.9375rem] font-semibold leading-5 tracking-[-0.005em] outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
      </FieldTile>
      <span id={`${id}-hint`} className="sr-only">
        {hint}
      </span>
      <InfoTip
        text={hint}
        className="absolute end-3 top-1/2 size-6 -translate-y-1/2 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
      />
    </div>
  )
}
