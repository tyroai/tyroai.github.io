import { HugeiconsIcon } from "@hugeicons/react"
import Call02Icon from "@hugeicons/core-free-icons/Call02Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * LinkedIn'in KENDİ işareti (mavi kare, beyaz "in"; marka rengi #0A66C2).
 * ⚠️ Hugeicons'ın çizgi LinkedIn'i markanın logosu değil; marka işaretleri
 * (TyroLogo gibi) ikon kuralının dışında, kendi SVG'siyle.
 */
function LinkedInMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
      />
    </svg>
  )
}

/**
 * İletişim satırı — ÇERÇEVESİZ ikon düğmeleri (LinkedIn · e-posta · telefon).
 * Üstüne gelince yumuşak bir daire (yerinden OYNAMAZ: hedef sabit kalmalı); değer `title`da ve
 * ekran okuyucuda. Yalnız dolu alanlar çizilir.
 */
export function TeamContacts({ member, isDark }) {
  const { t } = useLocale()
  const { linkedin, email, phone } = member.contacts ?? {}
  if (!linkedin && !email && !phone) return null
  const item = cn(
    "grid size-10 place-items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
    isDark
      ? "text-white/70 hover:bg-white/[0.08] hover:text-white"
      : "text-[#1a1a1a]/65 hover:bg-black/[0.05] hover:text-[#1a1a1a]",
  )
  return (
    // Dış kap: içerik uzunken de çizgiyle arasında en az 1.25rem kalsın (`mt-auto`
    // kartın dibine iter, uzun içerikte payı sıfıra iner).
    <div data-tilt-off className="mt-auto pt-5">
      <div
        className={cn(
          "flex items-center gap-1 border-t pt-4",
          isDark ? "border-white/10" : "border-black/[0.06]",
        )}
      >
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("team.linkedinAria", { name: member.name })}
            title={t("team.linkedin")}
            className={item}
          >
            <LinkedInMark className="size-[1.375rem]" />
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            aria-label={t("team.emailAria", { name: member.name, value: email })}
            title={email}
            className={item}
          >
            <HugeiconsIcon icon={Mail01Icon} className="size-[1.375rem]" strokeWidth={1.6} />
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            aria-label={t("team.phoneAria", { name: member.name, value: phone })}
            title={phone}
            className={item}
          >
            <HugeiconsIcon icon={Call02Icon} className="size-[1.375rem]" strokeWidth={1.6} />
          </a>
        )}
      </div>
    </div>
  )
}
