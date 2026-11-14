import { HugeiconsIcon } from "@hugeicons/react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { cn } from "@/lib/utils"
import { STORY_ICON, STORY_KIND_LABEL, storyCaption, storyRing } from "./storyData"

/**
 * Şeritteki tek hikâye: halkalı avatar, ad, altyazı. Basınca `onView(düğme)` hikâye
 * görüntüleyicisini açar (düğme, kapanınca odağın döneceği yer). `wide`: masaüstü ölçüsü.
 */
export function StoryTile({ story: s, photo, wide, onView, t, locale }) {
  const first = s.name.split(/\s+/)[0]
  const caption = storyCaption(t, s)
  return (
    // Ad içerikten: tam ad, ekip ve tür ekran okuyucuya, kısa ad göze; görünen altyazı adın sonunda
    // (sesle "Deniz" diyen bulur — görünen metin erişilebilir adın içinde).
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => onView(e.currentTarget)}
      className={cn(
        "group/story flex flex-col items-center gap-1 rounded-2xl pb-1 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        wide ? "w-20" : "w-[4.5rem]",
      )}
    >
      {/* Halka ve boşluk grid: avatar satır içi blok kalsaydı yazı satırının alt payını alır,
          iç kutu avatardan uzun olur ve halka yumurtalaşıp avatar yukarı kayardı. */}
      <span
        aria-hidden="true"
        className={cn(
          "relative grid place-items-center rounded-full p-[2.5px] transition group-active/story:scale-95 motion-reduce:transition-none",
          storyRing(s),
        )}
      >
        <span className="grid place-items-center rounded-full bg-background p-[2px]">
          <PersonAvatar
            name={s.name}
            photo={photo}
            className={cn(
              wide ? "size-14 text-[0.9375rem]" : "size-[3.25rem] text-[0.875rem]",
              "shortest:size-10 shortest:text-[0.75rem]",
            )}
          />
        </span>
        <span className="absolute -bottom-0.5 -end-0.5 grid size-5 place-items-center rounded-full bg-card text-brand-ink shadow-sm ring-2 ring-background">
          <HugeiconsIcon icon={STORY_ICON[s.kind]} className="size-3" strokeWidth={2} />
        </span>
      </span>
      <span
        aria-hidden="true"
        lang="tr"
        className={cn(
          "w-full truncate text-center font-semibold leading-tight text-foreground/90",
          wide ? "text-xs" : "text-[0.6875rem]",
        )}
      >
        {first}
      </span>
      <span className="sr-only">
        {[s.name, s.team && t("special.circle.team"), t(STORY_KIND_LABEL[s.kind])]
          .filter(Boolean)
          .join(", ")}
      </span>
      {caption && (
        <span
          lang={locale}
          className="-mt-1 w-full truncate text-center text-[0.6875rem] leading-tight text-muted-foreground shortest:hidden"
        >
          {caption}
        </span>
      )}
    </button>
  )
}
