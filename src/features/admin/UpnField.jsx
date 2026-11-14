import { useId, useMemo, useState } from "react"
import { usePeopleSearch, useRecentPeople } from "@/hooks/useRecentPeople"
import { useLocale } from "@/hooks/useLocale"
import { fold } from "@/lib/fold"
import { cn } from "@/lib/utils"

/**
 * Yeni yetki kaydının KULLANICI alanı — tek bir giriş adresi (UPN), yazarken kişi önerir.
 * Öneriler izin formu gönderiminin (`RecipientField`) iki kaynağından: yazıştığın kişiler
 * (`useRecentPeople`) ve şirket dizini (`usePeopleSearch`; izin yoksa sessizce boş). Seçince
 * alan kişinin GİRİŞ adresiyle dolar: dizin sonucunda `upn` varsa o, yoksa posta adresi.
 *
 * Liste alanın ALTINDA, akışta (kutunun gövdesi kayar): yüzen bir liste kayan gövdede
 * kırpılırdı. Kaydı zaten olan kişi işaretlenir (seçilebilir; uyarıyı alan zaten veriyor).
 * Klavye: ↑ ↓ gezinir, Enter seçer, Esc listeyi kapatır (kutuyu değil — `BrandDialog`
 * açık listede Esc'i kutuya bırakmıyor).
 */
const MAX = 6

/**
 * ⚠️ **YAPIŞTIRMA TEMİZLİĞİ.** Yönetici bu alana panodan yapıştırıyor ve
 * pano nadiren temiz geliyor: Outlook `Ad Soyad <a@b.example>` veriyor, Entra
 * portalı `mailto:` öneki ya da sondaki boşlukla kopyalıyor. Bunlar
 * temizlenmezse satır o hâliyle yazılıyor ve kişi SESSİZCE yetkisiz
 * kalıyor — hata çıkmıyor, yalnızca hiçbir şey göremiyor.
 *
 * Temizlik yazarken değil YAPIŞTIRIRKEN yapılıyor: kullanıcının kendi
 * yazdığı harfleri anında değiştirmek, imleci zıplatan ve ne olduğu
 * anlaşılmayan bir alan üretir.
 */
function cleanPastedUpn(raw) {
  let v = String(raw ?? "").trim()
  const angled = v.match(/<([^>]+)>/)
  if (angled) v = angled[1]
  return v.replace(/^mailto:/i, "").trim()
}

export function UpnField({
  id,
  value,
  onChange,
  onFocusChange,
  disabled,
  warn,
  taken,
  placeholder,
}) {
  const { t } = useLocale()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const recent = useRecentPeople(true)
  const remote = usePeopleSearch(open ? value : "", true)

  const matches = useMemo(() => {
    const q = fold(value.trim())
    if (q.length < 2) return []
    const seen = new Set()
    const out = []
    for (const p of [...recent, ...remote]) {
      const login = (p.upn || p.address || "").trim()
      const key = login.toLowerCase()
      if (!login || seen.has(key)) continue
      if (!(fold(p.name).includes(q) || fold(p.address).includes(q) || fold(login).includes(q)))
        continue
      // Yazılan zaten tam olarak bu adresse öneri gereksiz.
      if (key === value.trim().toLowerCase()) continue
      seen.add(key)
      out.push({ name: p.name || login, login })
      if (out.length === MAX) break
    }
    return out
  }, [value, recent, remote])

  const shown = open && matches.length > 0
  const pick = (p) => {
    onChange(p.login)
    setOpen(false)
  }

  return (
    <div>
      <input
        id={id}
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={shown ? `${listId}-${active}` : undefined}
        aria-invalid={warn ? true : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onPaste={(e) => {
          const text = e.clipboardData?.getData("text")
          const cleaned = cleanPastedUpn(text)
          if (cleaned && cleaned !== text.trim()) {
            e.preventDefault()
            onChange(cleaned)
          }
        }}
        onFocus={() => {
          setOpen(true)
          onFocusChange?.(true)
        }}
        onBlur={() => {
          setOpen(false)
          onFocusChange?.(false)
        }}
        onKeyDown={(e) => {
          if (!shown) return
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            const step = e.key === "ArrowDown" ? 1 : -1
            setActive((i) => (i + step + matches.length) % matches.length)
          } else if (e.key === "Enter") {
            e.preventDefault()
            pick(matches[active] ?? matches[0])
          } else if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          "no-ios-zoom h-9 w-full rounded-lg border bg-background px-2.5 text-[0.8125rem] tracking-[0.015em] tabular-nums [font-variant-ligatures:none] outline-none transition",
          warn
            ? "border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/30"
            : "border-border focus-visible:ring-2 focus-visible:ring-brand/40",
        )}
      />
      {shown && (
        <ul
          id={listId}
          role="listbox"
          className="mt-1.5 rounded-lg border border-border/70 bg-popover p-1 shadow-sm"
        >
          {matches.map((p, i) => (
            <li
              key={p.login}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // `onMouseDown` + preventDefault: tıklama tamamlanmadan alan blur olup listeyi
              // kapatırdı (izin formundaki `RecipientField`in aynı dersi).
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 [@media(pointer:coarse)]:min-h-11",
                i === active && "bg-accent/70",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium leading-tight">
                  {p.name}
                </span>
                <span className="block truncate text-[0.6875rem] leading-tight text-muted-foreground">
                  {p.login}
                </span>
              </span>
              {taken?.has(p.login.toLowerCase()) && (
                <span className="shrink-0 rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[0.6875rem] font-medium text-amber-700 dark:text-amber-400">
                  {t("authz.new.hasRecord")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
