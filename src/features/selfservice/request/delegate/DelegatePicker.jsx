import { useId, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePeopleSearch, useRecentPeople } from "@/hooks/useRecentPeople"
import { fold } from "@/lib/fold"
import { cn } from "@/lib/utils"
import { FieldTile } from "../field/FieldTile"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX = 5

/** Baş harfler: ad soyad → iki harf, adres → ilk harf. */
const initials = (name) =>
  String(name || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr"))
    .join("")

function Avatar({ photo, name, className }) {
  if (photo)
    return (
      <img
        src={photo}
        alt=""
        aria-hidden="true"
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-black/5", className)}
      />
    )
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-violet-500/[0.14] font-semibold text-violet-700 dark:bg-violet-400/[0.18] dark:text-violet-300",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/**
 * Temsilcinin karosu: talep formunun alan karosu (`FieldTile`), içinde ad ya da e-posta yazılır,
 * altında öneriler (yazıştığın kişiler + şirket dizini, `UpnField` ile aynı iki kaynak). Seçilince
 * karo kişiyi gösterir (fotoğraf · ad · giriş adresi) ve sağında kaldırma düğmesi. Listede olmayan
 * biri için tam e-posta adresi yazmak yeter (Enter ya da alandan çıkış). Değer `{ name, address }`;
 * adres GİRİŞ adresidir (dizinde `upn` varsa o: ERP kullanıcısı onun @'ten önceki kısmı).
 * Liste akışta, karonun altında: pencerenin gövdesi kayar, yüzen liste kırpılırdı.
 */
export function DelegatePicker({ id, value, onChange, state, describedBy, initialQuery = "" }) {
  const { t } = useLocale()
  const listId = useId()
  // Anlat'tan gelen ad aramaya yazılı gelir; odaklanınca öneriler açılır, kişiyi kişi seçer.
  const [text, setText] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const recent = useRecentPeople(true)
  const remote = usePeopleSearch(open ? text : "", true)

  const matches = useMemo(() => {
    const q = fold(text.trim())
    if (q.length < 2) return []
    const seen = new Set()
    const out = []
    for (const p of [...recent, ...remote]) {
      const address = (p.upn || p.address || "").trim()
      const key = address.toLowerCase()
      if (!address || seen.has(key)) continue
      if (!(fold(p.name).includes(q) || fold(p.address).includes(q) || fold(address).includes(q)))
        continue
      seen.add(key)
      out.push({ name: p.name || address, address, mail: p.address })
      if (out.length === MAX) break
    }
    return out
  }, [text, recent, remote])
  const photos = usePeoplePhotos([...matches.map((p) => p.mail), value?.address].filter(Boolean))
  const photoOf = (a) => (a ? (photos.get(a.toLowerCase()) ?? null) : null)

  const shown = open && matches.length > 0
  const pick = (p) => {
    onChange({ name: p.name, address: p.address })
    setText("")
    setOpen(false)
  }
  const typed = () => {
    const raw = text.trim()
    if (EMAIL_RE.test(raw)) pick({ name: raw, address: raw })
  }

  if (value)
    return (
      <FieldTile
        as="div"
        icon={UserIcon}
        tone="violet"
        label={t("selfService.erp.delegate.person")}
        labelId={`${id}-label`}
        state={state === "error" ? "error" : "done"}
        trailing={
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("selfService.erp.delegate.clear")}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-10"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2.2} />
          </button>
        }
      >
        <span id={`${id}-value`} className="flex min-w-0 items-center gap-2">
          <Avatar
            photo={photoOf(value.address)}
            name={value.name}
            className="size-5 text-[0.5625rem]"
          />
          <span className="truncate text-[0.9375rem] font-semibold leading-5 tracking-[-0.005em]">
            {value.name}
          </span>
          {value.name !== value.address && (
            <span className="truncate text-[0.8125rem] text-muted-foreground">{value.address}</span>
          )}
        </span>
      </FieldTile>
    )

  return (
    <div>
      <FieldTile
        as="label"
        htmlFor={id}
        icon={UserIcon}
        tone="violet"
        label={t("selfService.erp.delegate.person")}
        labelId={`${id}-label`}
        state={state}
        open={shown}
      >
        <input
          id={id}
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown ? `${listId}-${active}` : undefined}
          aria-labelledby={`${id}-label`}
          aria-invalid={state === "error" ? true : undefined}
          aria-describedby={describedBy}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false)
            typed()
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              if (!shown) return
              e.preventDefault()
              const step = e.key === "ArrowDown" ? 1 : -1
              setActive((i) => (i + step + matches.length) % matches.length)
            } else if (e.key === "Enter") {
              e.preventDefault()
              if (shown) pick(matches[active] ?? matches[0])
              else typed()
            } else if (e.key === "Escape" && shown) {
              // Liste kapanır, pencere değil.
              e.stopPropagation()
              e.preventDefault()
              setOpen(false)
            }
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder={t("selfService.erp.delegate.placeholder")}
          className="no-ios-zoom h-5 w-full min-w-0 bg-transparent p-0 text-[0.9375rem] font-semibold leading-5 tracking-[-0.005em] outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
      </FieldTile>
      {shown && (
        <ul
          id={listId}
          role="listbox"
          className="mt-1.5 rounded-[0.875rem] bg-popover p-1 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
        >
          {matches.map((p, i) => (
            <li
              key={p.address}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // `onMouseDown` + preventDefault: tıklama bitmeden alan blur olup listeyi kapatırdı.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[0.625rem] px-2.5 py-2 pointer-coarse:min-h-12",
                i === active && "bg-foreground/[0.05]",
              )}
            >
              <Avatar photo={photoOf(p.mail)} name={p.name} className="size-8 text-[0.6875rem]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-medium leading-tight">
                  {p.name}
                </span>
                <span className="block truncate text-[0.75rem] leading-tight text-muted-foreground">
                  {p.address}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
