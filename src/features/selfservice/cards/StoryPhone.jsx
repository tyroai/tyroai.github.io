import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Emph } from "./Emph"
import { StoryAction, StoryOrb, StoryText } from "./StoryCard"
import { useStory } from "./useStory"
import "./storyPhone.css"

/**
 * Telefonda TYRO özeti yer kaplamaz: tek satırda en önemli cümle (küre + cümle + ok); dokununca
 * alttan çekmecede özetin tamamı ve eylemler. Eylem seçilince çekmece kapanır, sonra eylem çalışır
 * (liste filtrelenir, form ya da sohbet açılır).
 */
export function StoryPhone({ loading, ...input }) {
  const story = useStory(input)
  const [open, setOpen] = useState(false)
  if (loading) return <span aria-hidden="true" className="ms-skeleton ssc-phone-bar" />
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="ssc-phone-bar w-full"
      >
        <StoryOrb />
        <span data-private="" className="ssc-phone-text">
          <Emph text={story.lines[0].text} />
        </span>
        <span className="sr-only">{story.eyebrow}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="ssc-phone-go rtl:rotate-180"
          strokeWidth={2}
        />
      </button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={story.eyebrow}
        scrollLabel={story.eyebrow}
        onEscapeKeyDown={(e) => e.stopPropagation()}
        closeOnBack
      >
        <p data-private="" className="ssc-story-text">
          <StoryText lines={story.lines} />
        </p>
        <div className="ssc-sheet-actions">
          {story.actions.map((a) => (
            <StoryAction key={a.id} action={a} onDone={() => setOpen(false)} />
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
