import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cap } from "../shared/flowText"
import { Segment } from "../shared/Segment"

const people = (v) => Math.max(1, Number.parseInt(String(v ?? "1"), 10) || 1)

/**
 * Masrafın isteğe bağlı alanları (şablondaki "+ isteğe bağlı"): açıklama, fiş no, firma adı,
 * lokasyon, kişi sayısı, yansıtma şirketi. Dokunulmayan alan cümleye girmez; asistanın varsayılanı
 * gider (lokasyon kategoriye göre, kişi 1, şirket kişinin kendi şirketi) — karttaki soluk değerler.
 */
export function ExtrasCard({ values, defaults, set, choices, companyText, onCompany }) {
  const { t, locale } = useLocale()
  const label = (name) => cap(t(`myspace.slot.${name}`), locale)
  const n = people(values.people)
  return (
    <div className="af-extras">
      {["note", "firm", "receipt"].map((name, i) => (
        <label key={name} className="af-field">
          <span>{label(name)}</span>
          <input
            data-autofocus={i === 0 ? "" : undefined}
            value={values[name] ?? ""}
            onChange={(e) => set(name, e.target.value)}
            autoComplete="off"
            maxLength={name === "note" ? 200 : 80}
          />
        </label>
      ))}
      <div className="af-field">
        <span>{label("location")}</span>
        <Segment
          label={label("location")}
          value={values.location ?? defaults.location}
          onChange={(v) => set("location", v)}
          options={choices("location")}
        />
      </div>
      <div className="af-field">
        <span>{label("people")}</span>
        <span className="af-stepper">
          <button
            type="button"
            className="af-round af-round--sm"
            onClick={() => set("people", String(n - 1))}
            disabled={n <= 1}
            aria-label={t("advanceFlow.minus", { n: 1 })}
          >
            <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <b aria-live="polite">{n}</b>
          <button
            type="button"
            className="af-round af-round--sm af-round--solid"
            onClick={() => set("people", String(n + 1))}
            aria-label={t("advanceFlow.plus", { n: 1 })}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </span>
      </div>
      <button type="button" className="af-field af-field--link" onClick={onCompany}>
        <span>{label("company")}</span>
        <b>{companyText}</b>
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}
