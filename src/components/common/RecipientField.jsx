import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useMe } from "@/hooks/useMe"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePeopleSearch } from "@/hooks/useRecentPeople"
import { fold } from "@/lib/fold"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Kişi çipleri + serbest giriş. Ad da yazılabilir ama adresi olmayan satır
 * gönderilmez; çağıran `unresolvedRecipients` ile uyarır.
 *
 * Öneriler iki kaynaktan: yazıştığın kişiler (`suggestions`) ve şirket
 * dizini (`usePeopleSearch`; `directory` kapalıysa hiç sorulmaz). Dizin izni
 * yoksa arama sessizce boş döner, yerel liste tek başına çalışır.
 */
/** Çipin baş harfleri: ad soyad → iki harf, adres → ilk harf. */
const initials = (name) =>
  String(name || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr"))
    .join("")

export function RecipientField({
  id,
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  directory = true,
  inline = false,
  action = null,
}) {
  const [text, setText] = useState("")
  const inputRef = useRef(null)
  const remote = usePeopleSearch(text, directory)
  // Satır kipinde çipte kişinin gerçek fotoğrafı (yoksa baş harfler); kendi fotoğrafın oturumdan.
  const me = useMe()
  const photos = usePeoplePhotos(inline ? value.map((p) => p.address) : [])
  const photoOf = (p) => {
    const a = (p.address || "").trim().toLowerCase()
    if (!a) return null
    if (me?.photoUrl && a === (me.email || "").toLowerCase()) return me.photoUrl
    return photos.get(a) ?? null
  }

  // ⚠️ Katlama `fold`, düz `toLowerCase()` DEĞİL: "PINAR".toLowerCase()
  // "pinar" verir ama "Ayşe" "pınar" kalır — "pinar" yazan Ayşe'ı
  // bulamıyordu. Yerel eşleşmeler ÖNCE (yazıştığın kişi dizindeki adaşından
  // önce gelmeli), dizin sonuçları arkadan; adres küçük harfle tekilleşir.
  const matches = useMemo(() => {
    const q = fold(text)
    if (q.length < 2) return []
    const taken = new Set(value.map((v) => (v.address || "").toLowerCase()))
    const local = suggestions.filter(
      (p) =>
        !taken.has(p.address.toLowerCase()) &&
        (fold(p.name).includes(q) || fold(p.address).includes(q)),
    )
    const seen = new Set(local.map((p) => p.address.toLowerCase()))
    const extra = remote.filter((p) => {
      const k = p.address.toLowerCase()
      if (taken.has(k) || seen.has(k)) return false
      seen.add(k)
      return true
    })
    return [...local, ...extra].slice(0, 6)
  }, [text, suggestions, remote, value])

  const add = (entry) => {
    const trimmed = typeof entry === "string" ? entry.trim().replace(/[;,]$/, "") : null
    const next = trimmed ? { name: trimmed, address: EMAIL_RE.test(trimmed) ? trimmed : "" } : entry
    if (!next || (!next.address && !next.name)) return
    if (value.some((v) => (v.address || v.name) === (next.address || next.name))) return
    onChange([...value, next])
    setText("")
  }

  // `inline`: posta penceresinin satırı — etiket solda, kişiler baş harfli yuvarlak çipler,
  // kutu çizgisi yok (satırları ayıran ince çizgi çağıranın); `action` satırın sağ ucunda.
  const row = (
    <div
      className={cn(
        "flex min-h-9 min-w-0 flex-wrap items-center",
        inline
          ? "flex-1 gap-1.5"
          : "gap-1 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand/30",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((p) => (
        <span
          key={p.address || p.name}
          title={inline ? p.address || undefined : undefined}
          className={cn(
            "inline-flex items-center",
            inline
              ? "gap-1.5 rounded-full border border-border/80 bg-background py-0.5 pe-1.5 ps-0.5 text-[0.8125rem] font-medium text-foreground shadow-xs"
              : "gap-1 rounded-md bg-brand/10 px-1.5 py-0.5 text-[0.71875rem] text-brand-ink",
          )}
        >
          {inline &&
            (photoOf(p) ? (
              <img
                src={photoOf(p)}
                alt=""
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full object-cover ring-1 ring-black/5"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-full bg-brand/[0.14] text-[0.625rem] font-semibold text-brand-ink"
              >
                {initials(p.name || p.address)}
              </span>
            ))}
          {p.name}
          <button
            type="button"
            aria-label={p.name}
            onClick={(e) => {
              e.stopPropagation()
              onChange(value.filter((v) => v !== p))
            }}
            className="grid size-4 place-items-center rounded-full opacity-50 transition hover:bg-foreground/[0.06] hover:opacity-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2.4} />
          </button>
        </span>
      ))}
      <input
        id={id}
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter / virgül / noktalı virgül çipe çevirir; boşken geri silme
          // son çipi alır — her posta istemcisinin davranışı.
          if (e.key === "Enter" || e.key === "," || e.key === ";") {
            e.preventDefault()
            add(matches[0] ?? text)
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => text.trim() && add(text)}
        placeholder={value.length ? "" : placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70",
          inline ? "min-w-[5rem] text-[0.8125rem]" : "min-w-[8rem] text-[0.78125rem]",
        )}
      />
    </div>
  )

  return (
    <div className={inline ? "py-2.5" : "space-y-1.5"}>
      {inline ? (
        <div className="flex items-start gap-3">
          <Label
            htmlFor={id}
            className="mt-2.5 w-16 shrink-0 text-[0.8125rem] font-normal text-muted-foreground"
          >
            {label}
          </Label>
          {row}
          {action && <div className="mt-1.5 shrink-0">{action}</div>}
        </div>
      ) : (
        <>
          <Label htmlFor={id} className="text-[0.71875rem] text-muted-foreground">
            {label}
          </Label>
          {row}
        </>
      )}
      {matches.length > 0 && (
        <ul className="rounded-lg border border-border/60 bg-popover p-1 shadow-sm">
          {matches.map((p) => (
            <li key={p.address}>
              <button
                type="button"
                // `onMouseDown` + preventDefault ŞART: tıklama tamamlanmadan
                // input blur oluyor, blur da yazılan ham metni ("pınar")
                // çipe çeviriyordu — seçilen kişinin ADRESİ böyle kaybolup
                // yerine çözümlenemez bir ad kalıyordu (sahada görüldü).
                // Odak korununca blur hiç çalışmıyor ve seçim ayakta kalıyor.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(p)}
                className="flex w-full flex-col items-start rounded-md px-2 py-1 text-left hover:bg-accent/60"
              >
                <span className="text-[0.75rem] font-medium leading-tight">{p.name}</span>
                <span className="text-[0.65625rem] leading-tight text-muted-foreground">
                  {p.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
