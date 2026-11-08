import { initialsOf } from "@/lib/personInitials"
import { personTone } from "@/lib/personTone"
import { cn } from "@/lib/utils"

/**
 * Oturumdaki kişinin avatarı: Graph profil fotoğrafı (`useMe().photoUrl`), yoksa Keşfet'teki
 * kişilerin dili — addan türeyen sabit renkte daire ve baş harfler (`personTone`, `initialsOf`).
 * Paletin küresi değil (ürün sahibinin kararı): kişi her yerde aynı baş harflerle tanınır.
 * `children` baş harflerin yerine geçer (ör. profilin büyük avatarı kendi yazı boyuyla); rengi
 * daireden alır. Kap boyutu belirler (`aspect-square w-full`).
 */
export function UserAvatar({ photoUrl, label, className, children }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label || ""}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-full object-cover",
          className,
        )}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={label || undefined}
      style={personTone(label)}
      className={cn(
        "relative grid aspect-square w-full place-items-center overflow-hidden rounded-full text-[0.75rem] font-semibold",
        className,
      )}
    >
      {children ?? <span aria-hidden="true">{initialsOf(label)}</span>}
    </span>
  )
}
