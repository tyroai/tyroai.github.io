import { useId } from "react"
import { OrbGlyph } from "@/components/brand/TyroOrbGlyph"
import { useLocale } from "@/hooks/useLocale"
import { LOGO_ORBS, setLogoOrb, useLogoOrb } from "@/lib/logoOrb"
import { cn } from "@/lib/utils"
import { Group } from "./rows"

// Dört dilin sözlüğüne anahtar eklemek yerine burada: bu seçici yalnız demoda var.
const TEXT = {
  tr: { title: "Logodaki küre", hint: "Logonun “o” harfindeki küre. Uygulama paletinden bağımsızdır.", renk: "Renkli", obsidyen: "Obsidyen" },
  en: { title: "Logo orb", hint: "The orb in the logo’s “o”. Independent of the app palette.", renk: "Colour", obsidyen: "Obsidian" },
  ar: { title: "كرة الشعار", hint: "الكرة مكان حرف “o” في الشعار. مستقلة عن ألوان التطبيق.", renk: "ملوّنة", obsidyen: "أوبسيديان" },
  ru: { title: "Сфера логотипа", hint: "Сфера на месте буквы «o». Не зависит от палитры приложения.", renk: "Цветная", obsidyen: "Обсидиан" },
}

/** Logodaki kürenin görünümü: renkli ya da obsidyen. Seçim anında bütün logolara yansır. */
export function LogoOrbPicker() {
  const { locale } = useLocale()
  const value = useLogoOrb()
  const uid = useId().replace(/:/g, "")
  const text = TEXT[locale] ?? TEXT.tr
  return (
    <Group label={text.title} footer={text.hint}>
      <div role="radiogroup" aria-label={text.title} className="flex flex-wrap gap-3 px-4 py-4">
        {LOGO_ORBS.map((id) => {
          const checked = value === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setLogoOrb(id)}
              className={cn(
                "flex min-w-36 flex-1 items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-start text-sm outline-none transition",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
                checked ? "border-brand ring-2 ring-brand/25" : "border-border hover:bg-muted/60",
              )}
            >
              <svg viewBox="0 0 256 256" aria-hidden="true" className="size-9 shrink-0">
                <OrbGlyph cx={128} cy={128} r={122} id={`${uid}-${id}`} variant={id} />
              </svg>
              <span className="font-medium">{text[id]}</span>
            </button>
          )
        })}
      </div>
    </Group>
  )
}
