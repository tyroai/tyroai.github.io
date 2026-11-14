import { HugeiconsIcon } from "@hugeicons/react"

/** Cümledeki tıklanabilir sözcük: boşken davet (vurgu tonunda), doluyken altı çizili değer. */
export function Token({ name, icon, lead, value, placeholder, open, onOpen }) {
  return (
    <span className="af-part">
      {lead && <span className="af-lead">{lead}</span>}
      <button
        type="button"
        className="af-token"
        data-slot={name}
        data-filled={value ? "" : undefined}
        aria-haspopup="dialog"
        aria-expanded={open === name}
        onClick={(e) => onOpen(name, e.currentTarget)}
      >
        <HugeiconsIcon icon={icon} strokeWidth={1.9} aria-hidden="true" />
        <span>{value || placeholder}</span>
      </button>
    </span>
  )
}
