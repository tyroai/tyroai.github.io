import { InfoTip } from "@/components/common/InfoTip"
import { RecordHero, RecordMeter } from "@/components/record-window/RecordHero"
import { useLocale } from "@/hooks/useLocale"

/** Kilometre taşının işareti: ✓ geçildi · ◐ şimdi · ✕ durdu · ○ henüz değil (tonu CSS'ten). */
function StepMark({ state }) {
  return (
    <svg viewBox="0 0 16 16" className="rw-mark" data-state={state} aria-hidden="true">
      {state === "done" && (
        <>
          <circle cx="8" cy="8" r="8" fill="currentColor" />
          <path
            d="M4.6 8.3l2.2 2.2 4.6-4.8"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {state === "current" && (
        <>
          <circle cx="8" cy="8" r="7.15" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 3.4a4.6 4.6 0 0 1 0 9.2z" fill="currentColor" />
        </>
      )}
      {state === "stopped" && (
        <>
          <circle cx="8" cy="8" r="8" fill="currentColor" />
          <path
            d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
      {state === "upcoming" && (
        <circle cx="8" cy="8" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      )}
    </svg>
  )
}

/**
 * İlerleme kartı (ortak `RecordHero` üstüne): solda başlık ve gri açıklama, sağda kaydın büyük
 * değeri (gün · tutar · toplam); altında parçalı çubuk (`RecordMeter`) ve kilometre taşları satır
 * satır (işaret · ad · sağda tarih ya da "Şimdi"). `model` (`progressModel`) yoksa yalnız başlık ve değer.
 * `labelOf(step)`, `metaOf(step)`: türün dilinde adım adı ve sağ sütun. `value` dizi olabilir (para
 * birimleri); `stacked`: değer başlığın altında (dar sütun, masraf). Kaydın durumu başlıkta değil
 * şimdiki adımda: `liveTitle` ERP'nin kendi etiketi (üstüne gelince), `liveNote` yanında ⓘ.
 */
export function ProgressCard({
  title,
  sub,
  value,
  caption,
  model,
  labelOf,
  metaOf,
  past = false,
  stacked = false,
  liveTitle,
  liveNote = null,
}) {
  const { t } = useLocale()
  const bar = model?.bar
  return (
    <RecordHero
      className="rw-progress"
      title={title}
      sub={sub}
      value={value}
      caption={caption}
      tone={model?.tone}
      past={past}
      stacked={stacked}
      personal
    >
      {bar && <RecordMeter done={bar.done} now={bar.now} />}
      {model && (
        <ol className="rw-steps" aria-label={title}>
          {model.steps.map((s) => {
            const live = s.state === "current" || s.state === "stopped"
            const meta = metaOf(s)
            return (
              <li key={s.id} data-state={s.state} aria-current={live ? "step" : undefined}>
                <StepMark state={s.state} />
                <span className="rw-step-label">
                  <span title={live ? liveTitle : undefined}>{labelOf(s)}</span>
                  {live && liveNote && <InfoTip text={liveNote} className="-my-1 ms-1 size-6" />}
                  <span className="sr-only">
                    {" — "}
                    {t(`selfService.steps.state.${s.state}`)}
                  </span>
                </span>
                {meta && <span className="rw-step-meta">{meta}</span>}
              </li>
            )
          })}
        </ol>
      )}
    </RecordHero>
  )
}
