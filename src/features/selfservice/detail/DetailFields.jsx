import { COMPANIES } from "@/data/hrValues"
import { displayCompanyName } from "@/lib/companyName"

/** Şirket kodu + tam adı (`hrValues` COMPANIES); bilinmeyen kod yalnız kod. */
export function CompanyValue({ code }) {
  const name = COMPANIES[String(code ?? "").toUpperCase()]
  return (
    <>
      <span className="font-medium tabular-nums">{code}</span>
      {/* Kısa ad (ünvan uzantısız); resmi tam ad üzerine gelince. */}
      {name && (
        <span
          lang="tr"
          title={name}
          className="block text-[0.6875rem] leading-snug text-muted-foreground"
        >
          {displayCompanyName(name)}
        </span>
      )}
    </>
  )
}
