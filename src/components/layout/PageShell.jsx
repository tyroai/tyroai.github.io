import { cn } from "@/lib/utils"

/**
 * Her sayfanın kabı (`docs/design-tokens.md` › Kural 4, `docs/design-system.md` › Sayfa ritmi):
 * aynı kenar boşluğu (`gutter`), aynı üst boşluk (`page`; alçak pencerede 16), aynı en geniş değer
 * (`page`). Sayfa değiştirince başlık ve içerik kenarı yerinden oynamaz — UX kapısı ölçer.
 * `notch`: sağ kenar çentiğinin oluğu ve telefonda çentiğin altından başlama (`.myspace-gutter`);
 * çentiği kendi içinde çözen sayfa (Keşfet) kapatır. Kaydıran sayfa `as`/`className` ile kabın
 * kendisini kaydırıcı yapar; ölçüler yine buradan gelir.
 */
export function PageShell({ as: Tag = "div", notch = true, className, children, ...props }) {
  return (
    <Tag
      data-page-shell=""
      className={cn(
        // `max-w-page` YAZILMAZ: Tailwind önce `--spacing-page`i (32 px) bulur; en `container-page` (96rem).
        "mx-auto w-full max-w-[96rem] px-gutter pt-page pb-section shortest:pt-4",
        notch && "myspace-gutter",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
