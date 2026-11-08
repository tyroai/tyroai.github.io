import { useRmText } from "../data/useRmText"
import { templatePieces } from "@/features/rm/lib/templatePieces"

// Ad Anasayfa'daki gibi palet degradesiyle, ünlem marka renginde.
const NAME =
  "bg-gradient-to-r from-brand-text-from via-brand-text-via to-brand-text-to bg-clip-text text-transparent"

// Karşılama sayfa başlığından büyük: açılış ekranının selamı.
const BIG = "block text-[1.875rem] leading-[1.12] tracking-[-0.025em] sm:text-[2.375rem]"

/** Karşılama başlığı: "Günaydın, Ömer!" — ad palet renginde. */
export function GreetTitle({ greet, name }) {
  const { rt } = useRmText()
  if (!name) return <span className={BIG}>{rt("rm.greet.titleNoName", { greet })}</span>
  return (
    <span className={BIG}>
      {templatePieces(rt("rm.greet.title"), { greet, name }, { name: { tone: "name" } }).map(
        (p, i) =>
          p.tone === "name" ? (
            <span key={i} className={NAME}>
              {p.text}
            </span>
          ) : p.text === "!" ? (
            <span key={i} className="text-brand">
              !
            </span>
          ) : (
            p.text
          ),
      )}
    </span>
  )
}
