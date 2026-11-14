import { HugeiconsIcon } from "@hugeicons/react"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { Emph } from "./Emph"
import { useStory } from "./useStory"

const ORB_PX = 36

/** Kürenin kutusu: gerçek küre (kişinin seçtiği görünüm), etkisiz; yanındaki cümleye bakar. */
export function StoryOrb() {
  return (
    <span aria-hidden="true" inert className="ssc-orb">
      <BrandOrb surface="dashboard" state="idle" mascotState="idle" size={ORB_PX} reading />
    </span>
  )
}

/** Özet kartının kabuğu: küre + kaş + cümle + eylemler (Bilgilerim ve Ekibim aynı kabuk). */
export function StoryShell({ eyebrow, loading, children, actions }) {
  return (
    <section aria-label={eyebrow} className="ssc-card ssc-story">
      <div className="ssc-story-head">
        <StoryOrb />
        <p className="ssc-eyebrow">{eyebrow}</p>
      </div>
      {loading ? (
        <div aria-hidden="true" className="ssc-story-skel">
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
        </div>
      ) : (
        <p data-private="" className="ssc-story-text">
          {children}
        </p>
      )}
      {!loading && actions && <div className="ssc-actions">{actions}</div>}
    </section>
  )
}

/** Cümleler tek paragraf: aralarında boşluk, vurgular kalın. */
export function StoryText({ lines }) {
  return lines.map((line, i) => (
    <span key={line.id}>
      {i > 0 && " "}
      <Emph text={line.text} />
    </span>
  ))
}

export function StoryAction({ action, onDone }) {
  return (
    <button
      type="button"
      className={action.main ? "ssc-btn ssc-btn--main" : "ssc-btn"}
      onClick={() => {
        onDone?.()
        action.run()
      }}
    >
      {action.icon && <HugeiconsIcon icon={action.icon} aria-hidden="true" strokeWidth={1.9} />}
      {action.label}
    </button>
  )
}

/** Geniş ekranın özet kartı (kimlik kartının yanında). */
export function StoryCard({ loading, ...input }) {
  const story = useStory(input)
  return (
    <StoryShell
      eyebrow={story.eyebrow}
      loading={loading}
      actions={story.actions.map((a) => (
        <StoryAction key={a.id} action={a} />
      ))}
    >
      <StoryText lines={story.lines} />
    </StoryShell>
  )
}
